<?php

namespace App\Hosting\Data;

final readonly class HostingDomainData
{
    public function __construct(
        public string $domain,
        public string $type,
        public string $status,
        public bool $isPrimary = false,
    ) {}
}
