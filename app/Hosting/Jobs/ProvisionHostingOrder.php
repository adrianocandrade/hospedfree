<?php

namespace App\Hosting\Jobs;

use App\Hosting\Contracts\HostingProvider;
use App\Hosting\Data\CreateHostingAccountData;
use App\Hosting\Enums\HostingAccountStatus;
use App\Hosting\Enums\HostingOrderStatus;
use App\Hosting\Enums\ProviderOperationStatus;
use App\Hosting\Enums\ProviderOperationType;
use App\Hosting\Models\HostingOrder;
use App\Hosting\Models\HostingProviderOperation;
use App\Hosting\Services\HostingPassword;
use App\Hosting\Services\SafeToolUrl;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class ProvisionHostingOrder implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $uniqueFor = 900;

    public function __construct(public int $orderId) {}

    public function uniqueId(): string
    {
        return "hosting-order:{$this->orderId}";
    }

    public function backoff(): array
    {
        return [15, 60, 300];
    }

    public function handle(HostingProvider $provider, SafeToolUrl $safeToolUrl): void
    {
        $order = HostingOrder::query()
            ->with(['account', 'plan.providerPackages', 'user'])
            ->findOrFail($this->orderId);

        if ($order->status === HostingOrderStatus::Fulfilled) {
            return;
        }

        $account = $order->account;
        $providerPackage = $order->plan->packageFor($provider->key());

        if (!$account || !$providerPackage || $account->provider !== $provider->key()) {
            $this->markConfigurationFailure($order);
            return;
        }

        $operation = DB::transaction(function () use ($order, $account, $provider): HostingProviderOperation {
            $lockedOrder = HostingOrder::query()->lockForUpdate()->findOrFail($order->id);
            $lockedAccount = $lockedOrder->account()->lockForUpdate()->firstOrFail();

            $operation = HostingProviderOperation::query()->firstOrCreate(
                ['idempotency_key' => "create:{$lockedOrder->uuid}"],
                [
                    'uuid' => (string) Str::uuid7(),
                    'hosting_order_id' => $lockedOrder->id,
                    'hosting_account_id' => $lockedAccount->id,
                    'provider' => $provider->key(),
                    'operation' => ProviderOperationType::Create,
                    'request_fingerprint' => hash('sha256', $lockedOrder->uuid . '|' . $lockedOrder->fqdn),
                    'status' => ProviderOperationStatus::Queued,
                ],
            );

            if ($operation->status === ProviderOperationStatus::Succeeded) {
                return $operation;
            }

            if ($lockedOrder->status !== HostingOrderStatus::Provisioning) {
                $lockedOrder->transitionTo(HostingOrderStatus::Provisioning);
            }
            if ($lockedAccount->status !== HostingAccountStatus::Provisioning) {
                $lockedAccount->transitionTo(
                    HostingAccountStatus::Provisioning,
                    safeMessage: 'Hosting provisioning started.',
                );
            }

            if (!$lockedAccount->credential_secret) {
                $lockedAccount->credential_secret = HostingPassword::generate();
                $lockedAccount->save();
            }

            $operation->fill([
                'status' => ProviderOperationStatus::Running,
                'attempt_count' => $operation->attempt_count + 1,
                'started_at' => now(),
                'completed_at' => null,
                'safe_code' => null,
                'safe_message' => null,
            ])->save();

            return $operation;
        });

        if ($operation->status === ProviderOperationStatus::Succeeded) {
            return;
        }

        $account->refresh();
        $result = $provider->createAccount(new CreateHostingAccountData(
            domain: $order->fqdn,
            email: $order->user->email,
            password: $account->credential_secret,
            remotePackage: $providerPackage->remote_package,
            idempotencyKey: $operation->idempotency_key,
        ));
        $notifyCustomerOfFailure = !$result->retryable || $this->attempts() >= $this->tries;

        DB::transaction(function () use (
            $order,
            $account,
            $operation,
            $result,
            $safeToolUrl,
            $notifyCustomerOfFailure,
        ): void {
            $lockedOrder = HostingOrder::query()->lockForUpdate()->findOrFail($order->id);
            $lockedAccount = $lockedOrder->account()->lockForUpdate()->firstOrFail();
            $lockedOperation = HostingProviderOperation::query()->lockForUpdate()->findOrFail($operation->id);

            $lockedOperation->fill([
                'status' => $result->success
                    ? ProviderOperationStatus::Succeeded
                    : ($result->retryable
                        ? ProviderOperationStatus::RetryableFailed
                        : ProviderOperationStatus::PermanentFailed),
                'safe_code' => $result->code,
                'safe_message' => $result->message,
                'retry_after' => $result->retryable ? now()->addMinute() : null,
                'completed_at' => now(),
            ])->save();

            if ($result->success) {
                $lockedAccount->fill([
                    'provider_account_id' => $result->remoteAccountId,
                    'username' => $result->username,
                    'control_panel_url' => $safeToolUrl->validate($result->controlPanelUrl),
                    'webftp_url' => $safeToolUrl->validate($result->webftpUrl),
                    'installer_url' => $safeToolUrl->validate($result->installerUrl),
                    'ftp_host' => $result->ftpHost,
                    'sql_host' => $result->sqlHost,
                    'last_synced_at' => now(),
                ])->save();

                if ($this->isRemoteActive($result->status)) {
                    $lockedAccount->activated_at = now();
                    $lockedAccount->desired_status = HostingAccountStatus::Active;
                    $lockedAccount->save();
                    $lockedAccount->transitionTo(
                        HostingAccountStatus::Active,
                        safeMessage: 'Hosting account is active.',
                    );
                    $lockedOrder->fulfilled_at = now();
                    $lockedOrder->save();
                    $lockedOrder->transitionTo(HostingOrderStatus::Fulfilled);
                }

                return;
            }

            $lockedAccount->transitionTo(
                HostingAccountStatus::Failed,
                safeMessage: $result->message,
                metadata: [
                    'code' => $result->code,
                    'notify_customer' => $notifyCustomerOfFailure,
                ],
            );
            $lockedOrder->failure_code = $result->code;
            $lockedOrder->safe_failure_message = $result->message;
            $lockedOrder->save();
            $lockedOrder->transitionTo(HostingOrderStatus::Failed);
        });

        if ($result->retryable && $this->attempts() < $this->tries) {
            throw new RuntimeException($result->code);
        }
    }

    private function markConfigurationFailure(HostingOrder $order): void
    {
        DB::transaction(function () use ($order): void {
            $lockedOrder = HostingOrder::query()->lockForUpdate()->findOrFail($order->id);
            $lockedOrder->failure_code = 'provider_package_not_configured';
            $lockedOrder->safe_failure_message = 'The hosting plan is not configured for the selected provider.';
            $lockedOrder->save();

            if ($lockedOrder->status !== HostingOrderStatus::Failed) {
                $lockedOrder->transitionTo(HostingOrderStatus::Failed);
            }

            $account = $lockedOrder->account()->lockForUpdate()->first();
            if ($account && $account->status !== HostingAccountStatus::Failed) {
                $account->transitionTo(
                    HostingAccountStatus::Failed,
                    safeMessage: 'Provider package configuration is missing.',
                );
            }
        });
    }

    private function isRemoteActive(?string $status): bool
    {
        return in_array(strtolower((string) $status), ['1', 'active', 'activated', 'ready'], true);
    }
}
