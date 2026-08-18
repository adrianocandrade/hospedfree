<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class HospedFreeThemeConfigTest extends TestCase
{
    public function test_light_theme_uses_the_canonical_hospedfree_palette(): void
    {
        $theme = require dirname(__DIR__, 2) . '/config/themes.php';

        $this->assertSame('#F8F8FC', $theme['light']['--be-background']);
        $this->assertSame('#202034', $theme['light']['--be-foreground']);
        $this->assertSame('#5C5AA4', $theme['light']['--be-primary']);
        $this->assertSame(
            '#FFFFFF',
            $theme['light']['--be-primary-foreground'],
        );
        $this->assertSame('#F0EFF8', $theme['light']['--be-secondary']);
        $this->assertSame('#766CAF', $theme['light']['--be-accent']);
        $this->assertSame('#DDDCEA', $theme['light']['--be-border']);
    }

    public function test_core_text_and_action_pairs_meet_wcag_aa_contrast(): void
    {
        $themes = require dirname(__DIR__, 2) . '/config/themes.php';

        foreach ($themes as $theme) {
            $this->assertGreaterThanOrEqual(
                4.5,
                $this->contrast(
                    $theme['--be-foreground'],
                    $theme['--be-background'],
                ),
            );
            $this->assertGreaterThanOrEqual(
                4.5,
                $this->contrast(
                    $theme['--be-primary-foreground'],
                    $theme['--be-primary'],
                ),
            );
            $this->assertGreaterThanOrEqual(
                4.5,
                $this->contrast(
                    $theme['--be-muted-foreground'],
                    $theme['--be-background'],
                ),
            );
        }
    }

    public function test_dark_theme_uses_the_product_eclipse_palette(): void
    {
        $theme = require dirname(__DIR__, 2) . '/config/themes.php';
        $dark = $theme['dark'];

        $this->assertSame('#080916', $dark['--be-background']);
        $this->assertSame('#111426', $dark['--be-card']);
        $this->assertSame('#625DEB', $dark['--be-primary']);
        $this->assertSame('#A4A7BB', $dark['--be-muted-foreground']);
        $this->assertSame('#0D1020', $dark['--be-sidebar']);
        $this->assertSame('#222148', $dark['--be-sidebar-accent']);

        $this->assertGreaterThanOrEqual(
            3,
            $this->contrast($dark['--be-input'], $dark['--be-card']),
        );
        $this->assertGreaterThanOrEqual(
            3,
            $this->contrast($dark['--be-input'], $dark['--be-muted']),
        );

        $landingCss = strtolower(
            file_get_contents(
                dirname(__DIR__, 2) .
                    '/resources/client/landing/landing-tokens.css',
            ),
        );

        $this->assertStringContainsString(
            '--hf-accent: #625deb',
            $landingCss,
        );
    }

    public function test_landing_and_manifest_no_longer_use_the_inherited_cyan_palette(): void
    {
        $root = dirname(__DIR__, 2);
        $landingCss = file_get_contents(
            $root . '/resources/client/landing/landing-tokens.css',
        );
        $manifest = json_decode(
            file_get_contents($root . '/public/manifest.json'),
            true,
        );

        $this->assertStringContainsString(
            '--lp-primary-action: #5c5aa4',
            strtolower($landingCss),
        );
        $this->assertStringNotContainsString(
            '#33bcdb',
            strtolower($landingCss),
        );
        $this->assertSame('#5C5AA4', $manifest['theme_color']);
        $this->assertSame('#F8F8FC', $manifest['background_color']);
    }

    public function test_auth_brand_panel_uses_hospedfree_brand_tokens(): void
    {
        $authLayout = file_get_contents(
            dirname(__DIR__, 2) .
                '/common/foundation/resources/client/auth/ui/auth-layout/auth-layout.tsx',
        );

        $this->assertStringContainsString('var(--hf-primary)', $authLayout);
        $this->assertStringContainsString('var(--hf-ink)', $authLayout);
        $this->assertStringNotContainsString(
            '#33bcdb',
            strtolower($authLayout),
        );
        $this->assertStringNotContainsString(
            '#c0ec6a',
            strtolower($authLayout),
        );
    }

    private function contrast(string $foreground, string $background): float
    {
        $light = max(
            $this->luminance($foreground),
            $this->luminance($background),
        );
        $dark = min(
            $this->luminance($foreground),
            $this->luminance($background),
        );

        return ($light + 0.05) / ($dark + 0.05);
    }

    private function luminance(string $hex): float
    {
        $channels = array_map(function (string $channel): float {
            $value = hexdec($channel) / 255;

            return $value <= 0.04045
                ? $value / 12.92
                : (($value + 0.055) / 1.055) ** 2.4;
        }, str_split(ltrim($hex, '#'), 2));

        return 0.2126 * $channels[0] +
            0.7152 * $channels[1] +
            0.0722 * $channels[2];
    }
}
