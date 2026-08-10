<?php

namespace Tests\Unit;

use App\Biolinks\Support\BiolinkAppearanceConfig;
use App\Biolinks\Support\BiolinkContentBlueprint;
use ReflectionMethod;
use Tests\TestCase;

class BiolinkContentBlueprintTest extends TestCase
{
    public function test_blueprint_is_validated_normalized_and_keeps_stable_keys(): void
    {
        $blueprint = [
            'version' => 1,
            'widgets' => [
                [
                    'key' => 'about',
                    'type' => 'spotlight',
                    'config' => [
                        'title' => 'About',
                        'section' => ['presentation' => 'open'],
                    ],
                    'items' => [['title' => 'Benefit']],
                ],
                [
                    'key' => 'contact',
                    'type' => 'contactCard',
                    'config' => [
                        'title' => 'Contact',
                        'presentation' => 'business',
                    ],
                ],
            ],
            'checklist' => [
                ['widgetKey' => 'about', 'label' => 'Review your story'],
            ],
            'header' => ['navigationWidgetKeys' => ['about', 'contact']],
            'footer' => [
                'links' => [
                    [
                        'source' => 'widget',
                        'widgetKey' => 'about',
                        'variant' => 'link',
                    ],
                    [
                        'source' => 'url',
                        'label' => 'External',
                        'url' => 'https://example.com',
                        'variant' => 'cta',
                    ],
                ],
            ],
        ];

        $support = app(BiolinkContentBlueprint::class);
        $this->assertSame([], $support->validate($blueprint));

        $normalized = $support->normalize($blueprint);
        $this->assertSame(
            'about',
            $normalized['widgets'][0]['config']['blueprintKey'],
        );
        $this->assertFalse($normalized['widgets'][0]['active']);
        $this->assertSame(0, $normalized['widgets'][0]['position']);
    }

    public function test_blueprint_rejects_duplicate_missing_and_unsafe_references(): void
    {
        $errors = app(BiolinkContentBlueprint::class)->validate([
            'version' => 1,
            'widgets' => [
                ['key' => 'about', 'type' => 'spotlight', 'config' => []],
                ['key' => 'about', 'type' => 'unknown', 'config' => []],
            ],
            'checklist' => [['widgetKey' => 'missing', 'label' => 'Missing']],
            'header' => ['navigationWidgetKeys' => ['missing']],
            'footer' => [
                'links' => [
                    ['source' => 'url', 'url' => 'javascript:alert(1)'],
                ],
            ],
        ]);

        $this->assertArrayHasKey(
            'metadata.contentBlueprint.widgets.1.key',
            $errors,
        );
        $this->assertArrayHasKey(
            'metadata.contentBlueprint.widgets.1.type',
            $errors,
        );
        $this->assertArrayHasKey(
            'metadata.contentBlueprint.checklist.0.widgetKey',
            $errors,
        );
        $this->assertArrayHasKey(
            'metadata.contentBlueprint.header.navigationWidgetKeys.0',
            $errors,
        );
        $this->assertArrayHasKey(
            'metadata.contentBlueprint.footer.links.0.url',
            $errors,
        );
    }

    public function test_all_five_seeded_models_have_valid_appearance_and_blueprints(): void
    {
        $migration = include base_path(
            'database/migrations/2026_07_28_000000_seed_complete_biolink_models.php',
        );
        $modelsMethod = new ReflectionMethod($migration, 'models');
        $blueprintMethod = new ReflectionMethod($migration, 'blueprint');
        $appearanceMethod = new ReflectionMethod($migration, 'appearance');

        $models = $modelsMethod->invoke($migration);
        $this->assertCount(5, $models);

        foreach ($models as $model) {
            $appearance = $appearanceMethod->invoke(
                $migration,
                $model['slug'],
                $model['palette'],
                $model['footerPreset'],
            );
            $blueprint = $blueprintMethod->invoke(
                $migration,
                $model['widgets'],
                $model['footerKeys'],
            );

            $this->assertSame(
                [],
                app(BiolinkAppearanceConfig::class)->validate($appearance),
                $model['slug'] . ' has invalid appearance config.',
            );
            $this->assertSame(
                [],
                app(BiolinkContentBlueprint::class)->validate($blueprint),
                $model['slug'] . ' has an invalid content blueprint.',
            );
        }
    }

    public function test_all_five_v2_models_have_valid_distinct_recipes(): void
    {
        $v1Migration = include base_path(
            'database/migrations/2026_07_28_000000_seed_complete_biolink_models.php',
        );
        $v2Migration = include base_path(
            'database/migrations/2026_07_29_010000_upgrade_complete_biolink_models_to_v2.php',
        );

        $v1Models = (new ReflectionMethod($v1Migration, 'models'))->invoke(
            $v1Migration,
        );
        $v1Blueprint = new ReflectionMethod($v1Migration, 'blueprint');
        $v1Appearance = new ReflectionMethod($v1Migration, 'appearance');
        $v2Models = (new ReflectionMethod($v2Migration, 'models'))->invoke(
            $v2Migration,
        );
        $v2Appearance = new ReflectionMethod($v2Migration, 'v2Appearance');
        $rollbackAppearance = new ReflectionMethod(
            $v2Migration,
            'v1Appearance',
        );
        $enhanceBlueprint = new ReflectionMethod(
            $v2Migration,
            'enhanceBlueprint',
        );
        $expectedFonts = [
            'model-aventura-conteudo' => ['Sora', 'Barlow Condensed'],
            'model-criadora-comunidade' => ['Manrope', 'Fraunces'],
            'model-restaurante-delivery' => ['Inter', 'Oswald'],
            'model-barbearia-premium' => ['Barlow', 'Bebas Neue'],
            'model-salao-beleza' => ['DM Sans', 'Playfair Display'],
        ];

        $this->assertCount(5, $v2Models);

        foreach ($v2Models as $model) {
            $appearance = $v2Appearance->invoke($v2Migration, $model);
            $sourceModel = collect($v1Models)->firstWhere(
                'slug',
                $model['slug'],
            );
            $blueprint = $v1Blueprint->invoke(
                $v1Migration,
                $sourceModel['widgets'],
                $sourceModel['footerKeys'],
            );
            $seededAppearance = $v1Appearance->invoke(
                $v1Migration,
                $sourceModel['slug'],
                $sourceModel['palette'],
                $sourceModel['footerPreset'],
            );
            $blueprint = $enhanceBlueprint->invoke(
                $v2Migration,
                $blueprint,
                $model['widgetEnhancements'],
            );

            $this->assertSame(
                [],
                app(BiolinkAppearanceConfig::class)->validate($appearance),
                $model['slug'] . ' has invalid v2 appearance config.',
            );
            $this->assertSame(
                [],
                app(BiolinkContentBlueprint::class)->validate($blueprint),
                $model['slug'] . ' has an invalid v2 content blueprint.',
            );
            $this->assertArrayNotHasKey('customCss', $appearance);
            $this->assertTrue($appearance['cardConfig']['showImageFallback']);
            $this->assertSame($expectedFonts[$model['slug']], [
                $appearance['fontConfig']['family'],
                $appearance['headerConfig']['titleFontConfig']['family'],
            ]);
            $this->assertTrue($appearance['fontConfig']['google']);
            $this->assertTrue(
                $appearance['headerConfig']['titleFontConfig']['google'],
            );
            $this->assertSame(
                $seededAppearance,
                $rollbackAppearance->invoke($v2Migration, $model),
                $model['slug'] . ' does not restore its exact v1 appearance.',
            );
        }
    }

    public function test_all_five_v3_models_use_valid_local_wallpapers(): void
    {
        $migration = include base_path(
            'database/migrations/2026_07_30_010000_upgrade_complete_biolink_models_to_v3.php',
        );
        $models = (new ReflectionMethod($migration, 'models'))->invoke(
            $migration,
        );

        $this->assertCount(5, $models);
        $this->assertCount(
            5,
            collect($models)->pluck('current.backgroundImage')->unique()->all(),
        );

        foreach ($models as $model) {
            $this->assertSame(
                [],
                app(BiolinkAppearanceConfig::class)->validate([
                    'bgConfig' => $model['current'],
                ]),
                $model['slug'] . ' has an invalid v3 wallpaper config.',
            );
            $this->assertStringStartsWith(
                'url("/images/wallpapers/gradients/',
                $model['current']['backgroundImage'],
            );
            $this->assertSame('image', $model['current']['activeType']);
            $this->assertSame('gradient', $model['previous']['activeType']);
        }
    }
}
