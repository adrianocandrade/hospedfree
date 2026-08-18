<?php

namespace App\Hosting\Contracts;

use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Data\ProviderResponse;

interface HostingDatabaseProvider
{
    /** @return ProviderResponse<list<\App\Hosting\Data\HostingDatabaseData>> */
    public function listDatabases(
        PanelAccountCredentialsData $account,
        string $host,
    ): ProviderResponse;

    /** @return ProviderResponse<\App\Hosting\Data\HostingDatabaseData> */
    public function createDatabase(
        PanelAccountCredentialsData $account,
        string $host,
        string $name,
    ): ProviderResponse;
}
