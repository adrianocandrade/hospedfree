<?php

namespace App\Hosting\Data;

final readonly class HostingDatabaseData
{
    public function __construct(
        public string $name,
        public string $host,
        public ?string $username = null,
    ) {}
}
