<?php

namespace App\Hosting\Contracts;

use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Data\ProviderResponse;

interface HostingSiteBuilderProvider
{
    /** @return ProviderResponse<\App\Hosting\Data\SiteBuilderSessionData> */
    public function createSession(
        PanelAccountCredentialsData $account,
        string $domain,
    ): ProviderResponse;

    /** @return ProviderResponse<bool> */
    public function healthCheck(): ProviderResponse;
}
