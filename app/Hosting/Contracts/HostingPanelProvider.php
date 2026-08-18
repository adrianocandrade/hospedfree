<?php

namespace App\Hosting\Contracts;

use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Data\ProviderResponse;

interface HostingPanelProvider
{
    public function key(): string;

    /** @return ProviderResponse<\App\Hosting\Data\PanelSessionData> */
    public function createPanelSession(
        PanelAccountCredentialsData $account,
    ): ProviderResponse;

    /** @return ProviderResponse<\App\Hosting\Data\PanelSessionData> */
    public function createInstallerSession(
        PanelAccountCredentialsData $account,
    ): ProviderResponse;

    /** @return ProviderResponse<\App\Hosting\Data\HostingStatsData> */
    public function stats(
        PanelAccountCredentialsData $account,
    ): ProviderResponse;
}
