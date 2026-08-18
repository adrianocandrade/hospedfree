<?php

namespace App\Hosting\Data;

final readonly class HostingProviderPackageData
{
    public function __construct(
        public string $name,
        public ?int $diskLimitMb = null,
        public ?int $bandwidthLimitMb = null,
    ) {}
}
