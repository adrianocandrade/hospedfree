<?php

namespace App\Hosting\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class HostingToolLaunchTicket
{
    private const PREFIX = 'hosting-tool-launch:';

    /** @return array{token: string, expires_at: string} */
    public function issue(
        int $userId,
        int $accountId,
        string $tool,
        ?string $domain = null,
    ): array
    {
        $token = Str::random(64);
        $expiresAt = now()->addMinutes(2);

        Cache::put(
            self::PREFIX . hash('sha256', $token),
            [
                'user_id' => $userId,
                'account_id' => $accountId,
                'tool' => $tool,
                'domain' => $domain,
            ],
            $expiresAt,
        );

        return [
            'token' => $token,
            'expires_at' => $expiresAt->toIso8601String(),
        ];
    }

    /** @return array{user_id: int, account_id: int, tool: string, domain?: string|null}|null */
    public function consume(string $token): ?array
    {
        if (!preg_match('/^[A-Za-z0-9]{64}$/', $token)) {
            return null;
        }

        $payload = Cache::pull(self::PREFIX . hash('sha256', $token));

        return is_array($payload) ? $payload : null;
    }
}
