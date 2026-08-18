<?php

namespace App\Hosting\Providers;

use App\Hosting\Contracts\HostingDatabaseProvider;
use App\Hosting\Contracts\HostingDomainProvider;
use App\Hosting\Contracts\HostingFileManagerProvider;
use App\Hosting\Contracts\HostingPanelProvider;
use App\Hosting\Contracts\HostingSiteBuilderProvider;
use App\Hosting\Contracts\HostingSslProvider;
use App\Hosting\Contracts\HostingCertificateInstaller;
use App\Hosting\Data\ProviderResponse;
use App\Hosting\Data\PanelAccountCredentialsData;

class UnavailableHostingCapabilitiesProvider implements
    HostingPanelProvider,
    HostingDomainProvider,
    HostingDatabaseProvider,
    HostingFileManagerProvider,
    HostingSslProvider,
    HostingCertificateInstaller,
    HostingSiteBuilderProvider
{
    public function key(): string
    {
        return 'unavailable';
    }

    public function createPanelSession(
        PanelAccountCredentialsData $account,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function createInstallerSession(
        PanelAccountCredentialsData $account,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function stats(
        PanelAccountCredentialsData $account,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function listDomains(
        string $remoteAccountId,
        string $primaryDomain,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function checkDomain(
        string $remoteAccountId,
        string $domain,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function domainVerificationInstructions(
        string $remoteAccountId,
        string $domain,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function addCustomDomain(
        PanelAccountCredentialsData $account,
        string $domain,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function addSubdomain(
        PanelAccountCredentialsData $account,
        string $label,
        string $zone,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function deleteDomain(
        PanelAccountCredentialsData $account,
        string $domain,
        string $type,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function listDatabases(
        PanelAccountCredentialsData $account,
        string $host,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function createDatabase(
        PanelAccountCredentialsData $account,
        string $host,
        string $name,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function listDirectory(
        PanelAccountCredentialsData $account,
        string $path,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function readFile(
        PanelAccountCredentialsData $account,
        string $path,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function writeFile(
        PanelAccountCredentialsData $account,
        string $path,
        string $content,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function createDirectory(
        PanelAccountCredentialsData $account,
        string $path,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function rename(
        PanelAccountCredentialsData $account,
        string $path,
        string $newName,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function deletePath(
        PanelAccountCredentialsData $account,
        string $path,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function chmod(
        PanelAccountCredentialsData $account,
        string $path,
        string $permissions,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function copy(
        PanelAccountCredentialsData $account,
        string $source,
        string $destination,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function move(
        PanelAccountCredentialsData $account,
        string $source,
        string $destination,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function archive(
        PanelAccountCredentialsData $account,
        array $paths,
        string $destination,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function extract(
        PanelAccountCredentialsData $account,
        string $archive,
        string $destination,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function upload(
        PanelAccountCredentialsData $account,
        string $path,
        string $localFile,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function download(
        PanelAccountCredentialsData $account,
        string $path,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function requestCertificate(
        string $remoteAccountId,
        string $domain,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function certificateStatus(
        string $remoteAccountId,
        string $remoteOrderId,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function validateCertificate(
        string $remoteAccountId,
        string $remoteOrderId,
        ?string $managedDnsRecordId = null,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function revokeCertificate(
        string $remoteAccountId,
        string $remoteOrderId,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function installCertificate(
        PanelAccountCredentialsData $account,
        string $domain,
        string $privateKey,
        string $certificate,
        ?string $caCertificate = null,
    ): ProviderResponse {
        return $this->unavailable();
    }
    public function createSession(
        PanelAccountCredentialsData $account,
        string $domain,
    ): ProviderResponse {
        return $this->unavailable();
    }

    public function healthCheck(): ProviderResponse
    {
        return $this->unavailable();
    }

    private function unavailable(): ProviderResponse
    {
        return ProviderResponse::failure(
            'capability_not_configured',
            'This hosting capability is not configured.',
        );
    }
}
