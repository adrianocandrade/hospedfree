<?php

namespace App\Hosting\Data;

/**
 * Server-only credentials used by hosting panel adapters.
 *
 * This DTO must never be serialized into an API response, event or log.
 */
final readonly class PanelAccountCredentialsData
{
    public function __construct(
        public string $username,
        public string $password,
        public ?string $ftpHost = null,
    ) {}
}
