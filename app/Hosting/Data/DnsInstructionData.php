<?php

namespace App\Hosting\Data;

final readonly class DnsInstructionData
{
    public function __construct(
        public string $type,
        public string $name,
        public string $value,
        public int $ttl = 300,
        public bool $managed = false,
        public ?string $providerRecordId = null,
    ) {}
}
