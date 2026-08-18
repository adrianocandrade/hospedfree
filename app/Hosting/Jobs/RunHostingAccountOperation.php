<?php

namespace App\Hosting\Jobs;

use App\Hosting\Contracts\HostingProvider;
use App\Hosting\Data\ProviderResult;
use App\Hosting\Enums\HostingAccountStatus;
use App\Hosting\Enums\ProviderOperationStatus;
use App\Hosting\Enums\ProviderOperationType;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Models\HostingPlan;
use App\Hosting\Models\HostingOrder;
use App\Hosting\Models\HostingProviderOperation;
use App\Hosting\Services\SafeToolUrl;
use App\Hosting\Services\HostingPassword;
use App\Hosting\Services\HostingFreeSlot;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class RunHostingAccountOperation implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $uniqueFor = 900;

    public function __construct(
        public int $accountId,
        public ProviderOperationType $type,
        public string $idempotencyKey,
        public ?int $targetPlanId = null,
        public ?int $actorUserId = null,
    ) {}

    public function uniqueId(): string
    {
        return $this->idempotencyKey;
    }

    public function backoff(): array
    {
        return [15, 60, 300];
    }

    public function handle(
        HostingProvider $provider,
        SafeToolUrl $safeToolUrl,
        HostingFreeSlot $freeSlots,
    ): void {
        $account = HostingAccount::withTrashed()
            ->with(['plan.providerPackages'])
            ->findOrFail($this->accountId);

        if (
            !$account->provider_account_id ||
            $account->provider !== $provider->key()
        ) {
            $this->recordConfigurationFailure($account, $provider);
            return;
        }

        $operation = DB::transaction(function () use (
            $account,
            $provider,
        ): HostingProviderOperation {
            $locked = HostingAccount::withTrashed()
                ->lockForUpdate()
                ->findOrFail($account->id);
            $operation = HostingProviderOperation::query()->firstOrCreate(
                ['idempotency_key' => $this->idempotencyKey],
                [
                    'uuid' => (string) Str::uuid7(),
                    'hosting_order_id' => $locked->hosting_order_id,
                    'hosting_account_id' => $locked->id,
                    'provider' => $provider->key(),
                    'operation' => $this->type,
                    'request_fingerprint' => hash(
                        'sha256',
                        implode('|', [
                            $locked->uuid,
                            $this->type->value,
                            (string) $this->targetPlanId,
                        ]),
                    ),
                    'status' => ProviderOperationStatus::Queued,
                ],
            );

            if ($operation->status !== ProviderOperationStatus::Succeeded) {
                if (
                    $this->type === ProviderOperationType::Delete &&
                    $locked->status !== HostingAccountStatus::Deleting
                ) {
                    $locked->transitionTo(
                        HostingAccountStatus::Deleting,
                        $this->actorUserId,
                        'Hosting account deletion started.',
                    );
                }

                $operation
                    ->fill([
                        'status' => ProviderOperationStatus::Running,
                        'attempt_count' => $operation->attempt_count + 1,
                        'safe_code' => null,
                        'safe_message' => null,
                        'retry_after' => null,
                        'started_at' => now(),
                        'completed_at' => null,
                    ])
                    ->save();
            }

            return $operation;
        });

        if ($operation->status === ProviderOperationStatus::Succeeded) {
            return;
        }

        [$result, $generatedPassword, $targetPlan] = $this->callProvider(
            $provider,
            $account,
        );
        $terminalFailure =
            !$result->retryable || $this->attempts() >= $this->tries;

        DB::transaction(function () use (
            $account,
            $operation,
            $result,
            $generatedPassword,
            $targetPlan,
            $safeToolUrl,
            $terminalFailure,
            $freeSlots,
        ): void {
            $locked = HostingAccount::withTrashed()
                ->lockForUpdate()
                ->findOrFail($account->id);
            $lockedOperation = HostingProviderOperation::query()
                ->lockForUpdate()
                ->findOrFail($operation->id);

            $lockedOperation
                ->fill([
                    'status' => $result->success
                        ? ProviderOperationStatus::Succeeded
                        : ($result->retryable
                            ? ProviderOperationStatus::RetryableFailed
                            : ProviderOperationStatus::PermanentFailed),
                    'safe_code' => $result->code,
                    'safe_message' => $result->message,
                    'retry_after' => $result->retryable
                        ? now()->addMinute()
                        : null,
                    'completed_at' => now(),
                ])
                ->save();

            if (!$result->success) {
                if (
                    $terminalFailure &&
                    in_array(
                        $this->type,
                        [
                            ProviderOperationType::ChangePackage,
                            ProviderOperationType::Delete,
                        ],
                        true,
                    ) &&
                    $locked->status !== HostingAccountStatus::ActionRequired
                ) {
                    $locked->transitionTo(
                        HostingAccountStatus::ActionRequired,
                        $this->actorUserId,
                        $result->message,
                        [
                            'code' => $result->code,
                            'operation' => $this->type->value,
                            'notify_customer' => true,
                        ],
                    );
                }
                return;
            }

            $this->applySuccess(
                $locked,
                $result,
                $generatedPassword,
                $targetPlan,
                $safeToolUrl,
                $freeSlots,
            );
            $locked->last_synced_at = now();
            $locked->save();
        });

        if ($result->retryable && $this->attempts() < $this->tries) {
            throw new RuntimeException($result->code);
        }
    }

    /**
     * @return array{ProviderResult, ?string, ?HostingPlan}
     */
    private function callProvider(
        HostingProvider $provider,
        HostingAccount $account,
    ): array {
        $password = null;
        $targetPlan = null;

        $result = match ($this->type) {
            ProviderOperationType::Reconcile => $provider->getAccount(
                $account->provider_account_id,
                $account->username,
            ),
            ProviderOperationType::Suspend => $provider->suspendAccount(
                $account->provider_account_id,
            ),
            ProviderOperationType::Unsuspend => $provider->unsuspendAccount(
                $account->provider_account_id,
            ),
            ProviderOperationType::Delete => $provider->deleteAccount(
                $account->provider_account_id,
            ),
            ProviderOperationType::ChangePassword => $provider->changePassword(
                $account->provider_account_id,
                $password = HostingPassword::generate(),
            ),
            ProviderOperationType::ChangePackage => $this->changePackage(
                $provider,
                $account,
                $targetPlan,
            ),
            default => ProviderResult::failure(
                'unsupported_operation',
                'This provider operation is not supported for an existing account.',
            ),
        };

        return [$result, $password, $targetPlan];
    }

    private function changePackage(
        HostingProvider $provider,
        HostingAccount $account,
        ?HostingPlan &$targetPlan,
    ): ProviderResult {
        $targetPlan = HostingPlan::query()
            ->with(['product', 'providerPackages'])
            ->find($this->targetPlanId);
        $package = $targetPlan?->packageFor($provider->key());

        if (!$targetPlan || !$targetPlan->is_active || !$package) {
            return ProviderResult::failure(
                'provider_package_not_configured',
                'The target hosting plan is not configured for this provider.',
            );
        }

        return $provider->changePackage(
            $account->provider_account_id,
            $package->remote_package,
        );
    }

    private function applySuccess(
        HostingAccount $account,
        ProviderResult $result,
        ?string $generatedPassword,
        ?HostingPlan $targetPlan,
        SafeToolUrl $safeToolUrl,
        HostingFreeSlot $freeSlots,
    ): void {
        if ($this->type === ProviderOperationType::Reconcile) {
            $account
                ->fill(
                    array_filter(
                        [
                            'username' => $result->username,
                            'control_panel_url' => $safeToolUrl->validate(
                                $result->controlPanelUrl,
                            ),
                            'webftp_url' => $safeToolUrl->validate(
                                $result->webftpUrl,
                            ),
                            'installer_url' => $safeToolUrl->validate(
                                $result->installerUrl,
                            ),
                            'ftp_host' => $result->ftpHost,
                            'sql_host' => $result->sqlHost,
                        ],
                        fn(mixed $value) => $value !== null,
                    ),
                )
                ->save();

            if (
                in_array(
                    strtolower((string) $result->status),
                    ['active', 'activated', 'ready', '1'],
                    true,
                ) &&
                in_array(
                    $account->status,
                    [
                        HostingAccountStatus::Provisioning,
                        HostingAccountStatus::Failed,
                        HostingAccountStatus::ActionRequired,
                    ],
                    true,
                )
            ) {
                $account->transitionTo(
                    HostingAccountStatus::Active,
                    safeMessage: 'Hosting account reconciled as active.',
                );
                $order = HostingOrder::query()->find(
                    $account->hosting_order_id,
                );
                if ($order && $order->status->value === 'provisioning') {
                    $order->fulfilled_at = now();
                    $order->save();
                    $order->transitionTo(
                        \App\Hosting\Enums\HostingOrderStatus::Fulfilled,
                    );
                }
            }

            if (
                in_array(
                    strtolower((string) $result->status),
                    ['suspended'],
                    true,
                ) &&
                $account->status !== HostingAccountStatus::Suspended
            ) {
                $account
                    ->fill([
                        'suspended_at' => now(),
                        'desired_status' => HostingAccountStatus::Suspended,
                    ])
                    ->save();
                $account->transitionTo(
                    HostingAccountStatus::Suspended,
                    safeMessage: 'Hosting account reconciled as suspended.',
                );
            }

            if (
                in_array(
                    strtolower((string) $result->status),
                    ['deleted'],
                    true,
                ) &&
                !in_array(
                    $account->status,
                    [
                        HostingAccountStatus::Deleted,
                        HostingAccountStatus::ActionRequired,
                    ],
                    true,
                )
            ) {
                $account->transitionTo(
                    HostingAccountStatus::ActionRequired,
                    safeMessage: 'Remote hosting account appears deleted.',
                    metadata: ['code' => 'remote_account_deleted'],
                );
            }
            return;
        }

        if (
            $this->type === ProviderOperationType::Suspend &&
            $account->status === HostingAccountStatus::PendingDeletion
        ) {
            $account->suspended_at = now();
            $account->save();
            $account->events()->create([
                'actor_user_id' => $this->actorUserId,
                'event' => 'suspended_for_deletion',
                'safe_message' =>
                    'Hosting account suspended before permanent deletion.',
            ]);

            return;
        }

        if (
            $this->type === ProviderOperationType::Suspend &&
            $account->status !== HostingAccountStatus::Suspended
        ) {
            $account
                ->fill([
                    'suspended_at' => now(),
                    'desired_status' => HostingAccountStatus::Suspended,
                ])
                ->save();
            $account->transitionTo(
                HostingAccountStatus::Suspended,
                $this->actorUserId,
                'Hosting account suspended.',
            );
        }

        if (
            $this->type === ProviderOperationType::Unsuspend &&
            $account->status !== HostingAccountStatus::Active
        ) {
            $account
                ->fill([
                    'suspended_at' => null,
                    'desired_status' => HostingAccountStatus::Active,
                ])
                ->save();
            $account->transitionTo(
                HostingAccountStatus::Active,
                $this->actorUserId,
                'Hosting account reactivated.',
            );
        }

        if (
            $this->type === ProviderOperationType::Delete &&
            $account->status !== HostingAccountStatus::Deleted
        ) {
            $account
                ->fill([
                    'active_domain' => null,
                    'free_slot' => null,
                    'credential_secret' => null,
                    'deletion_requested_at' => null,
                    'deletes_at' => null,
                    'desired_status' => HostingAccountStatus::Deleted,
                ])
                ->save();
            $account->transitionTo(
                HostingAccountStatus::Deleted,
                $this->actorUserId,
                'Hosting account deleted.',
            );
        }

        if (
            $this->type === ProviderOperationType::ChangePassword &&
            $generatedPassword
        ) {
            $account->credential_secret = $generatedPassword;
            $account->save();
            $account->events()->create([
                'actor_user_id' => $this->actorUserId,
                'event' => 'password_changed',
                'safe_message' => 'Hosting password changed.',
            ]);
        }

        if (
            $this->type === ProviderOperationType::ChangePackage &&
            $targetPlan
        ) {
            $isFree = $targetPlan->type->value === 'free';
            $freeSlot = $isFree
                ? ($account->free_slot ?:
                $freeSlots->nextAvailable(
                    $account->workspace_id,
                    $targetPlan->max_accounts_per_workspace,
                    $account->id,
                ))
                : null;

            if ($isFree && !$freeSlot) {
                if ($account->status !== HostingAccountStatus::ActionRequired) {
                    $account->transitionTo(
                        HostingAccountStatus::ActionRequired,
                        $this->actorUserId,
                        'No Free hosting slot is available after the package change.',
                        [
                            'code' => 'free_slot_already_used',
                            'notify_customer' => true,
                        ],
                    );
                }
                return;
            }

            $subscription =
                $isFree || !$account->subscription_id
                    ? null
                    : \Common\Billing\Subscription::query()->find(
                        $account->subscription_id,
                    );
            $account
                ->fill([
                    'hosting_plan_id' => $targetPlan->id,
                    'product_id' => $targetPlan->product_id,
                    'price_id' => $subscription?->price_id,
                    'subscription_id' => $isFree
                        ? null
                        : $account->subscription_id,
                    'free_slot' => $freeSlot,
                    'desired_status' => HostingAccountStatus::Active,
                ])
                ->save();
            if ($account->status !== HostingAccountStatus::Active) {
                $account->transitionTo(
                    HostingAccountStatus::Active,
                    $this->actorUserId,
                    'Hosting package changed.',
                );
            }
            $account->events()->create([
                'actor_user_id' => $this->actorUserId,
                'event' => 'package_changed',
                'safe_message' => 'Hosting package changed.',
                'metadata' => ['hosting_plan_id' => $targetPlan->id],
            ]);
        }
    }

    private function recordConfigurationFailure(
        HostingAccount $account,
        HostingProvider $provider,
    ): void {
        DB::transaction(function () use ($account, $provider): void {
            $locked = HostingAccount::withTrashed()
                ->lockForUpdate()
                ->findOrFail($account->id);

            HostingProviderOperation::query()->updateOrCreate(
                ['idempotency_key' => $this->idempotencyKey],
                [
                    'uuid' => (string) Str::uuid7(),
                    'hosting_order_id' => $locked->hosting_order_id,
                    'hosting_account_id' => $locked->id,
                    'provider' => $provider->key(),
                    'operation' => $this->type,
                    'status' => ProviderOperationStatus::PermanentFailed,
                    'safe_code' => 'provider_account_not_configured',
                    'safe_message' =>
                        'The remote hosting account is not configured.',
                    'attempt_count' => 1,
                    'completed_at' => now(),
                ],
            );

            if ($locked->status !== HostingAccountStatus::ActionRequired) {
                $locked->transitionTo(
                    HostingAccountStatus::ActionRequired,
                    $this->actorUserId,
                    'The remote hosting account is not configured.',
                    ['operation' => $this->type->value],
                );
            }
        });
    }
}
