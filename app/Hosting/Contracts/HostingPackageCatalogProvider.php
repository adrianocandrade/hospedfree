<?php

namespace App\Hosting\Contracts;

use App\Hosting\Data\ProviderResponse;

interface HostingPackageCatalogProvider
{
    public function listPackages(): ProviderResponse;
}
