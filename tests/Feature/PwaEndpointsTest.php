<?php

namespace Tests\Feature;

use Tests\TestCase;

class PwaEndpointsTest extends TestCase
{
    public function test_manifest_is_dynamic_and_installable(): void
    {
        $response = $this->get('/manifest.webmanifest');

        $response
            ->assertOk()
            ->assertHeader('Content-Type', 'application/manifest+json; charset=utf-8')
            ->assertJsonPath('display', 'standalone')
            ->assertJsonPath('start_url', 'http://localhost/')
            ->assertJsonCount(2, 'icons');
    }

    public function test_service_worker_only_targets_public_assets(): void
    {
        $response = $this->get('/sw.js');

        $response->assertOk();

        $cacheControl = (string) $response->headers->get('Cache-Control');
        $this->assertStringContainsString('no-cache', $cacheControl);
        $this->assertStringContainsString('no-store', $cacheControl);
        $this->assertStringContainsString('must-revalidate', $cacheControl);

        $script = $response->getContent();
        $this->assertStringContainsString('cacheableDestinations', $script);
        $this->assertStringContainsString('(?:build|images|favicon)', $script);
        $this->assertStringContainsString("request.method !== 'GET'", $script);
        $this->assertStringNotContainsString("request.mode === 'navigate'", $script);
        $this->assertStringNotContainsString("'/api/", $script);
    }
}
