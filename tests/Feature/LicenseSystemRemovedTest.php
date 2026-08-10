<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class LicenseSystemRemovedTest extends TestCase
{
    public function test_license_and_remote_update_routes_are_not_registered(): void
    {
        $uris = collect(Route::getRoutes())->map(fn($route) => $route->uri());

        $this->assertFalse(
            $uris->contains('api/v1/license/register-purchase-code'),
        );
        $this->assertFalse($uris->contains('api/v1/update'));
        $this->assertFalse($uris->contains('update'));
        $this->assertFalse($uris->contains('update/perform'));
    }
}
