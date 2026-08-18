<?php

namespace App\Hosting\Providers\VistaPanel;

use GuzzleHttp\Cookie\CookieJar;

/**
 * Server-only authenticated VistaPanel state.
 *
 * This object must never be serialized, logged or returned from a controller.
 */
final readonly class VistaPanelSession
{
    public function __construct(
        public CookieJar $cookies,
        public ?string $token,
        public string $dashboardHtml,
    ) {}
}
