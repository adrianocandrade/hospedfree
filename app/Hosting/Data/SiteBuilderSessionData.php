<?php

namespace App\Hosting\Data;

final readonly class SiteBuilderSessionData
{
    public function __construct(
        public string $domain,
        public string $url,
        public ?string $expiresAt = null,
    ) {}
}
