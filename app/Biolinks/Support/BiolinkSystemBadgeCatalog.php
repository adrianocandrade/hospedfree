<?php

namespace App\Biolinks\Support;

final class BiolinkSystemBadgeCatalog
{
    /** @return array<string, array<string, mixed>> */
    public static function all(): array
    {
        return [
            'staff' => self::badge('biolink.badges.staff.label', 'biolink.badges.staff.description', '#8b5cf6', 'images/svg/icons/New Badge.svg', true),
            'helper' => self::badge('biolink.badges.helper.label', 'biolink.badges.helper.description', '#f59e0b', 'images/svg/icons/Free Badge.svg', true),
            'premium' => self::badge('biolink.badges.premium.label', 'biolink.badges.premium.description', '#a855f7', 'images/svg/icons/New Badge.svg', false, 'premium_models'),
            'verified' => self::badge('biolink.badges.verified.label', 'biolink.badges.verified.description', '#2da8ff', 'images/svg/icons/Checkmark.svg', false, 'badges'),
            'donor' => self::badge('biolink.badges.donor.label', 'biolink.badges.donor.description', '#22c55e', 'images/svg/icons/Heart.svg', true),
            'gifter' => self::badge('biolink.badges.gifter.label', 'biolink.badges.gifter.description', '#f97316', 'images/svg/icons/New Badge.svg', true),
            'image_host' => self::badge('biolink.badges.image_host.label', 'biolink.badges.image_host.description', '#10b981', 'images/svg/icons/Image (Single).svg', true),
            'domain_legend' => self::badge('biolink.badges.domain_legend.label', 'biolink.badges.domain_legend.description', '#06b6d4', 'images/svg/icons/Location.svg', true),
            'og' => self::badge('biolink.badges.og.label', 'biolink.badges.og.description', '#eab308', 'images/svg/icons/New Badge.svg', true),
            'server_booster' => self::badge('biolink.badges.server_booster.label', 'biolink.badges.server_booster.description', '#f97316', 'images/svg/icons/Flash.svg', true),
            'hone_gg' => self::badge('biolink.badges.hone_gg.label', 'biolink.badges.hone_gg.description', '#f59e0b', 'images/svg/icons/New Badge.svg', true),
            'bug_hunter' => self::badge('biolink.badges.bug_hunter.label', 'biolink.badges.bug_hunter.description', '#22c55e', 'images/svg/icons/Flash.svg', true),
            'summer' => self::badge('biolink.badges.summer.label', 'biolink.badges.summer.description', '#facc15', 'images/svg/icons/Sun.svg', true),
            'easter' => self::badge('biolink.badges.easter.label', 'biolink.badges.easter.description', '#a78bfa', 'images/svg/icons/Sun.svg', true),
            'christmas' => self::badge('biolink.badges.christmas.label', 'biolink.badges.christmas.description', '#14b8a6', 'images/svg/icons/New Badge.svg', true),
            // Kept as read-only aliases for pages saved before recurring editions.
            'summer_2026' => self::badge('biolink.badges.summer_2026.label', 'biolink.badges.summer_2026.description', '#facc15', 'images/svg/icons/Sun.svg', true),
            'easter_2026' => self::badge('biolink.badges.easter_2026.label', 'biolink.badges.easter_2026.description', '#a78bfa', 'images/svg/icons/Sun.svg', true),
            'christmas_2025' => self::badge('biolink.badges.christmas_2025.label', 'biolink.badges.christmas_2025.description', '#14b8a6', 'images/svg/icons/New Badge.svg', true),
            'easter_2025' => self::badge('biolink.badges.easter_2025.label', 'biolink.badges.easter_2025.description', '#f472b6', 'images/svg/icons/Sun.svg', true),
            'christmas_2024' => self::badge('biolink.badges.christmas_2024.label', 'biolink.badges.christmas_2024.description', '#ef4444', 'images/svg/icons/New Badge.svg', true),
            'the_million' => self::badge('biolink.badges.the_million.label', 'biolink.badges.the_million.description', '#14b8a6', 'images/svg/icons/New Badge.svg', true),
            'winner' => self::badge('biolink.badges.winner.label', 'biolink.badges.winner.description', '#eab308', 'images/svg/icons/New Badge.svg', true),
            'second_place' => self::badge('biolink.badges.second_place.label', 'biolink.badges.second_place.description', '#94a3b8', 'images/svg/icons/New Badge.svg', true),
            'third_place' => self::badge('biolink.badges.third_place.label', 'biolink.badges.third_place.description', '#f97316', 'images/svg/icons/New Badge.svg', true),
        ];
    }

    public static function find(string|null $id): array|null
    {
        return $id ? (self::all()[$id] ?? null) : null;
    }

    private static function badge(
        string $label,
        string $description,
        string $color,
        string $icon,
        bool $adminGranted,
        string|null $requiredFeature = null,
    ): array {
        return compact(
            'label',
            'description',
            'color',
            'icon',
            'adminGranted',
            'requiredFeature',
        );
    }
}
