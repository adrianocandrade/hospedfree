<?php

namespace App\Hosting\Console;

use App\Hosting\Data\CreateHostingAccountData;
use App\Hosting\Data\HostingDomainData;
use App\Hosting\Data\HostingProviderPackageData;
use App\Hosting\Enums\HostingAccountStatus;
use App\Hosting\Enums\HostingOrderStatus;
use App\Hosting\Enums\ProviderOperationStatus;
use App\Hosting\Enums\ProviderOperationType;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Models\HostingProviderOperation;
use App\Hosting\Providers\MofhHostingDomainProvider;
use App\Hosting\Providers\MofhHostingPackageCatalogProvider;
use App\Hosting\Providers\MofhHostingProvider;
use App\Hosting\Services\SafeToolUrl;
use App\Hosting\Services\HostingPassword;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PromoteFakeHostingAccountToMofh extends Command
{
    protected $signature = 'hosting:promote-fake-account
        {account : Local hosting account ID or UUID}
        {--confirm : Create the remote account and replace the fake provider link}';

    protected $description = 'Safely promote one explicitly selected local fake hosting account to MOFH.';

    public function handle(
        MofhHostingProvider $provider,
        MofhHostingPackageCatalogProvider $packageCatalog,
        MofhHostingDomainProvider $domainProvider,
        SafeToolUrl $safeToolUrl,
    ): int {
        $identifier = (string) $this->argument('account');
        $account = HostingAccount::query()
            ->with(['order', 'plan.providerPackages', 'user'])
            ->where(function ($query) use ($identifier): void {
                if (ctype_digit($identifier)) {
                    $query
                        ->whereKey((int) $identifier)
                        ->orWhere('uuid', $identifier);
                } else {
                    $query->where('uuid', $identifier);
                }
            })
            ->first();

        if (!$account) {
            return $this->recordFailure(
                'hosting_account_not_found',
                'The selected hosting account was not found.',
            );
        }

        if ($account->provider === 'mofh') {
            $this->components->info(
                'The selected account is already linked to MOFH.',
            );

            return self::SUCCESS;
        }

        if ($account->provider !== 'fake') {
            return $this->recordFailure(
                'hosting_account_provider_invalid',
                'Only a fake local account can be promoted.',
            );
        }

        if (!$account->user || blank($account->user->email)) {
            return $this->recordFailure(
                'hosting_account_user_missing',
                'The selected account has no buyer e-mail.',
            );
        }

        $package = $account->plan?->packageFor('mofh');

        if (!$package || !$package->is_active) {
            return $this->recordFailure(
                'mofh_package_mapping_missing',
                'The hosting plan has no active MOFH package mapping.',
            );
        }

        $catalog = $packageCatalog->listPackages();
        $remotePackageExists =
            $catalog->success &&
            collect($catalog->data)->contains(
                fn($remote) => $remote instanceof HostingProviderPackageData &&
                    Str::lower($remote->name) ===
                        Str::lower($package->remote_package),
            );

        if (!$remotePackageExists) {
            return $this->recordFailure(
                $catalog->success
                    ? 'mofh_remote_package_not_found'
                    : $catalog->code,
                'The mapped package is not available in the MOFH catalog.',
            );
        }

        $availability = $provider->checkDomainAvailability($account->fqdn);

        if (!$availability->success) {
            return $this->recordFailure(
                $availability->code,
                $availability->message,
            );
        }

        $this->table(
            ['Account', 'Domain', 'Mapped package', 'Remote availability'],
            [
                [
                    $account->id,
                    $account->fqdn,
                    $package->remote_package,
                    'available',
                ],
            ],
        );

        if (!$this->option('confirm')) {
            $this->components->warn(
                'Validation passed. No remote or local state was changed.',
            );
            $this->line(
                'Run again with --confirm to create and link the MOFH test account.',
            );

            return self::SUCCESS;
        }

        $idempotencyKey = "promote:mofh:{$account->uuid}";
        $operation = HostingProviderOperation::query()->firstOrCreate(
            ['idempotency_key' => $idempotencyKey],
            [
                'uuid' => (string) Str::uuid7(),
                'hosting_order_id' => $account->hosting_order_id,
                'hosting_account_id' => $account->id,
                'provider' => 'mofh',
                'operation' => ProviderOperationType::Create,
                'request_fingerprint' => hash(
                    'sha256',
                    $account->uuid .
                        '|' .
                        $account->fqdn .
                        '|' .
                        $package->remote_package,
                ),
                'status' => ProviderOperationStatus::Queued,
            ],
        );

        if ($operation->status === ProviderOperationStatus::Succeeded) {
            return $this->recordFailure(
                'mofh_promotion_state_inconsistent',
                'The remote creation was already recorded but the local account is not linked.',
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

        $password = HostingPassword::generate();
        $result = $provider->createAccount(
            new CreateHostingAccountData(
                domain: $account->fqdn,
                email: $account->user->email,
                password: $password,
                remotePackage: $package->remote_package,
                idempotencyKey: $idempotencyKey,
            ),
        );

        if (
            !$result->success ||
            blank($result->remoteAccountId) ||
            blank($result->username)
        ) {
            $operation
                ->fill([
                    'status' => $result->retryable
                        ? ProviderOperationStatus::RetryableFailed
                        : ProviderOperationStatus::PermanentFailed,
                    'safe_code' => $result->code,
                    'safe_message' => $result->message,
                    'retry_after' => $result->retryable
                        ? now()->addMinute()
                        : null,
                    'completed_at' => now(),
                ])
                ->save();

            return $this->recordFailure($result->code, $result->message);
        }

        $domain = $domainProvider->checkDomain(
            $result->username,
            $account->fqdn,
        );
        $remoteIsActive =
            $domain->success &&
            $domain->data instanceof HostingDomainData &&
            $domain->data->status === 'active';

        DB::transaction(function () use (
            $account,
            $operation,
            $result,
            $password,
            $remoteIsActive,
            $safeToolUrl,
        ): void {
            $locked = HostingAccount::query()
                ->lockForUpdate()
                ->findOrFail($account->id);
            $fromStatus = $locked->status;
            $targetStatus = $remoteIsActive
                ? HostingAccountStatus::Active
                : HostingAccountStatus::Provisioning;

            $locked
                ->fill([
                    'provider' => 'mofh',
                    'provider_account_id' => $result->remoteAccountId,
                    'username' => $result->username,
                    'credential_secret' => $password,
                    'status' => $targetStatus,
                    'desired_status' => HostingAccountStatus::Active,
                    'control_panel_url' => $safeToolUrl->validate(
                        $result->controlPanelUrl,
                    ),
                    'webftp_url' => $safeToolUrl->validate($result->webftpUrl),
                    'installer_url' => $safeToolUrl->validate(
                        $result->installerUrl,
                    ),
                    'ftp_host' => $result->ftpHost,
                    'sql_host' => $result->sqlHost,
                    'last_synced_at' => $remoteIsActive ? now() : null,
                    'activated_at' => $remoteIsActive ? now() : null,
                ])
                ->save();

            $locked->events()->create([
                'actor_user_id' => $locked->user_id,
                'event' => 'provider_promoted',
                'from_status' => $fromStatus->value,
                'to_status' => $targetStatus->value,
                'safe_message' =>
                    'Local test hosting was linked to the configured provider.',
                'metadata' => [
                    'from_provider' => 'fake',
                    'to_provider' => 'mofh',
                ],
            ]);

            if ($locked->order) {
                $locked->order
                    ->forceFill([
                        'status' => $remoteIsActive
                            ? HostingOrderStatus::Fulfilled
                            : HostingOrderStatus::Provisioning,
                        'fulfilled_at' => $remoteIsActive ? now() : null,
                        'failure_code' => null,
                        'safe_failure_message' => null,
                    ])
                    ->save();
            }

            $operation
                ->fill([
                    'status' => ProviderOperationStatus::Succeeded,
                    'safe_code' => $result->code,
                    'safe_message' => 'MOFH account created and linked.',
                    'completed_at' => now(),
                ])
                ->save();
        });

        $this->components->info(
            'MOFH account created and linked without exposing credentials.',
        );
        $this->table(
            ['Account', 'Provider', 'Remote status', 'Credentials'],
            [
                [
                    $account->id,
                    'mofh',
                    $remoteIsActive ? 'active' : 'provisioning',
                    'stored encrypted',
                ],
            ],
        );

        return self::SUCCESS;
    }

    private function recordFailure(string $code, string $message): int
    {
        $this->table(
            ['Result', 'Code', 'Safe message'],
            [['FAIL', $code, $message]],
        );

        return self::FAILURE;
    }
}
