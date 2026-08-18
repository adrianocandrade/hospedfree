<?php

namespace App\Hosting\Actions;

use App\Hosting\Contracts\HostingProvider;
use App\Hosting\Enums\HostingAccountStatus;
use App\Hosting\Enums\HostingOrderStatus;
use App\Hosting\Enums\HostingPlanType;
use App\Hosting\Jobs\ProvisionHostingOrder;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Models\HostingOrder;
use App\Hosting\Models\HostingPremiumSubdomain;
use App\Hosting\Models\HostingPlan;
use App\Hosting\Models\HostingZone;
use App\Hosting\Services\HostingDomainService;
use App\Hosting\Services\HostingFreeSlot;
use App\Hosting\Services\HostingPremiumSubdomainService;
use App\Models\User;
use Common\Billing\Models\Price;
use Common\Billing\Subscription;
use Common\Workspaces\Models\Workspace;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class CreateHostingOrder
{
    public function __construct(
        private HostingProvider $provider,
        private HostingDomainService $domains,
        private HostingFreeSlot $freeSlots,
        private HostingPremiumSubdomainService $premiumSubdomains,
    ) {}

    public function execute(
        User $user,
        Workspace $workspace,
        HostingPlan $plan,
        HostingZone $zone,
        string $subdomain,
        string $idempotencyKey,
        ?Price $price = null,
        ?Subscription $subscription = null,
    ): HostingOrder {
        if (!config('hospedfree.enabled')) {
            throw ValidationException::withMessages([
                'hosting' => __(
                    'Hosting account creation is currently unavailable.',
                ),
            ]);
        }

        $plan->loadMissing(['product', 'providerPackages']);

        if (
            !$plan->is_active ||
            ($plan->type === HostingPlanType::Free && !$plan->product?->free) ||
            ($plan->type === HostingPlanType::Paid &&
                ($plan->product?->free || !config('hospedfree.paid_enabled')))
        ) {
            throw ValidationException::withMessages([
                'hosting_plan_id' => __('This hosting plan is not available.'),
            ]);
        }

        if ($plan->type === HostingPlanType::Paid) {
            $this->assertPaidRequest($user, $plan, $price, $subscription);
        }

        $providerPackage = $plan->packageFor($this->provider->key());

        if (!$providerPackage) {
            throw ValidationException::withMessages([
                'hosting_plan_id' => __(
                    'This hosting plan is not ready for provisioning.',
                ),
            ]);
        }

        $subdomain = $this->domains->normalizeSubdomain($subdomain);
        $fqdn = $this->domains->fqdn($subdomain, $zone);
        $requestFingerprint = $this->requestFingerprint(
            $user,
            $workspace,
            $plan,
            $zone,
            $subdomain,
            $fqdn,
            $price,
            $subscription,
        );

        $existingOrder = HostingOrder::query()
            ->where('idempotency_key', $idempotencyKey)
            ->first();

        if ($existingOrder) {
            return $this->assertIdempotentReplay(
                $existingOrder,
                $user,
                $requestFingerprint,
            );
        }

        $this->domains->checkAvailability($subdomain, $zone);

        try {
            $created = false;
            $order = DB::transaction(function () use (
                $user,
                $workspace,
                $plan,
                $zone,
                $subdomain,
                $fqdn,
                $idempotencyKey,
                $price,
                $subscription,
                $requestFingerprint,
                &$created,
            ): HostingOrder {
                Workspace::query()
                    ->whereKey($workspace->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $existingOrder = HostingOrder::query()
                    ->where('idempotency_key', $idempotencyKey)
                    ->lockForUpdate()
                    ->first();

                if ($existingOrder) {
                    return $this->assertIdempotentReplay(
                        $existingOrder,
                        $user,
                        $requestFingerprint,
                    );
                }

                $premiumSubdomain = $this->premiumSubdomains->claimForUse(
                    $user,
                    $subdomain,
                    $zone,
                );

                $activeAccountCount = HostingAccount::query()
                    ->where('workspace_id', $workspace->id)
                    ->where('hosting_plan_id', $plan->id)
                    ->where('status', '!=', HostingAccountStatus::Deleted)
                    ->count();

                $pendingAccountCount = HostingOrder::query()
                    ->where('workspace_id', $workspace->id)
                    ->where('hosting_plan_id', $plan->id)
                    ->paymentWindowActive()
                    ->whereDoesntHave('account')
                    ->count();

                if (
                    $activeAccountCount + $pendingAccountCount >=
                    $plan->max_accounts_per_workspace
                ) {
                    throw ValidationException::withMessages([
                        'hosting_plan_id' => __(
                            'This account already reached the hosting limit for this plan.',
                        ),
                    ]);
                }

                $freeSlot = null;
                if ($plan->type === HostingPlanType::Free) {
                    $freeSlot = $this->freeSlots->nextAvailable(
                        $workspace->id,
                        $plan->max_accounts_per_workspace,
                    );

                    if (!$freeSlot) {
                        throw ValidationException::withMessages([
                            'hosting_plan_id' => __(
                                'This account already reached the free hosting limit.',
                            ),
                        ]);
                    }
                }

                $this->domains->assertLocallyAvailable($fqdn);

                $awaitingPayment =
                    $plan->type === HostingPlanType::Paid && !$subscription;
                $status = $awaitingPayment
                    ? HostingOrderStatus::AwaitingPayment
                    : ($plan->type === HostingPlanType::Paid
                        ? HostingOrderStatus::Paid
                        : HostingOrderStatus::Requested);

                $order = HostingOrder::create([
                    'uuid' => (string) Str::uuid7(),
                    'workspace_id' => $workspace->id,
                    'user_id' => $user->id,
                    'hosting_plan_id' => $plan->id,
                    'product_id' => $plan->product_id,
                    'price_id' => $price?->id,
                    'subscription_id' => $subscription?->id,
                    'hosting_zone_id' => $zone->id,
                    'premium_subdomain_id' => $premiumSubdomain?->id,
                    'subdomain' => $subdomain,
                    'fqdn' => $fqdn,
                    'domain_reservation_key' => $fqdn,
                    'idempotency_key' => $idempotencyKey,
                    'request_fingerprint' => $requestFingerprint,
                    'status' => $status,
                    'paid_at' => $subscription ? now() : null,
                    'expires_at' => $awaitingPayment
                        ? now()->addMinutes(
                            (int) config(
                                'hospedfree.order_payment_window_minutes',
                                30,
                            ),
                        )
                        : null,
                ]);
                $created = true;

                if (!$awaitingPayment) {
                    HostingAccount::create([
                        'uuid' => (string) Str::uuid7(),
                        'hosting_order_id' => $order->id,
                        'workspace_id' => $workspace->id,
                        'user_id' => $user->id,
                        'hosting_plan_id' => $plan->id,
                        'product_id' => $plan->product_id,
                        'price_id' => $price?->id,
                        'subscription_id' => $subscription?->id,
                        'hosting_zone_id' => $zone->id,
                        'premium_subdomain_id' => $premiumSubdomain?->id,
                        'provider' => $this->provider->key(),
                        'fqdn' => $fqdn,
                        'active_domain' => $fqdn,
                        'free_slot' => $freeSlot,
                        'status' => HostingAccountStatus::Pending,
                        'desired_status' => HostingAccountStatus::Active,
                    ]);
                }

                return $order;
            }, attempts: 3);
        } catch (QueryException $e) {
            if (in_array((string) $e->getCode(), ['23000', '23505'], true)) {
                $existingOrder = HostingOrder::query()
                    ->where('idempotency_key', $idempotencyKey)
                    ->first();

                if ($existingOrder) {
                    return $this->assertIdempotentReplay(
                        $existingOrder,
                        $user,
                        $requestFingerprint,
                    );
                }

                if (
                    $subscription &&
                    ($this->subscriptionHasOrder($subscription) ||
                        $this->subscriptionHasAccount($subscription))
                ) {
                    throw ValidationException::withMessages([
                        'subscription_id' => __(
                            'This subscription is already assigned to another hosting account.',
                        ),
                    ]);
                }

                throw ValidationException::withMessages([
                    'subdomain' => __(
                        'This address or free hosting slot was just reserved. Refresh and try another one.',
                    ),
                ]);
            }

            throw $e;
        }

        if ($created && $order->account()->exists()) {
            ProvisionHostingOrder::dispatch($order->id)->afterCommit();
        }

        return $order->fresh(['account', 'plan.product']);
    }

    private function assertPaidRequest(
        User $user,
        HostingPlan $plan,
        ?Price $price,
        ?Subscription $subscription,
    ): void {
        if (!$price || $price->product_id !== $plan->product_id) {
            throw ValidationException::withMessages([
                'price_id' => __(
                    'Choose a valid billing cycle for this hosting plan.',
                ),
            ]);
        }

        if (!$subscription) {
            $hasCheckoutGateway =
                ((bool) settings('billing.stripe.enable') &&
                    filled($price->stripe_id)) ||
                ((bool) settings('billing.paypal.enable') &&
                    filled($price->paypal_id));

            if (!$hasCheckoutGateway) {
                throw ValidationException::withMessages([
                    'price_id' => __(
                        'Checkout is not configured for this hosting plan.',
                    ),
                ]);
            }

            return;
        }

        if (
            $subscription->user_id !== $user->id ||
            $subscription->product_id !== $plan->product_id ||
            $subscription->price_id !== $price->id ||
            !$subscription->valid() ||
            filled($subscription->checkout_reference) ||
            HostingPremiumSubdomain::query()
                ->where('subscription_id', $subscription->id)
                ->exists() ||
            $this->subscriptionHasOrder($subscription) ||
            $this->subscriptionHasAccount($subscription)
        ) {
            throw ValidationException::withMessages([
                'subscription_id' => __(
                    'A confirmed subscription is required for this hosting plan.',
                ),
            ]);
        }
    }

    private function requestFingerprint(
        User $user,
        Workspace $workspace,
        HostingPlan $plan,
        HostingZone $zone,
        string $subdomain,
        string $fqdn,
        ?Price $price,
        ?Subscription $subscription,
    ): string {
        return hash(
            'sha256',
            json_encode(
                [
                    'user_id' => $user->id,
                    'workspace_id' => $workspace->id,
                    'hosting_plan_id' => $plan->id,
                    'product_id' => $plan->product_id,
                    'hosting_zone_id' => $zone->id,
                    'subdomain' => $subdomain,
                    'fqdn' => $fqdn,
                    'price_id' => $price?->id,
                    'subscription_id' => $subscription?->id,
                ],
                JSON_THROW_ON_ERROR,
            ),
        );
    }

    private function assertIdempotentReplay(
        HostingOrder $order,
        User $user,
        string $requestFingerprint,
    ): HostingOrder {
        if (
            $order->user_id !== $user->id ||
            !$order->request_fingerprint ||
            !hash_equals($order->request_fingerprint, $requestFingerprint)
        ) {
            throw new ConflictHttpException(
                __(
                    'This idempotency key was already used for a different hosting request.',
                ),
            );
        }

        return $order;
    }

    private function subscriptionHasOrder(Subscription $subscription): bool
    {
        return HostingOrder::query()
            ->where('subscription_id', $subscription->id)
            ->exists();
    }

    private function subscriptionHasAccount(Subscription $subscription): bool
    {
        return HostingAccount::withTrashed()
            ->where('subscription_id', $subscription->id)
            ->exists();
    }
}
