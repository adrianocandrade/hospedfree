<?php

namespace App\Hosting\Console;

use App\Hosting\Data\HostingDomainData;
use App\Hosting\Data\HostingProviderPackageData;
use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Contracts\HostingDatabaseProvider;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Models\HostingProviderPackage;
use App\Hosting\Providers\MofhHostingDomainProvider;
use App\Hosting\Providers\MofhHostingFileManagerProvider;
use App\Hosting\Providers\MofhHostingPackageCatalogProvider;
use App\Hosting\Providers\MofhHostingPanelProvider;
use App\Hosting\Providers\MofhHostingProvider;
use App\Hosting\Providers\SiteProHostingSiteBuilderProvider;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;

class SmokeTestHostingIntegrations extends Command
{
    protected $signature = 'hosting:smoke-test
        {--user= : ID or username of an authorized administrator}
        {--account= : ID or UUID of the authorized hosting account}
        {--panel-username= : Existing authorized VistaPanel username for a read-only remote lookup}
        {--domain= : Domain expected on the existing VistaPanel account}
        {--databases : List normalized MySQL database records without printing credentials}
        {--installer : Create and validate an installer session without printing its URL}
        {--site-builder : Create and validate a Site.Pro session without printing its URL}';

    protected $description = 'Run a redacted, non-destructive smoke test against the hosting integrations.';

    private int $failures = 0;

    public function handle(
        MofhHostingProvider $provider,
        MofhHostingPackageCatalogProvider $packageCatalog,
        MofhHostingDomainProvider $domainProvider,
        HostingDatabaseProvider $databaseProvider,
        MofhHostingFileManagerProvider $fileManager,
        MofhHostingPanelProvider $panelProvider,
        SiteProHostingSiteBuilderProvider $siteBuilder,
    ): int {
        $this->components->info('HospedFree integration smoke test');
        $this->line('Read-only provider checks. Secrets and raw payloads are never displayed.');

        $this->configurationSummary($provider);

        if (config('hospedfree.provider.driver') !== 'mofh') {
            $this->recordFailure(
                'Configured application provider',
                'provider_driver_not_mofh',
                'The application still uses the fake provider; the live adapters will only be tested directly.',
            );
        }

        $health = $provider->healthCheck();
        $this->recordResult(
            'MOFH connectivity',
            $health->success,
            $health->code,
            $health->status,
        );

        $remotePackages = $this->testPackageCatalog($packageCatalog);
        $this->showPackageMappings($remotePackages);

        $builderHealth = $siteBuilder->healthCheck();
        $this->recordResult(
            'Site.Pro connectivity',
            $builderHealth->success,
            $builderHealth->code,
            $builderHealth->success ? 'available' : 'unavailable',
        );

        if (filled($this->option('panel-username'))) {
            $this->testExistingRemoteAccount($domainProvider);

            if ($this->option('site-builder')) {
                $this->components->warn(
                    'Site.Pro account session was not created because a VistaPanel password was not supplied or stored.',
                );
            }

            return $this->finish();
        }

        $administrator = $this->resolveAdministrator();
        if (!$administrator) {
            return self::FAILURE;
        }

        $account = $this->resolveAccount($administrator);
        if (!$account) {
            return self::FAILURE;
        }

        $this->table(['Account', 'Domain', 'Local status', 'Provider'], [[
            $account->id,
            $account->active_domain ?: $account->fqdn,
            $account->status->value,
            $account->provider,
        ]]);

        if ($account->provider !== 'mofh') {
            $this->recordFailure(
                'Authorized account',
                'account_provider_mismatch',
                'The selected account was not provisioned by MOFH.',
            );

            return self::FAILURE;
        }

        if (!filled($account->getRawOriginal('provider_account_id'))) {
            $this->recordFailure(
                'Authorized account',
                'remote_account_id_missing',
                'The selected account has no remote account identifier.',
            );

            return self::FAILURE;
        }

        $panelUsername = $account->username ?: $account->getRawOriginal('provider_account_id');
        $accountResult = $provider->getAccount(
            (string) $account->getRawOriginal('provider_account_id'),
            (string) $panelUsername,
        );
        $this->recordResult(
            'MOFH account lookup',
            $accountResult->success,
            $accountResult->code,
            $accountResult->status,
        );

        $domainResult = $domainProvider->listDomains(
            (string) $panelUsername,
            $account->fqdn,
        );
        $this->recordResult(
            'MOFH domain listing',
            $domainResult->success,
            $domainResult->code,
            $domainResult->success ? 'available' : 'unavailable',
        );

        if ($domainResult->success && is_array($domainResult->data)) {
            $domains = collect($domainResult->data)
                ->filter(fn(mixed $domain) => $domain instanceof HostingDomainData)
                ->map(fn(HostingDomainData $domain) => [
                    $domain->domain,
                    $domain->type,
                    $domain->status,
                ])
                ->all();

            if ($domains) {
                $this->table(['Domain', 'Type', 'Remote status'], $domains);
            }
        }

        $this->testFileManager($fileManager, $account);

        if ($this->option('databases')) {
            $this->testDatabases($databaseProvider, $account);
        }

        if ($this->option('installer')) {
            $this->testInstallerSession($panelProvider, $account);
        } else {
            $this->components->warn(
                'Installer session was not created. Pass --installer for the authorized account test.',
            );
        }

        if ($this->option('site-builder')) {
            $this->testSiteBuilderSession($siteBuilder, $account);
        } else {
            $this->components->warn(
                'Site.Pro session was not created. Pass --site-builder for the authorized account test.',
            );
        }

        return $this->finish();
    }

    private function testExistingRemoteAccount(
        MofhHostingDomainProvider $domainProvider,
    ): void {
        $panelUsername = strtolower(trim((string) $this->option('panel-username')));
        $domain = strtolower(trim((string) $this->option('domain')));

        if (!preg_match('/^[a-z0-9]+_[0-9]+$/', $panelUsername)) {
            $this->recordFailure(
                'Remote account selection',
                'invalid_panel_username',
                'The supplied VistaPanel username is invalid.',
            );

            return;
        }

        if (
            !$domain ||
            !filter_var($domain, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME)
        ) {
            $this->recordFailure(
                'Remote account selection',
                'invalid_domain',
                'Supply a valid expected domain with --domain=<domain>.',
            );

            return;
        }

        $domainResult = $domainProvider->listDomains(
            $panelUsername,
            $domain,
        );
        $this->recordResult(
            'MOFH existing account domains',
            $domainResult->success,
            $domainResult->code,
            $domainResult->success ? 'available' : 'unavailable',
        );

        if ($domainResult->success && is_array($domainResult->data)) {
            $domains = collect($domainResult->data)
                ->filter(fn(mixed $item) => $item instanceof HostingDomainData)
                ->map(fn(HostingDomainData $item) => [
                    $item->domain,
                    $item->type,
                    $item->status,
                ])
                ->all();

            if ($domains) {
                $this->table(['Domain', 'Type', 'Remote status'], $domains);
            }
        }

        $ownership = $domainProvider->checkDomain($panelUsername, $domain);
        $owned = $ownership->success &&
            $ownership->data instanceof HostingDomainData &&
            $ownership->data->status !== 'pending_verification';
        $this->recordResult(
            'MOFH domain ownership',
            $owned,
            $ownership->success
                ? ($owned ? 'ok' : 'domain_account_mismatch')
                : $ownership->code,
            $ownership->data instanceof HostingDomainData
                ? $ownership->data->status
                : 'unavailable',
        );
    }

    private function finish(): int
    {
        if ($this->failures > 0) {
            $this->components->error("Smoke test finished with {$this->failures} failure(s).");

            return self::FAILURE;
        }

        $this->components->info('Smoke test completed successfully.');

        return self::SUCCESS;
    }

    private function configurationSummary(MofhHostingProvider $provider): void
    {
        $this->table(['Setting', 'Value'], [
            ['Configured provider driver', config('hospedfree.provider.driver')],
            ['Adapter under test', $provider->key()],
            ['MOFH credentials', $this->configured([
                'hospedfree.mofh.username',
                'hospedfree.mofh.password',
            ])],
            ['MOFH TLS endpoint', str_starts_with(
                (string) config('hospedfree.mofh.base_url'),
                'https://',
            ) ? 'yes' : 'no'],
            ['Site.Pro enabled', config('hospedfree.site_builder.enabled') ? 'yes' : 'no'],
            ['Site.Pro credentials', $this->configured([
                'hospedfree.site_builder.endpoint',
                'hospedfree.site_builder.username',
                'hospedfree.site_builder.password',
            ])],
        ]);
    }

    /**
     * @return array<int, HostingProviderPackageData>
     */
    private function testPackageCatalog(
        MofhHostingPackageCatalogProvider $packageCatalog,
    ): array {
        $result = $packageCatalog->listPackages();
        $this->recordResult(
            'MOFH package catalog',
            $result->success,
            $result->code,
            $result->success ? 'available' : 'unavailable',
        );

        if (!$result->success || !is_array($result->data)) {
            return [];
        }

        $packages = collect($result->data)
            ->filter(fn(mixed $package) => $package instanceof HostingProviderPackageData)
            ->values()
            ->all();

        if ($packages) {
            $this->table(
                ['Remote package', 'Disk MB', 'Bandwidth MB'],
                array_map(fn(HostingProviderPackageData $package) => [
                    $package->name,
                    $package->diskLimitMb ?? 'not reported',
                    $package->bandwidthLimitMb ?? 'not reported',
                ], $packages),
            );
        }

        return $packages;
    }

    /**
     * @param array<int, HostingProviderPackageData> $remotePackages
     */
    private function showPackageMappings(array $remotePackages): void
    {
        $remoteNames = collect($remotePackages)
            ->map(fn(HostingProviderPackageData $package) => strtolower($package->name));
        $mappings = HostingProviderPackage::query()
            ->with('plan.product')
            ->where('provider', 'mofh')
            ->get();

        if ($mappings->isEmpty()) {
            $this->recordFailure(
                'Local package mapping',
                'mofh_package_mapping_missing',
                'No local hosting plan is mapped to a MOFH package.',
            );

            return;
        }

        $this->table(
            ['Product', 'Local mapping', 'Remote match', 'Active'],
            $mappings->map(fn(HostingProviderPackage $mapping) => [
                $mapping->plan?->product?->name ?: "Plan #{$mapping->hosting_plan_id}",
                $mapping->remote_package,
                $remoteNames->contains(strtolower($mapping->remote_package)) ? 'yes' : 'no',
                $mapping->is_active ? 'yes' : 'no',
            ])->all(),
        );

        foreach ($mappings as $mapping) {
            if (!$remoteNames->contains(strtolower($mapping->remote_package))) {
                $this->recordFailure(
                    'Local package mapping',
                    'mofh_remote_package_not_found',
                    "Remote package '{$mapping->remote_package}' was not found.",
                );
            }
        }
    }

    private function resolveAdministrator(): ?User
    {
        $identifier = trim((string) $this->option('user'));
        $query = User::query();

        if ($identifier !== '') {
            $query->where(function (Builder $candidate) use ($identifier): void {
                if (ctype_digit($identifier)) {
                    $candidate->whereKey((int) $identifier)
                        ->orWhere('username', $identifier);
                } else {
                    $candidate->where('username', $identifier);
                }
            });
        }

        $users = $query->get();

        // An explicitly selected user is authorized by the operator invoking
        // this local-only command. Automatic selection remains admin-only.
        if ($identifier === '') {
            $users = $users->filter(fn(User $user) =>
                $user->hasPermission('admin') ||
                $user->hasPermission('admin.access') ||
                $user->hasPermission('hosting.settings')
            );
        }

        $users = $users->values();

        if ($users->count() !== 1) {
            $this->recordFailure(
                'Administrator selection',
                $users->isEmpty() ? 'admin_not_found' : 'admin_is_ambiguous',
                'Select exactly one administrator with --user=<id-or-username>.',
            );

            return null;
        }

        return $users->first();
    }

    private function resolveAccount(User $administrator): ?HostingAccount
    {
        $identifier = trim((string) $this->option('account'));
        $accounts = HostingAccount::query()
            ->where('user_id', $administrator->id)
            ->when($identifier !== '', function (Builder $query) use ($identifier): void {
                $query->where(function (Builder $candidate) use ($identifier): void {
                    if (ctype_digit($identifier)) {
                        $candidate->whereKey((int) $identifier)
                            ->orWhere('uuid', $identifier);
                    } else {
                        $candidate->where('uuid', $identifier);
                    }
                });
            })
            ->get();

        if ($accounts->count() !== 1) {
            $this->recordFailure(
                'Hosting account selection',
                $accounts->isEmpty() ? 'hosting_account_not_found' : 'hosting_account_is_ambiguous',
                'Select exactly one authorized account with --account=<id-or-uuid>.',
            );

            return null;
        }

        return $accounts->first();
    }

    private function testSiteBuilderSession(
        SiteProHostingSiteBuilderProvider $siteBuilder,
        HostingAccount $account,
    ): void {
        if (!$account->hasCredentials()) {
            $this->recordFailure(
                'Site.Pro account session',
                'credentials_unavailable',
                'The selected account has no server-side hosting credentials.',
            );

            return;
        }

        $result = $siteBuilder->createSession(
            new PanelAccountCredentialsData(
                username: (string) $account->username,
                password: (string) $account->credential_secret,
                ftpHost: $account->ftp_host ?: config('hospedfree.mofh.ftp_host'),
            ),
            $account->active_domain ?: $account->fqdn,
        );

        $this->recordResult(
            'Site.Pro account session',
            $result->success,
            $result->code,
            $result->success ? 'session URL validated (redacted)' : 'unavailable',
        );
    }

    private function testFileManager(
        MofhHostingFileManagerProvider $fileManager,
        HostingAccount $account,
    ): void {
        if (!$account->hasCredentials()) {
            $this->recordFailure(
                'MOFH WebFTP listing',
                'credentials_unavailable',
                'The selected account has no server-side hosting credentials.',
            );

            return;
        }

        $result = $fileManager->listDirectory(
            new PanelAccountCredentialsData(
                username: (string) $account->username,
                password: (string) $account->credential_secret,
                ftpHost: $account->ftp_host ?: config('hospedfree.mofh.ftp_host'),
            ),
            '',
        );

        $this->recordResult(
            'MOFH WebFTP listing',
            $result->success,
            $result->code,
            $result->success ? 'available' : 'unavailable',
        );
    }

    private function testDatabases(
        HostingDatabaseProvider $databaseProvider,
        HostingAccount $account,
    ): void {
        if (!$account->hasCredentials()) {
            $this->recordFailure(
                'VistaPanel MySQL listing',
                'credentials_unavailable',
                'The selected account has no server-side hosting credentials.',
            );

            return;
        }

        $result = $databaseProvider->listDatabases(
            new PanelAccountCredentialsData(
                username: (string) $account->username,
                password: (string) $account->credential_secret,
                ftpHost: $account->ftp_host ?: config('hospedfree.mofh.ftp_host'),
            ),
            (string) ($account->sql_host ?: config('hospedfree.mofh.sql_host')),
        );

        $this->recordResult(
            'VistaPanel MySQL listing',
            $result->success,
            $result->code,
            $result->success
                ? count(is_array($result->data) ? $result->data : []) . ' database(s)'
                : 'unavailable',
        );
    }

    private function testInstallerSession(
        MofhHostingPanelProvider $panelProvider,
        HostingAccount $account,
    ): void {
        if (!$account->hasCredentials()) {
            $this->recordFailure(
                'Application installer session',
                'credentials_unavailable',
                'The selected account has no server-side hosting credentials.',
            );

            return;
        }

        $result = $panelProvider->createInstallerSession(
            new PanelAccountCredentialsData(
                username: (string) $account->username,
                password: (string) $account->credential_secret,
                ftpHost: $account->ftp_host ?: config('hospedfree.mofh.ftp_host'),
            ),
        );

        if ($result->code === 'installer_redirect_contains_password') {
            $fallbackUrl = config('hospedfree.tools.control_panel_url') ?:
                config('hospedfree.vistapanel.cpanel_url');
            $fallbackIsSafe = is_string($fallbackUrl) &&
                filter_var($fallbackUrl, FILTER_VALIDATE_URL) &&
                parse_url($fallbackUrl, PHP_URL_SCHEME) === 'https';

            $this->recordResult(
                'Application installer access',
                (bool) $fallbackIsSafe,
                $fallbackIsSafe
                    ? 'unsafe_direct_url_blocked'
                    : 'safe_panel_fallback_unavailable',
                $fallbackIsSafe
                    ? 'available through hosting panel'
                    : 'unavailable',
            );

            return;
        }

        $this->recordResult(
            'Application installer session',
            $result->success,
            $result->code,
            $result->success ? 'session URL validated (redacted)' : 'unavailable',
        );
    }

    /**
     * @param array<int, string> $keys
     */
    private function configured(array $keys): string
    {
        return collect($keys)->every(fn(string $key) => filled(config($key)))
            ? 'yes'
            : 'no';
    }

    private function recordResult(
        string $check,
        bool $success,
        string $code,
        ?string $status,
    ): void {
        if (!$success) {
            $this->failures++;
        }

        $this->table(['Check', 'Result', 'Code', 'Status'], [[
            $check,
            $success ? 'PASS' : 'FAIL',
            $code,
            $status ?: 'not reported',
        ]]);
    }

    private function recordFailure(
        string $check,
        string $code,
        string $message,
    ): void {
        $this->failures++;
        $this->table(['Check', 'Result', 'Code', 'Safe message'], [[
            $check,
            'FAIL',
            $code,
            $message,
        ]]);
    }
}
