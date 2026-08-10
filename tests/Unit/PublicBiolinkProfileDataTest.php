<?php

namespace Tests\Unit;

use App\Biolinks\Support\PublicBiolinkProfileData;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PublicBiolinkProfileDataTest extends TestCase
{
    public function test_it_maps_a_public_lanyard_presence_without_credentials(): void
    {
        Cache::flush();
        Http::fake([
            'api.lanyard.rest/*' => Http::response([
                'success' => true,
                'data' => [
                    'discord_status' => 'online',
                    'discord_user' => [
                        'username' => 'andrade',
                        'display_name' => 'Andrade Role',
                        'avatar' => 'avatar-hash',
                    ],
                    'activities' => [
                        [
                            'type' => 0,
                            'name' => 'Forza Horizon 5',
                            'details' => 'Racing',
                        ],
                    ],
                ],
            ]),
        ]);

        $profile = app(PublicBiolinkProfileData::class)
            ->discordPresence('123456789012345678');

        $this->assertTrue($profile['available']);
        $this->assertSame('Andrade Role', $profile['username']);
        $this->assertSame('online', $profile['status']);
        $this->assertSame('Forza Horizon 5 - Racing', $profile['activity']);
        $this->assertStringContainsString('avatar-hash', $profile['avatarUrl']);
    }

    public function test_it_maps_a_public_steam_profile_without_a_web_api_key(): void
    {
        Cache::flush();
        Http::fake([
            'steamcommunity.com/*' => Http::response(<<<'XML'
<profile>
  <steamID>Andrade Role</steamID>
  <steamID64>76561198000000000</steamID64>
  <avatarFull>https://cdn.example/avatar.jpg</avatarFull>
  <onlineState>in-game</onlineState>
  <inGameInfo><gameName>Forza Horizon 5</gameName></inGameInfo>
</profile>
XML),
        ]);

        $profile = app(PublicBiolinkProfileData::class)->steamProfile(
            'https://steamcommunity.com/id/andrade-role',
        );

        $this->assertTrue($profile['available']);
        $this->assertSame('Andrade Role', $profile['displayName']);
        $this->assertSame('in-game', $profile['status']);
        $this->assertSame('Forza Horizon 5', $profile['gameName']);
        $this->assertSame(
            'https://steamcommunity.com/profiles/76561198000000000/',
            $profile['profileUrl'],
        );
    }

    public function test_it_rejects_non_steam_profile_urls(): void
    {
        $profile = app(PublicBiolinkProfileData::class)
            ->steamProfile('https://example.com/profile');

        $this->assertSame(['available' => false], $profile);
    }
}
