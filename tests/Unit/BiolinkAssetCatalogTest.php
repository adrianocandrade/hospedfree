<?php

namespace Tests\Unit;

use App\Biolinks\Support\BiolinkAssetCatalog;
use Tests\TestCase;

class BiolinkAssetCatalogTest extends TestCase
{
    public function test_allowed_public_assets_are_normalized(): void
    {
        $catalog = app(BiolinkAssetCatalog::class);

        $this->assertSame(
            '/images/svg/icons/Shopping%20Cart.svg',
            $catalog->normalizePath('/images/svg/icons/Shopping Cart.svg'),
        );
        $this->assertTrue($catalog->isAllowedPath('/images/3d/Sphere-1.png'));
        $this->assertTrue($catalog->isAllowedPath('/images/emoji/Yellow-1/Happy.png'));
        $this->assertTrue($catalog->isAllowedPath('/images/pattern/pattern-1.svg'));
    }

    public function test_legacy_star_icon_is_normalized_to_existing_badge_icon(): void
    {
        $catalog = app(BiolinkAssetCatalog::class);

        $this->assertSame(
            '/images/svg/icons/New%20Badge.svg',
            $catalog->normalizePath('/images/svg/icons/Star.svg'),
        );
    }

    public function test_unsafe_or_uncataloged_assets_are_rejected(): void
    {
        $catalog = app(BiolinkAssetCatalog::class);

        $this->assertFalse($catalog->isAllowedPath('javascript:alert(1)'));
        $this->assertFalse($catalog->isAllowedPath('data:image/svg+xml,<svg></svg>'));
        $this->assertFalse($catalog->isAllowedPath('<svg onload="alert(1)"></svg>'));
        $this->assertFalse($catalog->isAllowedPath('//evil.test/icon.svg'));
        $this->assertFalse($catalog->isAllowedPath('/images/theme/retro/BQgZ.jpg'));
        $this->assertFalse($catalog->isAllowedPath('/images/svg/icons/Does Not Exist.svg'));
    }
}
