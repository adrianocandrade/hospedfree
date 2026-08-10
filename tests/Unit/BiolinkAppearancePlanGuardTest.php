<?php

namespace Tests\Unit;

use App\Biolinks\Support\BiolinkAppearancePlanGuard;
use Tests\TestCase;

class BiolinkAppearancePlanGuardTest extends TestCase
{
    public function test_blocked_feature_cannot_be_added_but_existing_value_can_be_kept(): void
    {
        $guard = app(BiolinkAppearancePlanGuard::class);
        $owner = new PlanGuardOwner([]);
        $config = [
            'desktopConfig' => [
                'enabled' => true,
                'contentMode' => 'spotlight',
            ],
        ];

        $this->assertArrayHasKey(
            'config.desktopConfig',
            $guard->validate($config, [], $owner),
        );

        $this->assertSame([], $guard->validate($config, $config, $owner));
    }

    public function test_allowed_feature_can_be_saved_and_admin_bypasses_guard(): void
    {
        $guard = app(BiolinkAppearancePlanGuard::class);
        $config = [
            'mediaConfig' => [
                'audio' => 'storage/biolink-audio/theme.mp3',
            ],
        ];

        $this->assertSame(
            [],
            $guard->validate(
                $config,
                [],
                new PlanGuardOwner(['profile_audio' => true]),
            ),
        );

        $this->assertSame(
            [],
            $guard->validate($config, [], new PlanGuardOwner([], true)),
        );
    }

    public function test_audio_prompt_is_blocked_without_profile_audio_feature(): void
    {
        $guard = app(BiolinkAppearancePlanGuard::class);
        $config = [
            'mediaConfig' => [
                'audioPrompt' => [
                    'text' => 'Clique para ativar',
                ],
            ],
        ];

        $this->assertArrayHasKey(
            'config.mediaConfig.audio',
            $guard->validate($config, [], new PlanGuardOwner([])),
        );
    }

    public function test_new_username_effect_is_blocked_without_visual_effects_feature(): void
    {
        $guard = app(BiolinkAppearancePlanGuard::class);
        $config = [
            'effectsConfig' => [
                'usernameEffect' => 'sparkle',
            ],
        ];

        $this->assertArrayHasKey(
            'config.effectsConfig',
            $guard->validate($config, [], new PlanGuardOwner([])),
        );
        $this->assertSame(
            [],
            $guard->validate(
                $config,
                [],
                new PlanGuardOwner(['visual_effects' => true]),
            ),
        );
    }
}

class PlanGuardOwner
{
    public function __construct(
        private readonly array $restrictions,
        private readonly bool $admin = false,
    ) {}

    public function hasPermission(string $permission): bool
    {
        return $permission === 'admin' && $this->admin;
    }

    public function getRestrictionValue(
        string $permissionName,
        string $restriction,
    ): bool|null {
        if ($permissionName !== 'biolinks.create') {
            return null;
        }

        return $this->restrictions[$restriction] ?? null;
    }
}
