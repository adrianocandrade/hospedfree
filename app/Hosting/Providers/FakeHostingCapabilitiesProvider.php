<?php

namespace App\Hosting\Providers;

use App\Hosting\Contracts\HostingDatabaseProvider;
use App\Hosting\Contracts\HostingDomainProvider;
use App\Hosting\Contracts\HostingFileManagerProvider;
use App\Hosting\Contracts\HostingPanelProvider;
use App\Hosting\Contracts\HostingSiteBuilderProvider;
use App\Hosting\Contracts\HostingSslProvider;
use App\Hosting\Contracts\HostingCertificateInstaller;
use App\Hosting\Data\DnsInstructionData;
use App\Hosting\Data\HostingDatabaseData;
use App\Hosting\Data\HostingDomainData;
use App\Hosting\Data\HostingFileContentData;
use App\Hosting\Data\HostingStatsData;
use App\Hosting\Data\HostingSslOrderData;
use App\Hosting\Data\PanelSessionData;
use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Data\ProviderResponse;
use App\Hosting\Data\SiteBuilderSessionData;
use App\Hosting\Services\SafeToolUrl;

class FakeHostingCapabilitiesProvider implements
    HostingPanelProvider,
    HostingDomainProvider,
    HostingDatabaseProvider,
    HostingFileManagerProvider,
    HostingSslProvider,
    HostingCertificateInstaller,
    HostingSiteBuilderProvider
{
    public function __construct(private readonly SafeToolUrl $safeToolUrl) {}

    public function key(): string
    {
        return 'fake';
    }

    public function createPanelSession(
        PanelAccountCredentialsData $account,
    ): ProviderResponse {
        return ProviderResponse::ok(
            new PanelSessionData(
                tool: 'control-panel',
                url: $this->toolUrl(
                    'control_panel_url',
                    'https://panel.example.test',
                ),
                expiresAt: now()->addMinutes(5)->toIso8601String(),
            ),
        );
    }

    public function createInstallerSession(
        PanelAccountCredentialsData $account,
    ): ProviderResponse {
        return ProviderResponse::ok(
            new PanelSessionData(
                tool: 'installer',
                url: $this->toolUrl(
                    'installer_url',
                    'https://installer.example.test',
                ),
                expiresAt: now()->addMinutes(5)->toIso8601String(),
            ),
        );
    }

    public function stats(
        PanelAccountCredentialsData $account,
    ): ProviderResponse {
        return ProviderResponse::ok(
            new HostingStatsData(
                diskUsedBytes: 134_217_728,
                diskLimitBytes: 1_073_741_824,
                bandwidthUsedBytes: 268_435_456,
                bandwidthLimitBytes: 5_368_709_120,
                inodesUsed: 1200,
                inodesLimit: 10000,
                domainCount: 1,
                databaseCount: 0,
            ),
        );
    }

    public function listDomains(
        string $remoteAccountId,
        string $primaryDomain,
    ): ProviderResponse {
        return ProviderResponse::ok([
            new HostingDomainData($primaryDomain, 'primary', 'active', true),
        ]);
    }

    public function checkDomain(
        string $remoteAccountId,
        string $domain,
    ): ProviderResponse {
        $isHostedSubdomain = collect(
            (array) config('hospedfree.allowed_domains', []),
        )->contains(
            fn(mixed $zone) => str_ends_with(
                strtolower($domain),
                '.' . strtolower(trim((string) $zone)),
            ),
        );

        return ProviderResponse::ok(
            new HostingDomainData(
                $domain,
                $isHostedSubdomain ? 'subdomain' : 'custom',
                $isHostedSubdomain ? 'active' : 'pending_verification',
            ),
        );
    }

    public function domainVerificationInstructions(
        string $remoteAccountId,
        string $domain,
    ): ProviderResponse {
        $label = substr(hash('sha256', "{$remoteAccountId}:{$domain}"), 0, 32);

        return ProviderResponse::ok([
            new DnsInstructionData(
                type: 'CNAME',
                name: "{$label}.{$domain}",
                value: (string) config(
                    'hospedfree.domains.cname_target',
                    'ns1.byet.org',
                ),
                ttl: 300,
            ),
        ]);
    }

    public function addCustomDomain(
        PanelAccountCredentialsData $account,
        string $domain,
    ): ProviderResponse {
        return ProviderResponse::ok(
            new HostingDomainData($domain, 'custom', 'pending_verification'),
        );
    }

    public function addSubdomain(
        PanelAccountCredentialsData $account,
        string $label,
        string $zone,
    ): ProviderResponse {
        return ProviderResponse::ok(
            new HostingDomainData("{$label}.{$zone}", 'subdomain', 'active'),
        );
    }

    public function deleteDomain(
        PanelAccountCredentialsData $account,
        string $domain,
        string $type,
    ): ProviderResponse {
        return ProviderResponse::ok(true);
    }

    public function listDatabases(
        PanelAccountCredentialsData $account,
        string $host,
    ): ProviderResponse {
        return ProviderResponse::ok([]);
    }

    public function createDatabase(
        PanelAccountCredentialsData $account,
        string $host,
        string $name,
    ): ProviderResponse {
        return ProviderResponse::ok(
            new HostingDatabaseData(
                name: $name,
                host: $host ?: 'sql.example.test',
                username: $account->username,
            ),
        );
    }

    public function listDirectory(
        PanelAccountCredentialsData $account,
        string $path,
    ): ProviderResponse {
        return ProviderResponse::ok([]);
    }

    public function readFile(
        PanelAccountCredentialsData $account,
        string $path,
    ): ProviderResponse {
        return ProviderResponse::ok(new HostingFileContentData($path, ''));
    }

    public function writeFile(
        PanelAccountCredentialsData $account,
        string $path,
        string $content,
    ): ProviderResponse {
        return ProviderResponse::ok(true);
    }

    public function createDirectory(
        PanelAccountCredentialsData $account,
        string $path,
    ): ProviderResponse {
        return ProviderResponse::ok(true);
    }

    public function rename(
        PanelAccountCredentialsData $account,
        string $path,
        string $newName,
    ): ProviderResponse {
        return ProviderResponse::ok(true);
    }

    public function deletePath(
        PanelAccountCredentialsData $account,
        string $path,
    ): ProviderResponse {
        return ProviderResponse::ok(true);
    }

    public function chmod(
        PanelAccountCredentialsData $account,
        string $path,
        string $permissions,
    ): ProviderResponse {
        return ProviderResponse::ok(true);
    }

    public function copy(
        PanelAccountCredentialsData $account,
        string $source,
        string $destination,
    ): ProviderResponse {
        return ProviderResponse::ok(true);
    }

    public function move(
        PanelAccountCredentialsData $account,
        string $source,
        string $destination,
    ): ProviderResponse {
        return ProviderResponse::ok(true);
    }

    public function archive(
        PanelAccountCredentialsData $account,
        array $paths,
        string $destination,
    ): ProviderResponse {
        return ProviderResponse::ok(true);
    }

    public function extract(
        PanelAccountCredentialsData $account,
        string $archive,
        string $destination,
    ): ProviderResponse {
        return ProviderResponse::ok(true);
    }

    public function upload(
        PanelAccountCredentialsData $account,
        string $path,
        string $localFile,
    ): ProviderResponse {
        return ProviderResponse::ok(true);
    }

    public function download(
        PanelAccountCredentialsData $account,
        string $path,
    ): ProviderResponse {
        return ProviderResponse::ok(new HostingFileContentData($path, ''));
    }

    public function requestCertificate(
        string $remoteAccountId,
        string $domain,
    ): ProviderResponse {
        $token = substr(hash('sha256', "{$remoteAccountId}:{$domain}"), 0, 32);

        return ProviderResponse::ok(
            new HostingSslOrderData(
                status: 'pending_validation',
                remoteOrderId: 'fake-' . substr($token, 0, 12),
                dnsInstructions: [
                    new DnsInstructionData(
                        'TXT',
                        "_acme-challenge.{$domain}",
                        $token,
                    ),
                ],
            ),
        );
    }

    public function certificateStatus(
        string $remoteAccountId,
        string $remoteOrderId,
    ): ProviderResponse {
        return ProviderResponse::ok(
            new HostingSslOrderData(
                status: 'pending_validation',
                remoteOrderId: $remoteOrderId,
            ),
        );
    }

    public function validateCertificate(
        string $remoteAccountId,
        string $remoteOrderId,
        ?string $managedDnsRecordId = null,
    ): ProviderResponse {
        return ProviderResponse::ok(
            new HostingSslOrderData(
                status: 'issued',
                remoteOrderId: $remoteOrderId,
                validUntil: now()->addDays(90)->toIso8601String(),
                privateKey: 'fake-private-key',
                csr: 'fake-csr',
                certificate: 'fake-certificate',
                caCertificate: 'fake-ca-certificate',
            ),
        );
    }

    public function revokeCertificate(
        string $remoteAccountId,
        string $remoteOrderId,
    ): ProviderResponse {
        return ProviderResponse::ok(true);
    }

    public function installCertificate(
        PanelAccountCredentialsData $account,
        string $domain,
        string $privateKey,
        string $certificate,
        ?string $caCertificate = null,
    ): ProviderResponse {
        return ProviderResponse::ok(true);
    }

    public function createSession(
        PanelAccountCredentialsData $account,
        string $domain,
    ): ProviderResponse {
        return ProviderResponse::ok(
            new SiteBuilderSessionData(
                domain: $domain,
                url: $this->toolUrl(
                    'site_builder_url',
                    'https://builder.example.test',
                ),
                expiresAt: now()->addMinutes(5)->toIso8601String(),
            ),
        );
    }

    public function healthCheck(): ProviderResponse
    {
        return ProviderResponse::ok(true);
    }

    private function toolUrl(string $key, string $fallback): string
    {
        return $this->safeToolUrl->validate(
            config("hospedfree.tools.{$key}"),
        ) ?:
            $fallback;
    }
}
