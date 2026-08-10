<?php

namespace App\Biolinks\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class PublicBiolinkProfileData
{
    public function discordPresence(string $discordUserId): array
    {
        return Cache::remember(
            "biolink:discord-presence:$discordUserId",
            now()->addSeconds(30),
            function () use ($discordUserId) {
                try {
                    $response = Http::acceptJson()
                        ->timeout(3)
                        ->get("https://api.lanyard.rest/v1/users/$discordUserId");

                    $data = $response->json('data');
                    if (!$response->successful() || !is_array($data)) {
                        return ['available' => false];
                    }

                    $user = $data['discord_user'] ?? [];
                    if (!is_array($user)) {
                        return ['available' => false];
                    }

                    $activity = collect($data['activities'] ?? [])
                        ->first(fn ($item) => is_array($item) && ($item['type'] ?? null) !== 4);
                    $activityParts = is_array($activity)
                        ? array_filter([
                            $activity['name'] ?? null,
                            $activity['details'] ?? $activity['state'] ?? null,
                        ])
                        : [];
                    $avatarHash = is_string($user['avatar'] ?? null)
                        ? $user['avatar']
                        : null;
                    $avatarUrl = $avatarHash
                        ? sprintf(
                            'https://cdn.discordapp.com/avatars/%s/%s.%s?size=128',
                            rawurlencode($discordUserId),
                            rawurlencode($avatarHash),
                            str_starts_with($avatarHash, 'a_') ? 'gif' : 'png',
                        )
                        : null;

                    return [
                        'available' => true,
                        'username' => $user['display_name'] ?? $user['global_name'] ?? $user['username'] ?? null,
                        'avatarUrl' => $avatarUrl,
                        'status' => $data['discord_status'] ?? 'offline',
                        'activity' => $activityParts ? implode(' - ', $activityParts) : null,
                    ];
                } catch (\Throwable) {
                    return ['available' => false];
                }
            },
        );
    }

    public function steamProfile(string $profileUrl): array
    {
        $xmlUrl = $this->steamXmlUrl($profileUrl);
        if (!$xmlUrl) {
            return ['available' => false];
        }

        return Cache::remember(
            'biolink:steam-profile:' . sha1($xmlUrl),
            now()->addMinutes(5),
            function () use ($xmlUrl) {
                try {
                    $response = Http::timeout(5)
                        ->accept('application/xml, text/xml')
                        ->get($xmlUrl);

                    if (!$response->successful()) {
                        return ['available' => false];
                    }

                    $previousErrors = libxml_use_internal_errors(true);
                    $profile = simplexml_load_string(
                        $response->body(),
                        \SimpleXMLElement::class,
                        LIBXML_NOCDATA | LIBXML_NONET,
                    );
                    libxml_clear_errors();
                    libxml_use_internal_errors($previousErrors);

                    if (!$profile || trim((string) $profile->error) !== '') {
                        return ['available' => false];
                    }

                    $steamId = trim((string) $profile->steamID64);
                    $displayName = trim((string) $profile->steamID);
                    if ($steamId === '' || $displayName === '') {
                        return ['available' => false];
                    }

                    $gameName = trim((string) ($profile->inGameInfo->gameName ?? ''));

                    return [
                        'available' => true,
                        'displayName' => $displayName,
                        'avatarUrl' => trim((string) $profile->avatarFull) ?: null,
                        'status' => trim((string) $profile->onlineState) ?: 'offline',
                        'gameName' => $gameName ?: null,
                        'profileUrl' => "https://steamcommunity.com/profiles/$steamId/",
                    ];
                } catch (\Throwable) {
                    return ['available' => false];
                }
            },
        );
    }

    private function steamXmlUrl(string $profileUrl): ?string
    {
        $parts = parse_url($profileUrl);
        $host = strtolower((string) ($parts['host'] ?? ''));
        $path = trim((string) ($parts['path'] ?? ''), '/');

        if (!in_array($host, ['steamcommunity.com', 'www.steamcommunity.com'], true)) {
            return null;
        }

        if (preg_match('#^(?:id/[A-Za-z0-9_-]+|profiles/\d{17})$#', $path) !== 1) {
            return null;
        }

        return "https://steamcommunity.com/$path/?xml=1";
    }
}
