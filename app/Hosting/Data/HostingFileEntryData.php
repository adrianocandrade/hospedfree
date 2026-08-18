<?php

namespace App\Hosting\Data;

final readonly class HostingFileEntryData
{
    public function __construct(
        public string $name,
        public string $path,
        public string $type,
        public ?int $size = null,
        public ?string $modifiedAt = null,
        public ?string $permissions = null,
    ) {}
}
