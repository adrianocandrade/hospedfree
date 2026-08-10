<?php

namespace App\Biolinks\Support;

use Illuminate\Support\Arr;

class BiolinkAppearancePlanGuard
{
    private const FEATURE_RESTRICTIONS = [
        'desktop_layout',
        'model_gallery',
        'premium_models',
        'background_video',
        'profile_audio',
        'custom_cursor',
        'visual_effects',
        'badges',
        'custom_badges',
        'hide_branding',
        'custom_css',
        'discord_presence',
    ];

    public function validate(
        array $incoming,
        array $existing,
        object|null $owner,
    ): array {
        if (!$owner || $this->featureAllowed($owner, 'admin')) {
            return [];
        }

        $errors = [];

        foreach (self::FEATURE_RESTRICTIONS as $restriction) {
            if (
                !$this->featureAllowed($owner, $restriction) &&
                $this->usesFeature($restriction, $incoming, $existing)
            ) {
                $errors[$this->errorPath($restriction)] = __(
                    'This feature is not included in the current plan.',
                );
            }
        }

        return $errors;
    }

    private function usesFeature(
        string $restriction,
        array $incoming,
        array $existing,
    ): bool {
        return match ($restriction) {
            'desktop_layout' => $this->changedFilled(
                'desktopConfig',
                $incoming,
                $existing,
            ),
            'background_video' => $this->backgroundVideoChanged(
                $incoming,
                $existing,
            ),
            'profile_audio' => $this->changedFilled(
                'mediaConfig.audio',
                $incoming,
                $existing,
            ) ||
                $this->changedFilled(
                    'mediaConfig.audioPrompt',
                    $incoming,
                    $existing,
                ),
            'custom_cursor' => $this->changedFilled(
                'mediaConfig.cursor',
                $incoming,
                $existing,
            ),
            'visual_effects' => $this->effectsChanged($incoming, $existing),
            'badges' => $this->changedFilled(
                'badgeConfig',
                $incoming,
                $existing,
            ),
            'custom_badges' => $this->customBadgesChanged($incoming, $existing),
            'hide_branding' => $this->changedFilled(
                'hideBranding',
                $incoming,
                $existing,
            ),
            'custom_css' => $this->changedFilled(
                'customCss',
                $incoming,
                $existing,
            ),
            'model_gallery' => $this->themeModelChanged($incoming, $existing),
            'premium_models' => $this->systemBadgeRequiresFeature(
                'premium_models',
                $incoming,
                $existing,
            ) || $this->themeModelChanged($incoming, $existing),
            'discord_presence' => $this->changedFilled(
                'discordPresence',
                $incoming,
                $existing,
            ),
            default => false,
        };
    }

    private function themeModelChanged(array $incoming, array $existing): bool
    {
        return $this->changed('theme', $incoming, $existing) &&
            Arr::get($incoming, 'theme.slug') !== null;
    }

    private function systemBadgeRequiresFeature(
        string $feature,
        array $incoming,
        array $existing,
    ): bool {
        if (!$this->changed('badgeConfig.items', $incoming, $existing)) {
            return false;
        }

        foreach (Arr::get($incoming, 'badgeConfig.items', []) as $item) {
            if (!is_array($item) || Arr::get($item, 'type') !== 'system') {
                continue;
            }

            $badge = BiolinkSystemBadgeCatalog::find(Arr::get($item, 'id'));
            if ($badge && $badge['requiredFeature'] === $feature) {
                return true;
            }
        }

        return false;
    }

    private function backgroundVideoChanged(
        array $incoming,
        array $existing,
    ): bool {
        if (
            Arr::get($incoming, 'mediaConfig.backgroundMediaType') !== 'video'
        ) {
            return false;
        }

        return $this->changed(
            'mediaConfig.backgroundMedia',
            $incoming,
            $existing,
        ) ||
            $this->changed(
                'mediaConfig.backgroundMediaType',
                $incoming,
                $existing,
            );
    }

    private function effectsChanged(array $incoming, array $existing): bool
    {
        if (!$this->changed('effectsConfig', $incoming, $existing)) {
            return false;
        }

        $effects = Arr::get($incoming, 'effectsConfig', []);
        if (!is_array($effects)) {
            return false;
        }

        foreach ($effects as $key => $value) {
            if (in_array($key, ['backgroundEffect', 'usernameEffect'], true)) {
                if ($value && $value !== 'none') {
                    return true;
                }
                continue;
            }

            if ($value) {
                return true;
            }
        }

        return false;
    }

    private function customBadgesChanged(array $incoming, array $existing): bool
    {
        if (!$this->changed('badgeConfig.items', $incoming, $existing)) {
            return false;
        }

        foreach (Arr::get($incoming, 'badgeConfig.items', []) as $item) {
            if (is_array($item) && Arr::get($item, 'type') === 'custom') {
                return true;
            }
        }

        return false;
    }

    private function changedFilled(
        string $path,
        array $incoming,
        array $existing,
    ): bool {
        if (!$this->changed($path, $incoming, $existing)) {
            return false;
        }

        return !$this->blank(Arr::get($incoming, $path));
    }

    private function changed(
        string $path,
        array $incoming,
        array $existing,
    ): bool {
        return Arr::get($incoming, $path) !== Arr::get($existing, $path);
    }

    private function blank(mixed $value): bool
    {
        if ($value === null || $value === '' || $value === false) {
            return true;
        }

        if (is_array($value)) {
            return count(
                array_filter($value, fn(mixed $item) => !$this->blank($item)),
            ) === 0;
        }

        return false;
    }

    private function featureAllowed(object $owner, string $restriction): bool
    {
        if ($restriction === 'admin') {
            return method_exists($owner, 'hasPermission') &&
                $owner->hasPermission('admin');
        }

        if (!method_exists($owner, 'getRestrictionValue')) {
            return false;
        }

        return (bool) $owner->getRestrictionValue(
            'biolinks.create',
            $restriction,
        );
    }

    private function errorPath(string $restriction): string
    {
        return match ($restriction) {
            'advanced_appearance' => 'config',
            'desktop_layout' => 'config.desktopConfig',
            'background_video' => 'config.mediaConfig.backgroundMedia',
            'profile_audio' => 'config.mediaConfig.audio',
            'custom_cursor' => 'config.mediaConfig.cursor',
            'visual_effects' => 'config.effectsConfig',
            'badges' => 'config.badgeConfig',
            'custom_badges' => 'config.badgeConfig.items',
            'hide_branding' => 'config.hideBranding',
            'custom_css' => 'config.customCss',
            'model_gallery', 'premium_models' => 'config.theme',
            'discord_presence' => 'config.discordPresence',
            default => 'config',
        };
    }
}
