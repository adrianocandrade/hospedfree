<?php

namespace App\Hosting\Contracts;

use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Data\ProviderResponse;

interface HostingCertificateInstaller
{
    /** @return ProviderResponse<bool> */
    public function installCertificate(
        PanelAccountCredentialsData $account,
        string $domain,
        string $privateKey,
        string $certificate,
        ?string $caCertificate = null,
    ): ProviderResponse;
}
