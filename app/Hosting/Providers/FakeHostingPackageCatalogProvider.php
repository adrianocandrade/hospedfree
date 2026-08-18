<?php

namespace App\Hosting\Providers;

use App\Hosting\Contracts\HostingPackageCatalogProvider;
use App\Hosting\Data\HostingProviderPackageData;
use App\Hosting\Data\ProviderResponse;

class FakeHostingPackageCatalogProvider implements HostingPackageCatalogProvider
{
    public function listPackages(): ProviderResponse
    {
        return ProviderResponse::ok([
            new HostingProviderPackageData(name: 'free'),
        ]);
    }
}
