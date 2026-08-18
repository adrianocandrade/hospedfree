<?php

namespace App\Hosting\Controllers;

use App\Hosting\Enums\HostingAccountStatus;
use App\Hosting\Enums\ProviderOperationType;
use App\Hosting\Jobs\RunHostingAccountOperation;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Models\HostingOrder;
use App\Hosting\Models\HostingProviderOperation;
use App\Hosting\Resources\HostingAccountResource;
use App\Hosting\Services\HostingToolsService;
use App\Hosting\Services\HostingToolLaunchTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use App\Hosting\Enums\HostingPlanType;
use App\Hosting\Models\HostingPlan;
use Common\Billing\Models\Price;
use Common\Billing\Subscription;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class HostingAccountsController
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $accounts = HostingAccount::query()
            ->where('user_id', $request->user()->id)
            ->with('plan.product')
            ->latest()
            ->paginate(20);

        return HostingAccountResource::collection($accounts);
    }

    public function show(Request $request, int $account): HostingAccountResource
    {
        return new HostingAccountResource(
            $this->ownedAccount($request, $account)->load('plan.product'),
        );
    }

    public function revealCredentials(
        Request $request,
        int $account,
    ): JsonResponse {
        $hosting = $this->ownedAccount($request, $account);
        abort_unless(
            $hosting->credential_secret && $hosting->username,
            409,
            'Credentials are not available yet.',
        );

        return response()
            ->json([
                'username' => $hosting->username,
                'password' => $hosting->credential_secret,
            ])
            ->header('Cache-Control', 'no-store, private');
    }

    public function resetPassword(Request $request, int $account): JsonResponse
    {
        $hosting = $this->ownedAccount($request, $account);
        abort_unless(
            $hosting->status === HostingAccountStatus::Active,
            409,
            'The hosting account is not active.',
        );

        RunHostingAccountOperation::dispatch(
            $hosting->id,
            ProviderOperationType::ChangePassword,
            "password:{$hosting->uuid}:" . Str::uuid7(),
            actorUserId: $request->user()->id,
        );

        return response()->json(['message' => 'Password reset queued.'], 202);
    }

    public function reconcile(Request $request, int $account): JsonResponse
    {
        $hosting = $this->ownedAccount($request, $account);
        abort_unless(
            in_array(
                $hosting->status,
                [
                    HostingAccountStatus::Provisioning,
                    HostingAccountStatus::Active,
                    HostingAccountStatus::Suspended,
                    HostingAccountStatus::Failed,
                    HostingAccountStatus::ActionRequired,
                    HostingAccountStatus::PendingDowngrade,
                ],
                true,
            ),
            409,
            'This hosting account cannot be synchronized.',
        );
        abort_unless(
            $hosting->provider_account_id && $hosting->username,
            409,
            'The remote hosting account is not configured yet.',
        );

        RunHostingAccountOperation::dispatch(
            $hosting->id,
            ProviderOperationType::Reconcile,
            "reconcile:{$hosting->uuid}:" . now()->format('YmdHi'),
            actorUserId: $request->user()->id,
        );

        return response()->json(
            ['message' => 'Hosting synchronization queued.'],
            202,
        );
    }

    public function suspend(Request $request, int $account): JsonResponse
    {
        $hosting = $this->ownedAccount($request, $account);

        if ($hosting->status === HostingAccountStatus::Suspended) {
            return response()->json([
                'message' => 'Hosting account is already inactive.',
            ]);
        }

        abort_unless(
            $hosting->status === HostingAccountStatus::Active,
            409,
            'Only an active hosting account can be deactivated.',
        );
        abort_unless(
            $hosting->provider_account_id,
            409,
            'The remote hosting account is not configured yet.',
        );

        if ($hosting->desired_status !== HostingAccountStatus::Suspended) {
            $hosting->desired_status = HostingAccountStatus::Suspended;
            $hosting->save();
        }

        RunHostingAccountOperation::dispatch(
            $hosting->id,
            ProviderOperationType::Suspend,
            $this->lifecycleOperationKey(
                $hosting,
                ProviderOperationType::Suspend,
                ProviderOperationType::Unsuspend,
            ),
            actorUserId: $request->user()->id,
        );

        return response()->json(
            ['message' => 'Hosting deactivation queued.'],
            202,
        );
    }

    public function unsuspend(Request $request, int $account): JsonResponse
    {
        $hosting = $this->ownedAccount($request, $account);

        if ($hosting->status === HostingAccountStatus::Active) {
            return response()->json([
                'message' => 'Hosting account is already active.',
            ]);
        }

        abort_unless(
            $hosting->status === HostingAccountStatus::Suspended,
            409,
            'Only an inactive hosting account can be reactivated.',
        );
        abort_unless(
            $hosting->provider_account_id,
            409,
            'The remote hosting account is not configured yet.',
        );

        if ($hosting->desired_status !== HostingAccountStatus::Active) {
            $hosting->desired_status = HostingAccountStatus::Active;
            $hosting->save();
        }

        RunHostingAccountOperation::dispatch(
            $hosting->id,
            ProviderOperationType::Unsuspend,
            $this->lifecycleOperationKey(
                $hosting,
                ProviderOperationType::Unsuspend,
                ProviderOperationType::Suspend,
            ),
            actorUserId: $request->user()->id,
        );

        return response()->json(
            ['message' => 'Hosting reactivation queued.'],
            202,
        );
    }

    public function tools(
        Request $request,
        int $account,
        HostingToolsService $tools,
    ): JsonResponse {
        $hosting = $this->ownedAccount($request, $account);

        return response()->json(['data' => $tools->catalog($hosting)]);
    }

    public function tool(
        Request $request,
        int $account,
        string $tool,
        HostingToolsService $tools,
        ?HostingToolLaunchTicket $tickets = null,
    ): JsonResponse {
        $hosting = $this->ownedAccount($request, $account);
        abort_unless(
            $hosting->status === HostingAccountStatus::Active,
            409,
            'The hosting account is not active.',
        );

        $entry = collect($tools->catalog($hosting))->firstWhere('key', $tool);
        abort_unless(
            $entry && $entry['available'],
            404,
            'This tool is not configured.',
        );
        $domain = null;

        if ($tool === 'site-builder') {
            $validated = $request->validate([
                'domain' => ['nullable', 'string', 'max:253'],
            ]);
            $domain = strtolower(
                (string) ($validated['domain'] ??
                    ($hosting->active_domain ?: $hosting->fqdn)),
            );

            abort_unless(
                in_array(
                    $domain,
                    [
                        strtolower($hosting->fqdn),
                        strtolower($hosting->active_domain ?: $hosting->fqdn),
                    ],
                    true,
                ) ||
                    $hosting
                        ->domains()
                        ->where('domain', $domain)
                        ->where('status', 'active')
                        ->exists(),
                404,
                'This domain is not active on the hosting account.',
            );
        }

        $ticket = ($tickets ?? app(HostingToolLaunchTicket::class))->issue(
            $request->user()->id,
            $hosting->id,
            $tool,
            $domain,
        );

        return response()
            ->json([
                'url' => route(
                    'hosting.tools.launch',
                    ['ticket' => $ticket['token']],
                    false,
                ),
                'expires_at' => $ticket['expires_at'],
            ])
            ->header('Cache-Control', 'no-store, private');
    }

    public function destroy(Request $request, int $account): JsonResponse
    {
        $hosting = $this->ownedAccount($request, $account);

        if ($hosting->status === HostingAccountStatus::PendingDeletion) {
            return response()->json(['deletes_at' => $hosting->deletes_at]);
        }

        abort_unless(
            $hosting->status === HostingAccountStatus::Suspended &&
                $hosting->provider_account_id &&
                $hosting->suspended_at,
            409,
            'Deactivate this hosting account before deleting it.',
        );

        $data = $request->validate([
            'confirmation' => ['required', 'string', 'max:300'],
        ]);
        $expectedConfirmation = "EXCLUIR {$hosting->fqdn}";

        if (!hash_equals($expectedConfirmation, $data['confirmation'])) {
            throw ValidationException::withMessages([
                'confirmation' => __(
                    'Type the requested confirmation text exactly.',
                ),
            ]);
        }

        if ($hosting->desired_status === HostingAccountStatus::Deleted) {
            return response()->json(
                ['message' => __('Hosting account deletion queued.')],
                202,
            );
        }

        $hosting
            ->fill([
                'deletion_requested_at' => now(),
                'deletes_at' => null,
                'desired_status' => HostingAccountStatus::Deleted,
            ])
            ->save();

        RunHostingAccountOperation::dispatch(
            $hosting->id,
            ProviderOperationType::Delete,
            "delete:{$hosting->uuid}",
            actorUserId: $request->user()->id,
        );

        return response()->json(
            ['message' => __('Hosting account deletion queued.')],
            202,
        );
    }

    public function changePlan(Request $request, int $account): JsonResponse
    {
        abort_unless(config('hospedfree.paid_enabled'), 404);
        $hosting = $this->ownedAccount($request, $account);
        $data = $request->validate([
            'hosting_plan_id' => ['required', 'integer'],
            'price_id' => ['required', 'integer'],
            'subscription_id' => ['required', 'integer'],
        ]);
        abort_unless(
            $hosting->status === HostingAccountStatus::Active,
            409,
            'The hosting account is not active.',
        );
        $plan = HostingPlan::query()
            ->with(['product', 'providerPackages'])
            ->whereKey($data['hosting_plan_id'])
            ->where('type', HostingPlanType::Paid)
            ->where('is_active', true)
            ->firstOrFail();
        $price = Price::query()
            ->whereKey($data['price_id'])
            ->where('product_id', $plan->product_id)
            ->where('active', true)
            ->firstOrFail();
        $subscription = Subscription::query()
            ->whereKey($data['subscription_id'])
            ->where('user_id', $request->user()->id)
            ->where('product_id', $plan->product_id)
            ->where('price_id', $price->id)
            ->firstOrFail();

        DB::transaction(function () use (
            $hosting,
            $subscription,
            $plan,
            $request,
        ): void {
            $lockedHosting = HostingAccount::withTrashed()
                ->lockForUpdate()
                ->findOrFail($hosting->id);
            $lockedSubscription = Subscription::query()
                ->lockForUpdate()
                ->findOrFail($subscription->id);

            $usedByAnotherAccount = HostingAccount::withTrashed()
                ->where('subscription_id', $lockedSubscription->id)
                ->whereKeyNot($lockedHosting->id)
                ->exists();
            $usedByAnotherOrder = HostingOrder::query()
                ->where('subscription_id', $lockedSubscription->id)
                ->whereKeyNot($lockedHosting->hosting_order_id)
                ->exists();

            if (
                !$lockedSubscription->valid() ||
                $lockedSubscription->user_id !== $lockedHosting->user_id ||
                $lockedSubscription->product_id !== $plan->product_id ||
                ($lockedHosting->subscription_id &&
                    $lockedHosting->subscription_id !==
                        $lockedSubscription->id) ||
                $usedByAnotherAccount ||
                $usedByAnotherOrder
            ) {
                throw ValidationException::withMessages([
                    'subscription_id' => __(
                        'This subscription cannot be assigned to this hosting account.',
                    ),
                ]);
            }

            $lockedHosting
                ->fill([
                    'subscription_id' => $lockedSubscription->id,
                    'desired_status' => HostingAccountStatus::Active,
                ])
                ->save();
            RunHostingAccountOperation::dispatch(
                $lockedHosting->id,
                ProviderOperationType::ChangePackage,
                "upgrade:{$lockedHosting->uuid}:subscription:{$lockedSubscription->id}:product:{$plan->product_id}",
                $plan->id,
                $request->user()->id,
            )->afterCommit();
        }, attempts: 3);

        return response()->json(['message' => 'Hosting upgrade queued.'], 202);
    }

    public function cancelDeletion(
        Request $request,
        int $account,
    ): HostingAccountResource {
        $hosting = $this->ownedAccount($request, $account);
        abort_unless(
            $hosting->status === HostingAccountStatus::PendingDeletion &&
                $hosting->deletes_at?->isFuture(),
            409,
            'Deletion can no longer be cancelled.',
        );

        $restore = $hosting->suspended_at
            ? HostingAccountStatus::Suspended
            : HostingAccountStatus::Active;
        $hosting
            ->fill([
                'deletion_requested_at' => null,
                'deletes_at' => null,
                'desired_status' => $restore,
            ])
            ->save();
        $hosting->transitionTo(
            $restore,
            $request->user()->id,
            'Hosting account deletion cancelled.',
        );

        return new HostingAccountResource($hosting->load('plan.product'));
    }

    private function ownedAccount(Request $request, int $id): HostingAccount
    {
        $hosting = HostingAccount::query()
            ->whereKey($id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        Gate::authorize('view', $hosting);
        return $hosting;
    }

    private function lifecycleOperationKey(
        HostingAccount $account,
        ProviderOperationType $operation,
        ProviderOperationType $startsAfter,
    ): string {
        $cycle =
            HostingProviderOperation::query()
                ->where('hosting_account_id', $account->id)
                ->where('operation', $startsAfter)
                ->max('id') ?? 0;

        return "{$operation->value}:{$account->uuid}:{$cycle}";
    }
}
