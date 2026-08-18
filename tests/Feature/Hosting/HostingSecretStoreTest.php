<?php

namespace Tests\Feature\Hosting;

use App\Hosting\Services\HostingSecretStore;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class HostingSecretStoreTest extends TestCase
{
    public function test_cloudflare_token_is_encrypted_at_rest(): void
    {
        if (!Schema::hasTable('hosting_integration_secrets')) {
            Schema::create('hosting_integration_secrets', function (Blueprint $table): void {
                $table->id();
                $table->string('key')->unique();
                $table->text('value');
                $table->timestamps();
            });
        }

        $store = app(HostingSecretStore::class);

        try {
            $store->put('cloudflare_api_token', 'plain-secret-token');
            $raw = DB::table('hosting_integration_secrets')
                ->where('key', 'cloudflare_api_token')
                ->value('value');

            $this->assertNotSame('plain-secret-token', $raw);
            $this->assertStringNotContainsString('plain-secret-token', (string) $raw);
            $this->assertSame('plain-secret-token', $store->get('cloudflare_api_token'));
        } finally {
            DB::table('hosting_integration_secrets')
                ->where('key', 'cloudflare_api_token')
                ->delete();
        }
    }
}
