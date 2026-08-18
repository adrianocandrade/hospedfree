<?php

namespace App\Hosting\Services;

use App\Hosting\Models\HostingIntegrationSecret;
use Illuminate\Support\Facades\Schema;

class HostingSecretStore
{
    public function get(string $key, ?string $fallback = null): ?string
    {
        $this->assertAllowedKey($key);

        if (!Schema::hasTable('hosting_integration_secrets')) {
            return $fallback;
        }

        return HostingIntegrationSecret::query()
            ->where('key', $key)
            ->first()
            ?->value ?: $fallback;
    }

    public function put(string $key, string $value): void
    {
        $this->assertAllowedKey($key);

        HostingIntegrationSecret::query()->updateOrCreate(
            ['key' => $key],
            ['value' => $value],
        );
    }

    private function assertAllowedKey(string $key): void
    {
        if (!in_array($key, ['cloudflare_api_token'], true)) {
            throw new \InvalidArgumentException('Unsupported hosting secret key.');
        }
    }
}
