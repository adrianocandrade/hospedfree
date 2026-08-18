<?php

namespace Tests\Feature\Hosting;

use App\Hosting\Data\CloudflareDnsRecordData;
use App\Hosting\Services\CloudflareDnsService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CloudflareDnsServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('hospedfree.cloudflare.enabled', true);
        config()->set('hospedfree.cloudflare.api_token', 'secret-cloudflare-token');
        config()->set('hospedfree.cloudflare.zone_id', 'zone_12345678');
        config()->set('hospedfree.provider.retries', 0);
    }

    public function test_health_returns_only_normalized_zone_data(): void
    {
        Http::fake([
            'https://api.cloudflare.com/client/v4/zones/zone_12345678' => Http::response([
                'success' => true,
                'result' => ['name' => 'example.com'],
            ]),
        ]);

        $result = app(CloudflareDnsService::class)->health();

        $this->assertTrue($result->success);
        $this->assertSame(['zone_name' => 'example.com'], $result->data);
        $this->assertStringNotContainsString('secret-cloudflare-token', json_encode($result));
        Http::assertSent(fn($request) =>
            $request->hasHeader('Authorization', 'Bearer secret-cloudflare-token')
        );
    }

    public function test_txt_record_lifecycle_is_bounded_to_configured_zone(): void
    {
        Http::fake([
            'https://api.cloudflare.com/client/v4/zones/zone_12345678/dns_records' => Http::response([
                'success' => true,
                'result' => ['id' => 'record_12345678'],
            ]),
            'https://api.cloudflare.com/client/v4/zones/zone_12345678/dns_records/record_12345678' => Http::response([
                'success' => true,
                'result' => ['id' => 'record_12345678'],
            ]),
        ]);

        $service = app(CloudflareDnsService::class);
        $created = $service->createTxtRecord(
            '_acme-challenge.site.example.com',
            'safe-validation-token',
        );
        $deleted = $service->deleteRecord('record_12345678');

        $this->assertTrue($created->success);
        $this->assertInstanceOf(CloudflareDnsRecordData::class, $created->data);
        $this->assertSame('record_12345678', $created->data->id);
        $this->assertTrue($deleted->success);
        Http::assertSent(fn($request) =>
            $request->method() === 'POST' &&
            $request['type'] === 'TXT' &&
            $request['proxied'] === false
        );
    }
}
