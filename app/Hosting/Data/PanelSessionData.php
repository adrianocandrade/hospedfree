<?php

namespace App\Hosting\Data;

final readonly class PanelSessionData
{
    public function __construct(
        public string $tool,
        public string $url,
        public ?string $expiresAt = null,
    ) {}
}
