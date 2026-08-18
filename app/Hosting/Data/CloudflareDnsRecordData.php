<?php

namespace App\Hosting\Data;

final readonly class CloudflareDnsRecordData
{
    public function __construct(
        public string $id,
        public string $type,
        public string $name,
        public string $value,
        public int $ttl,
    ) {}
}
