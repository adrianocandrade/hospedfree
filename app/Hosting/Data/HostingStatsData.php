<?php

namespace App\Hosting\Data;

final readonly class HostingStatsData
{
    public function __construct(
        public ?int $diskUsedBytes = null,
        public ?int $diskLimitBytes = null,
        public ?int $bandwidthUsedBytes = null,
        public ?int $bandwidthLimitBytes = null,
        public ?int $inodesUsed = null,
        public ?int $inodesLimit = null,
        public ?int $domainCount = null,
        public ?int $databaseCount = null,
    ) {}
}
