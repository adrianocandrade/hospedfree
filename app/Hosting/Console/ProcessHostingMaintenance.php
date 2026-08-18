<?php

namespace App\Hosting\Console;

use App\Hosting\Enums\HostingAccountStatus;
use App\Hosting\Enums\ProviderOperationType;
use App\Hosting\Jobs\RunHostingAccountOperation;
use App\Hosting\Jobs\CompleteHostingSslRenewal;
use App\Hosting\Jobs\ReconcileHostingSslCertificate;
use App\Hosting\Jobs\ReconcileHostingDomains;
use App\Hosting\Jobs\RequestHostingSslRenewal;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Models\HostingSslCertificate;
use App\Hosting\Models\HostingDomain;
use App\Hosting\Services\PendingHostingOrderService;
use App\Hosting\Services\HostingCheckoutAttemptReconciler;
use Illuminate\Console\Command;

class ProcessHostingMaintenance extends Command
{
    protected $signature = 'hosting:maintain';
    protected $description = 'Dispatch due hosting deletions and periodic reconciliation.';

    public function __construct(
        private PendingHostingOrderService $pendingOrders,
        private HostingCheckoutAttemptReconciler $checkoutAttempts,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->checkoutAttempts->reconcileDue();
        $this->pendingOrders->expireDue();

        HostingAccount::query()
            ->where('status', HostingAccountStatus::PendingDeletion)
            ->whereNotNull('deletes_at')
            ->where('deletes_at', '<=', now())
            ->eachById(function (HostingAccount $account): void {
                $operation = $account->suspended_at
                    ? ProviderOperationType::Delete
                    : ProviderOperationType::Suspend;
                $key =
                    $operation === ProviderOperationType::Delete
                        ? "delete:{$account->uuid}"
                        : "suspend-for-delete:{$account->uuid}";

                RunHostingAccountOperation::dispatch(
                    $account->id,
                    $operation,
                    $key,
                );
            });

        HostingAccount::query()
            ->whereNotNull('provider_account_id')
            ->where(function ($query): void {
                $query
                    ->where(function ($provisioning): void {
                        $provisioning
                            ->where(
                                'status',
                                HostingAccountStatus::Provisioning,
                            )
                            ->where(function ($stale): void {
                                $stale
                                    ->whereNull('last_synced_at')
                                    ->orWhere(
                                        'last_synced_at',
                                        '<=',
                                        now()->subMinute(),
                                    );
                            });
                    })
                    ->orWhere(function ($established): void {
                        $established
                            ->whereIn('status', [
                                HostingAccountStatus::Active,
                                HostingAccountStatus::Suspended,
                                HostingAccountStatus::ActionRequired,
                                HostingAccountStatus::PendingDowngrade,
                            ])
                            ->where(function ($stale): void {
                                $stale
                                    ->whereNull('last_synced_at')
                                    ->orWhere(
                                        'last_synced_at',
                                        '<=',
                                        now()->subMinutes(15),
                                    );
                            });
                    });
            })
            ->eachById(function (HostingAccount $account): void {
                $window = now()->format('YmdHi');
                RunHostingAccountOperation::dispatch(
                    $account->id,
                    ProviderOperationType::Reconcile,
                    "reconcile:{$account->uuid}:{$window}",
                );
            });

        $this->dispatchSslMaintenance();
        $this->dispatchDomainMaintenance();

        return self::SUCCESS;
    }

    private function dispatchDomainMaintenance(): void
    {
        HostingAccount::query()
            ->whereNotNull('provider_account_id')
            ->whereDoesntHave('domains')
            ->eachById(
                fn(
                    HostingAccount $account,
                ) => ReconcileHostingDomains::dispatch($account->id),
            );

        HostingDomain::query()
            ->whereNotNull('next_check_at')
            ->where('next_check_at', '<=', now())
            ->select('hosting_account_id')
            ->distinct()
            ->pluck('hosting_account_id')
            ->each(
                fn(int $accountId) => ReconcileHostingDomains::dispatch(
                    $accountId,
                ),
            );
    }

    private function dispatchSslMaintenance(): void
    {
        if (
            !(bool) config('hospedfree.ssl.enabled') ||
            !(bool) config('hospedfree.ssl.maintenance_enabled')
        ) {
            return;
        }

        $reconcileBefore = now()->subHours(
            max(1, (int) config('hospedfree.ssl.reconcile_after_hours', 24)),
        );

        HostingSslCertificate::query()
            ->where('status', 'issued')
            ->whereNotNull('remote_order_id')
            ->where(function ($query) use ($reconcileBefore): void {
                $query
                    ->whereNull('last_checked_at')
                    ->orWhere('last_checked_at', '<=', $reconcileBefore);
            })
            ->eachById(function (HostingSslCertificate $certificate): void {
                ReconcileHostingSslCertificate::dispatch(
                    $certificate->id,
                    "ssl-reconcile:{$certificate->id}:" . now()->format('YmdH'),
                );
            });

        $renewBefore = now()->addDays(
            max(1, (int) config('hospedfree.ssl.renew_before_days', 30)),
        );

        HostingSslCertificate::query()
            ->where('status', 'issued')
            ->whereNotNull('valid_until')
            ->where('valid_until', '<=', $renewBefore)
            ->whereNull('renewal_order_id')
            ->where(function ($query): void {
                $query
                    ->whereNull('renewal_status')
                    ->orWhere(function ($retry): void {
                        $retry
                            ->where('renewal_status', 'action_required')
                            ->whereNotNull('renewal_retry_after')
                            ->where('renewal_retry_after', '<=', now());
                    });
            })
            ->eachById(function (HostingSslCertificate $certificate): void {
                RequestHostingSslRenewal::dispatch(
                    $certificate->id,
                    "ssl-renew-request:{$certificate->id}:" .
                        $certificate->valid_until->format('Ymd'),
                );
            });

        HostingSslCertificate::query()
            ->where('status', 'issued')
            ->where('renewal_status', 'action_required')
            ->whereNotNull('renewal_order_id')
            ->whereNotNull('renewal_retry_after')
            ->where('renewal_retry_after', '<=', now())
            ->eachById(function (HostingSslCertificate $certificate): void {
                CompleteHostingSslRenewal::dispatch(
                    $certificate->id,
                    "ssl-renew-complete:{$certificate->id}:" .
                        hash('sha256', (string) $certificate->renewal_order_id),
                );
            });
    }
}
