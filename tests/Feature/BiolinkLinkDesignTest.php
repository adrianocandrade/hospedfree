<?php

namespace Tests\Feature;

use App\Biolinks\Actions\CrupdateBiolink;
use App\Biolinks\Actions\GetBiolinkProductImportPreview;
use App\Biolinks\Models\Biolink;
use App\Biolinks\Models\BiolinkTheme;
use App\Biolinks\Support\BiolinkWidgetConfig;
use App\Models\User;
use Common\Auth\Middleware\OptionalAuthenticate;
use Common\Permissions\Models\Permission;
use Common\Auth\Middleware\VerifyApiAccessMiddleware;
use Common\Workspaces\ActiveWorkspace;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Log\Events\MessageLogged;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class BiolinkLinkDesignTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');
        DB::reconnect('sqlite');
        $this->app['router']->aliasMiddleware(
            'optionalAuth',
            OptionalAuthenticate::class,
        );
        $this->app['router']->aliasMiddleware(
            'verifyApiAccess',
            VerifyApiAccessMiddleware::class,
        );

        $this->createSchema();
        ActiveWorkspace::clearCache();
        Queue::fake();
    }

    public function test_biolink_link_asset_and_style_are_saved_on_pivot_and_returned(): void
    {
        $user = $this->createUser();
        $this->grantPermissions($user, ['admin', 'api.access']);
        $this->actingAs($user, 'sanctum');

        $biolink = $this->createBiolink($user);

        $response = $this->postJson("/api/v1/biolink/$biolink->id/link", [
            'name' => 'Order now',
            'long_url' => 'https://example.com/order',
            'thumbnail_type' => 'asset',
            'thumbnail_asset' => '/images/svg/icons/Shopping Cart.svg',
            'style' => [
                'backgroundColor' => '#111111',
                'textColor' => '#ffffff',
                'borderColor' => '#f59e0b',
                'iconColor' => '#fbbf24',
            ],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.content.0.thumbnail_asset',
                '/images/svg/icons/Shopping%20Cart.svg',
            )
            ->assertJsonPath('data.content.0.thumbnail_type', 'asset')
            ->assertJsonPath('data.content.0.style.backgroundColor', '#111111')
            ->assertJsonPath('data.content.0.style.iconColor', '#fbbf24');
    }

    public function test_biolink_name_accepts_up_to_160_characters(): void
    {
        $user = $this->createUser();
        $this->grantPermissions($user, ['admin', 'api.access']);
        $this->actingAs($user, 'sanctum');
        $biolink = $this->createBiolink($user);
        $validName = str_repeat('Á', 160);

        $this->putJson("/api/v1/biolinks/$biolink->id", [
            'name' => $validName,
        ])
            ->assertOk()
            ->assertJsonPath('data.name', $validName);

        $this->assertDatabaseHas('biolinks', [
            'id' => $biolink->id,
            'name' => $validName,
        ]);

        $this->putJson("/api/v1/biolinks/$biolink->id", [
            'name' => str_repeat('Á', 161),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_biolink_products_are_created_and_isolated_by_page(): void
    {
        $user = $this->createUser();
        $this->grantPermissions($user, ['admin', 'api.access']);
        $this->actingAs($user, 'sanctum');

        $biolink = $this->createBiolink($user);
        $otherBiolink = $this->createBiolink($user);

        $response = $this->postJson("/api/v1/biolink/$biolink->id/products", [
            'name' => 'Corte de cabelo',
            'description' => 'Serviço de exemplo',
            'price' => 30,
            'currency' => 'brl',
            'url' => 'https://example.com/agendar',
            'active' => true,
            'position' => 0,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Corte de cabelo')
            ->assertJsonPath('data.currency', 'BRL');

        $productId = (int) $response->json('data.id');

        $this->getJson("/api/v1/biolink/$biolink->id/products")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->getJson("/api/v1/biolink/$otherBiolink->id/products")
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->putJson(
            "/api/v1/biolink/$otherBiolink->id/products/$productId",
            [
                'name' => 'Não pode editar',
                'active' => true,
            ],
        )->assertNotFound();

        $this->assertDatabaseHas('biolink_products', [
            'id' => $productId,
            'biolink_id' => $biolink->id,
            'name' => 'Corte de cabelo',
        ]);
    }

    public function test_product_import_preview_is_editable_and_does_not_persist_a_product(): void
    {
        $user = $this->createUser();
        $this->grantPermissions($user, ['api.access']);
        $this->actingAs($user, 'sanctum');
        $biolink = $this->createBiolink($user);
        $url = 'https://example.com/product?tag=affiliate%2F42&utm_source=bio';

        $preview = [
            'provider' => 'generic',
            'domain' => 'example.com',
            'retrieved_at' => now()->toIso8601String(),
            'product' => [
                'name' => 'Produto importado',
                'description' => null,
                'image' => 'https://example.com/product.jpg',
                'price' => 99.9,
                'compare_price' => null,
                'currency' => 'BRL',
                'rating' => null,
                'stock_label' => null,
                'url' => $url,
            ],
            'missing_fields' => ['description'],
            'warnings' => [
                [
                    'code' => 'partial_data',
                    'message' => 'Some details are missing.',
                ],
            ],
        ];
        $this->app->instance(
            GetBiolinkProductImportPreview::class,
            new class ($url, $preview) extends GetBiolinkProductImportPreview {
                public function __construct(
                    private readonly string $expectedUrl,
                    private readonly array $preview,
                ) {}

                public function execute(string $url): array
                {
                    if ($url !== $this->expectedUrl) {
                        throw new \RuntimeException('Unexpected URL.');
                    }

                    return $this->preview;
                }
            },
        );

        $this->postJson(
            "/api/v1/biolink/$biolink->id/products/import-preview",
            ['url' => $url],
        )
            ->assertOk()
            ->assertJsonPath('provider', 'generic')
            ->assertJsonPath('product.name', 'Produto importado')
            ->assertJsonPath('product.url', $url)
            ->assertJsonPath('warnings.0.code', 'partial_data');

        $this->assertDatabaseCount('biolink_products', 0);
    }

    public function test_product_import_preview_is_isolated_by_biolink_owner(): void
    {
        $owner = $this->createUser();
        $otherUser = $this->createUser();
        $this->grantPermissions($otherUser, ['api.access']);
        $this->actingAs($otherUser, 'sanctum');
        $biolink = $this->createBiolink($owner);

        $this->postJson(
            "/api/v1/biolink/$biolink->id/products/import-preview",
            ['url' => 'https://example.com/product'],
        )->assertForbidden();
    }

    public function test_product_import_preview_rejects_a_private_url(): void
    {
        $user = $this->createUser();
        $this->grantPermissions($user, ['api.access']);
        $this->actingAs($user, 'sanctum');
        $biolink = $this->createBiolink($user);

        $this->postJson(
            "/api/v1/biolink/$biolink->id/products/import-preview",
            ['url' => 'http://127.0.0.1/private-product'],
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('url');
    }

    public function test_product_import_preview_is_limited_to_twenty_requests_per_minute(): void
    {
        Cache::flush();
        $user = $this->createUser();
        $this->grantPermissions($user, ['api.access']);
        $this->actingAs($user, 'sanctum');
        $biolink = $this->createBiolink($user);
        $preview = [
            'provider' => 'generic',
            'domain' => 'example.com',
            'retrieved_at' => now()->toIso8601String(),
            'product' => [
                'name' => 'Produto',
                'description' => null,
                'image' => null,
                'price' => null,
                'compare_price' => null,
                'currency' => null,
                'rating' => null,
                'stock_label' => null,
                'url' => 'https://example.com/product',
            ],
            'missing_fields' => ['description', 'image', 'price', 'currency'],
            'warnings' => [
                [
                    'code' => 'partial_data',
                    'message' => 'Partial.',
                ],
            ],
        ];
        $this->app->instance(
            GetBiolinkProductImportPreview::class,
            new class ($preview) extends GetBiolinkProductImportPreview {
                public function __construct(private readonly array $preview) {}

                public function execute(string $url): array
                {
                    return $this->preview;
                }
            },
        );
        $endpoint = "/api/v1/biolink/$biolink->id/products/import-preview";

        foreach (range(1, 20) as $attempt) {
            $this->postJson($endpoint, [
                'url' => 'https://example.com/product',
            ])->assertOk();
        }

        $this->postJson($endpoint, [
            'url' => 'https://example.com/product',
        ])->assertStatus(429);
    }

    public function test_biolink_link_rejects_external_or_raw_svg_asset(): void
    {
        $user = $this->createUser();
        $this->grantPermissions($user, ['admin', 'api.access']);
        $this->actingAs($user, 'sanctum');

        $biolink = $this->createBiolink($user);

        $this->postJson("/api/v1/biolink/$biolink->id/link", [
            'name' => 'Unsafe',
            'long_url' => 'https://example.com',
            'thumbnail_type' => 'asset',
            'thumbnail_asset' => '<svg onload="alert(1)"></svg>',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('thumbnail_asset');
    }

    public function test_biolink_appearance_plan_guard_blocks_new_locked_desktop_config(): void
    {
        $user = $this->createUser();
        $this->grantPermissions($user, ['api.access', 'biolinks.create']);
        $this->actingAs($user, 'sanctum');

        $biolink = $this->createBiolink($user);

        $this->postJson("/api/v1/biolink/$biolink->id/appearance", [
            'config' => [
                'desktopConfig' => [
                    'enabled' => true,
                    'contentMode' => 'spotlight',
                ],
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('config.desktopConfig');
    }

    public function test_biolink_appearance_plan_guard_allows_existing_locked_config_to_be_kept(): void
    {
        $user = $this->createUser();
        $this->grantPermissions($user, ['api.access', 'biolinks.create']);
        $this->actingAs($user, 'sanctum');

        $biolink = $this->createBiolink($user);
        $desktopConfig = [
            'enabled' => true,
            'contentMode' => 'spotlight',
        ];
        $biolink->appearance()->create([
            'config' => [
                'desktopConfig' => $desktopConfig,
            ],
        ]);

        $this->postJson("/api/v1/biolink/$biolink->id/appearance", [
            'config' => [
                'desktopConfig' => $desktopConfig,
                'bgConfig' => [
                    'activeType' => 'color',
                    'backgroundColor' => '#111111',
                    'color' => '#ffffff',
                ],
            ],
        ])
            ->assertOk()
            ->assertJsonPath(
                'data.appearance.config.desktopConfig.enabled',
                true,
            );
    }

    public function test_biolink_appearance_plan_guard_allows_enabled_feature(): void
    {
        $user = $this->createUser();
        $this->grantPermissions($user, [
            'api.access',
            [
                'name' => 'biolinks.create',
                'restrictions' => [
                    ['name' => 'desktop_layout', 'value' => true],
                ],
            ],
        ]);
        $this->actingAs($user, 'sanctum');

        $biolink = $this->createBiolink($user);

        $this->postJson("/api/v1/biolink/$biolink->id/appearance", [
            'config' => [
                'desktopConfig' => [
                    'enabled' => true,
                    'contentMode' => 'spotlight',
                ],
            ],
        ])
            ->assertOk()
            ->assertJsonPath(
                'data.appearance.config.desktopConfig.enabled',
                true,
            );
    }

    public function test_biolink_theme_models_filter_accepts_string_boolean_query_param(): void
    {
        $user = $this->createUser();
        $this->grantPermissions($user, ['api.access']);
        $this->actingAs($user, 'sanctum');

        BiolinkTheme::query()->create([
            'name' => 'Regular Theme',
            'slug' => 'regular-theme',
            'category' => 'curated',
            'config' => [
                'theme' => [
                    'slug' => 'regular-theme',
                    'category' => 'curated',
                ],
            ],
            'metadata' => [
                'isModel' => false,
                'device' => 'both',
            ],
            'sort_order' => 10,
            'is_published' => true,
            'is_system' => true,
        ]);

        BiolinkTheme::query()->create([
            'name' => 'Desktop Model',
            'slug' => 'desktop-model',
            'category' => 'curated',
            'config' => [
                'theme' => [
                    'slug' => 'desktop-model',
                    'category' => 'curated',
                ],
            ],
            'metadata' => [
                'isModel' => true,
                'device' => 'both',
            ],
            'sort_order' => 20,
            'is_published' => true,
            'is_system' => true,
        ]);

        $this->getJson('/api/v1/biolink-themes?models_only=true&device=desktop')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'desktop-model');
    }

    public function test_biolink_theme_models_filter_does_not_fail_without_metadata_column(): void
    {
        $user = $this->createUser();
        $this->grantPermissions($user, ['api.access']);
        $this->actingAs($user, 'sanctum');

        Schema::table('biolink_themes', function (Blueprint $table) {
            $table->dropColumn('metadata');
        });

        BiolinkTheme::query()->create([
            'name' => 'Regular Theme',
            'slug' => 'regular-theme',
            'category' => 'curated',
            'config' => [
                'theme' => [
                    'slug' => 'regular-theme',
                    'category' => 'curated',
                ],
            ],
            'sort_order' => 10,
            'is_published' => true,
            'is_system' => true,
        ]);

        $this->getJson('/api/v1/biolink-themes?models_only=true&device=desktop')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_complete_model_creation_clones_content_and_resolves_navigation_links(): void
    {
        $user = $this->createUser();
        $this->grantPermissions($user, ['admin', 'api.access']);
        $this->actingAs($user, 'sanctum');

        $theme = BiolinkTheme::query()->create([
            'name' => 'Complete model',
            'slug' => 'complete-model',
            'category' => 'curated',
            'config' => [
                'footerConfig' => [
                    'version' => 1,
                    'enabled' => true,
                    'preset' => 'commercial',
                    'brandSource' => 'auto',
                    'blocks' => [
                        'brand' => true,
                        'navigation' => true,
                        'socials' => true,
                        'cta' => true,
                        'backToTop' => true,
                    ],
                    'showPlatformLinks' => true,
                    'links' => [],
                ],
            ],
            'metadata' => [
                'isModel' => true,
                'device' => 'both',
                'contentBlueprint' => [
                    'version' => 1,
                    'widgets' => [
                        [
                            'key' => 'about',
                            'type' => 'spotlight',
                            'config' => ['title' => 'About'],
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
                    'header' => [
                        'navigationWidgetKeys' => ['about', 'contact'],
                    ],
                    'footer' => [
                        'links' => [
                            [
                                'id' => 'about',
                                'source' => 'widget',
                                'widgetKey' => 'about',
                                'variant' => 'link',
                            ],
                            [
                                'id' => 'contact',
                                'source' => 'widget',
                                'widgetKey' => 'contact',
                                'variant' => 'cta',
                            ],
                        ],
                    ],
                ],
            ],
            'sort_order' => 1,
            'is_published' => true,
            'is_system' => true,
        ]);

        $biolink = (new CrupdateBiolink())->execute([
            'name' => 'Created from model',
            'back_half' => 'created-model',
            'user_id' => $user->id,
            'workspace_id' => 0,
            'model_id' => $theme->id,
        ]);

        $widgets = $biolink->widgets()->orderBy('position')->get();
        $appearance = $biolink->appearance()->firstOrFail()->config;

        $this->assertCount(2, $widgets);
        $this->assertFalse($widgets[0]->active);
        $this->assertSame('about', $widgets[0]->config['blueprintKey']);
        $this->assertSame(
            [$widgets[0]->id, $widgets[1]->id],
            $appearance['headerConfig']['navigationWidgetIds'],
        );
        $this->assertSame(
            $widgets[0]->id,
            $appearance['footerConfig']['links'][0]['widgetId'],
        );
        $this->assertSame(
            $widgets[1]->id,
            $appearance['footerConfig']['links'][1]['widgetId'],
        );
        $this->assertDatabaseCount('biolink_widget_items', 1);
    }

    public function test_invalid_model_blueprint_rolls_back_the_whole_creation(): void
    {
        $user = $this->createUser();
        $this->grantPermissions($user, ['admin', 'api.access']);
        $this->actingAs($user, 'sanctum');

        $theme = BiolinkTheme::query()->create([
            'name' => 'Broken model',
            'slug' => 'broken-model',
            'category' => 'curated',
            'config' => [],
            'metadata' => [
                'isModel' => true,
                'contentBlueprint' => [
                    'version' => 1,
                    'widgets' => [
                        [
                            'key' => 'broken',
                            'type' => 'unknown',
                            'config' => [],
                        ],
                    ],
                ],
            ],
            'sort_order' => 1,
            'is_published' => true,
            'is_system' => true,
        ]);

        try {
            (new CrupdateBiolink())->execute([
                'name' => 'Must roll back',
                'back_half' => 'must-roll-back',
                'user_id' => $user->id,
                'workspace_id' => 0,
                'model_id' => $theme->id,
            ]);
            $this->fail('Expected invalid blueprint validation to fail.');
        } catch (ValidationException) {
            $this->assertDatabaseCount('biolinks', 0);
            $this->assertDatabaseCount('biolink_widgets', 0);
            $this->assertDatabaseCount('biolink_appearances', 0);
        }
    }

    public function test_complete_theme_import_restores_only_missing_widgets_and_preserves_user_content(): void
    {
        $user = $this->createUser();
        $this->grantPermissions($user, ['admin', 'api.access']);
        $this->actingAs($user, 'sanctum');

        $biolink = $this->createBiolink($user);
        $existingWidget = $biolink->widgets()->create([
            'type' => 'spotlight',
            'position' => 0,
            'active' => true,
            'config' => [
                'title' => 'Minha história personalizada',
                'blueprintKey' => 'about',
            ],
        ]);
        $biolink->widgets()->create([
            'type' => 'text',
            'position' => 1,
            'active' => true,
            'config' => ['title' => 'Conteúdo fora do tema'],
        ]);
        $biolink->appearance()->create([
            'config' => [
                'headerConfig' => [
                    'title' => 'Título do cliente',
                    'bio' => 'Bio do cliente',
                ],
                'socialConfig' => [
                    'links' => [
                        'instagram' => 'https://instagram.com/example',
                    ],
                ],
            ],
        ]);

        $theme = BiolinkTheme::query()->create([
            'name' => 'Complete import',
            'slug' => 'complete-import',
            'category' => 'curated',
            'config' => [
                'bgConfig' => [
                    'activeType' => 'image',
                    'backgroundColor' => '#07111f',
                    'backgroundImage' =>
                        'url("/images/wallpapers/gradients/mesh-gradient-1.webp")',
                    'color' => '#ffffff',
                ],
                'socialConfig' => [
                    'enabled' => true,
                    'colorMode' => 'brand',
                    'links' => [],
                ],
                'footerConfig' => [
                    'version' => 1,
                    'enabled' => true,
                    'preset' => 'community',
                    'links' => [],
                ],
            ],
            'metadata' => [
                'isModel' => true,
                'device' => 'both',
                'contentBlueprint' => [
                    'version' => 1,
                    'widgets' => [
                        [
                            'key' => 'about',
                            'type' => 'spotlight',
                            'config' => ['title' => 'About'],
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
                    'header' => [
                        'navigationWidgetKeys' => ['about', 'contact'],
                    ],
                    'footer' => [
                        'links' => [
                            [
                                'source' => 'widget',
                                'widgetKey' => 'contact',
                                'variant' => 'cta',
                            ],
                        ],
                    ],
                ],
            ],
            'sort_order' => 1,
            'is_published' => true,
            'is_system' => true,
        ]);

        $response = $this->postJson(
            "/api/v1/biolink/$biolink->id/themes/$theme->id/import",
        );

        $response
            ->assertOk()
            ->assertJsonPath('meta.imported_widgets_count', 1)
            ->assertJsonPath(
                'data.appearance.config.headerConfig.title',
                'Título do cliente',
            )
            ->assertJsonPath(
                'data.appearance.config.socialConfig.links.instagram',
                'https://instagram.com/example',
            )
            ->assertJsonPath('data.appearance.config.theme.locked', true);

        $widgets = $biolink->widgets()->orderBy('position')->get();
        $this->assertCount(3, $widgets);
        $this->assertTrue($existingWidget->fresh()->active);
        $this->assertSame(
            'Minha história personalizada',
            $existingWidget->fresh()->config['title'],
        );

        $contact = $widgets->first(
            fn($widget) => ($widget->config['blueprintKey'] ?? null) ===
                'contact',
        );
        $this->assertNotNull($contact);
        $this->assertFalse($contact->active);
        $this->assertSame(
            [$existingWidget->id, $contact->id],
            $biolink->appearance()->firstOrFail()->config['headerConfig'][
                'navigationWidgetIds'
            ],
        );

        $this->postJson("/api/v1/biolink/$biolink->id/themes/$theme->id/import")
            ->assertOk()
            ->assertJsonPath('meta.imported_widgets_count', 0);
        $this->assertDatabaseCount('biolink_widgets', 3);
    }

    public function test_blank_creation_keeps_the_legacy_starter_content(): void
    {
        $user = $this->createUser();
        $this->grantPermissions($user, ['admin', 'api.access']);
        $this->actingAs($user, 'sanctum');

        $biolink = (new CrupdateBiolink())->execute([
            'name' => 'Blank',
            'back_half' => 'blank-page',
            'user_id' => $user->id,
            'workspace_id' => 0,
        ]);

        $this->assertSame(
            ['image', 'text', 'socials'],
            $biolink->widgets()->orderBy('position')->pluck('type')->all(),
        );
        $this->assertNull($biolink->appearance()->first());
    }

    public function test_embed_collection_can_be_created_from_editor_defaults(): void
    {
        $user = $this->createUser();
        $this->grantPermissions($user, ['api.access']);
        $this->actingAs($user, 'sanctum');
        $biolink = $this->createBiolink($user);

        $this->postJson("/api/v1/biolink/$biolink->id/widget", [
            'type' => 'embedCollection',
            'config' => [
                'title' => 'Links em destaque',
                'description' => '',
                'buttonLabel' => '',
                'layout' => 'classic',
                'previewStyle' => 'compact',
            ],
            'items' => [],
        ])
            ->assertOk()
            ->assertJsonPath(
                'data.content.0.config.title',
                'Links em destaque',
            );

        $this->assertDatabaseHas('biolink_widgets', [
            'biolink_id' => $biolink->id,
            'type' => 'embedCollection',
        ]);
    }

    public function test_all_supported_widget_types_can_be_created_through_the_api(): void
    {
        $user = $this->createUser();
        $this->grantPermissions($user, ['api.access']);
        $this->actingAs($user, 'sanctum');
        $biolink = $this->createBiolink($user);
        $typesWithItems = [
            'linkedProduct',
            'linkedCourse',
            'service',
            'faq',
            'linkCollection',
            'embedCollection',
            'imageGallery',
            'poll',
            'reviews',
            'stats',
            'podcastMusic',
            'mobileApp',
            'eventList',
            'donation',
            'spotlight',
            'logoCloud',
            'socialFeed',
        ];

        foreach (BiolinkWidgetConfig::TYPES as $type) {
            $config = match ($type) {
                'spotify' => [
                    'url' => 'https://open.spotify.com/track/test-track',
                    'spotifyPresentation' => 'embed',
                ],
                'linkedProduct' => [
                    'source' => 'catalog',
                    'productIds' => [],
                ],
                default => [],
            };
            $payload = ['type' => $type, 'config' => $config];

            if (in_array($type, $typesWithItems, true)) {
                $payload['items'] = [];
            }

            $response = $this->postJson(
                "/api/v1/biolink/$biolink->id/widget",
                $payload,
            );

            $this->assertSame(
                200,
                $response->getStatusCode(),
                "Widget type [$type] failed: {$response->getContent()}",
            );
        }

        $this->assertDatabaseCount(
            'biolink_widgets',
            count(BiolinkWidgetConfig::TYPES),
        );
    }

    public function test_widget_validation_logs_payload_shape_without_values(): void
    {
        $logged = [];
        Log::listen(function (MessageLogged $event) use (&$logged): void {
            if (
                $event->level === 'warning' &&
                $event->message ===
                    'Biolink widget payload validation failed.'
            ) {
                $logged[] = $event->context;
            }
        });
        $user = $this->createUser();
        $this->grantPermissions($user, ['api.access']);
        $this->actingAs($user, 'sanctum');
        $biolink = $this->createBiolink($user);

        $this->postJson("/api/v1/biolink/$biolink->id/widget", [
            'type' => 'embedCollection',
            'config' => [
                'title' => 'Links privados',
                'buttonLabel' => 'Segredo que nao deve ir ao log',
            ],
            'items' => [],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('config');

        $this->assertCount(1, $logged);
        $context = $logged[0];
        $this->assertSame($biolink->id, $context['biolink_id']);
        $this->assertSame($user->id, $context['user_id']);
        $this->assertSame('embedCollection', $context['widget_type']);
        $this->assertContains('buttonLabel', $context['config_keys']);
        $this->assertSame(0, $context['item_count']);
        $this->assertSame(['config'], $context['validation_fields']);
        $this->assertNotContains(
            'Segredo que nao deve ir ao log',
            $context,
        );
    }

    public function test_model_creation_respects_plan_features_and_rolls_back(): void
    {
        $user = $this->createUser();
        $this->grantPermissions($user, ['api.access', 'biolinks.create']);
        $this->actingAs($user, 'sanctum');

        $theme = BiolinkTheme::query()->create([
            'name' => 'Restricted model',
            'slug' => 'restricted-model',
            'category' => 'curated',
            'config' => [],
            'metadata' => [
                'isModel' => true,
                'requiredFeatures' => ['premium_models'],
                'contentBlueprint' => [
                    'version' => 1,
                    'widgets' => [
                        [
                            'key' => 'about',
                            'type' => 'spotlight',
                            'config' => ['title' => 'About'],
                        ],
                    ],
                ],
            ],
            'sort_order' => 1,
            'is_published' => true,
            'is_system' => true,
        ]);

        try {
            (new CrupdateBiolink())->execute([
                'name' => 'Restricted',
                'back_half' => 'restricted',
                'user_id' => $user->id,
                'workspace_id' => 0,
                'model_id' => $theme->id,
            ]);
            $this->fail('Expected the model plan guard to reject creation.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('model_id', $exception->errors());
            $this->assertDatabaseCount('biolinks', 0);
        }
    }

    private function grantPermissions(User $user, array $names): void
    {
        $permissions = collect($names)->map(function (
            string|array $permission,
        ) {
            $name = is_array($permission) ? $permission['name'] : $permission;
            $model = Permission::query()->firstOrCreate(
                ['name' => $name],
                ['group' => 'tests'],
            );

            if (is_array($permission)) {
                $model->restrictions = $permission['restrictions'] ?? [];
            }

            return $model;
        });

        $user->permissions()->sync(
            $permissions
                ->mapWithKeys(
                    fn(Permission $permission) => [
                        $permission->id => [
                            'restrictions' => is_string(
                                $permission->getAttributes()['restrictions'] ??
                                    null,
                            )
                                ? $permission->getAttributes()['restrictions']
                                : json_encode(
                                    $permission->restrictions->values()->all(),
                                ),
                        ],
                    ],
                )
                ->all(),
        );
        $user->setRelation('permissions', $permissions->values());
        $user->setRelation('roles', collect());
    }

    private function createUser(): User
    {
        return User::query()->create([
            'name' => 'Admin',
            'email' => 'user-' . Str::random(8) . '@example.com',
            'email_verified_at' => now(),
            'password' => 'password',
        ]);
    }

    private function createBiolink(User $user): Biolink
    {
        return Biolink::query()->create([
            'name' => 'Bio',
            'back_half' => 'bio-' . Str::random(6),
            'user_id' => $user->id,
            'workspace_id' => 0,
        ]);
    }

    private function createSchema(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('username')->nullable();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable();
            $table->string('image')->nullable();
            $table->string('language')->nullable();
            $table->string('country')->nullable();
            $table->string('gender')->nullable();
            $table->string('timezone')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name', 30)->unique();
            $table->string('group', 30);
            $table->timestamps();
        });

        Schema::create('permissionables', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('permission_id')->index();
            $table->unsignedInteger('permissionable_id')->index();
            $table->string('permissionable_type', 40)->index();
            $table->text('restrictions')->nullable();
            $table->unique(
                ['permission_id', 'permissionable_id', 'permissionable_type'],
                'permissionable_unique',
            );
        });

        Schema::create('user_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->index();
            $table->string('browser')->nullable();
            $table->string('platform')->nullable();
            $table->string('device')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->timestamps();
        });

        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('guests')->default(false);
            $table->timestamps();
        });

        Schema::create('user_role', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('user_id')->index();
            $table->unsignedInteger('role_id')->index();
            $table->timestamps();
            $table->unique(['user_id', 'role_id']);
        });

        Schema::create('workspaces', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedInteger('owner_id')->index();
            $table->boolean('is_personal')->default(true);
            $table->timestamps();
        });

        Schema::create('workspace_user', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('user_id')->index();
            $table->unsignedInteger('workspace_id')->index();
            $table->unsignedInteger('role_id')->nullable()->index();
            $table->boolean('is_owner')->default(false);
            $table->timestamps();
            $table->unique(['user_id', 'workspace_id']);
        });

        Schema::create('links', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 150)->nullable();
            $table->string('back_half', 50)->index();
            $table->text('long_url');
            $table->integer('user_id')->index();
            $table->integer('workspace_id')->nullable()->index();
            $table->integer('domain_id')->nullable()->index();
            $table->string('password')->nullable()->index();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamp('activates_at')->nullable()->index();
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->string('type', 30)->index();
            $table->integer('type_id')->nullable()->index();
            $table->integer('folder_id')->nullable()->index();
            $table->bigInteger('clicks_count')->default(0);
            $table->timestamp('clicked_at')->nullable();
            $table->text('utm')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('biolinks', function (Blueprint $table) {
            $table->id();
            $table->string('name', 160)->index();
            $table->string('back_half', 50)->index();
            $table->integer('user_id')->index();
            $table->integer('workspace_id')->index();
            $table->integer('domain_id')->nullable()->index();
            $table->string('password', 100)->nullable();
            $table->integer('clicks_count')->default(0);
            $table->text('utm')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('activates_at')->nullable();
            $table->timestamp('clicked_at')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('biolink_link', function (Blueprint $table) {
            $table->id();
            $table->integer('biolink_id')->index();
            $table->integer('link_id')->index();
            $table->integer('position')->index();
            $table->boolean('active')->default(false);
            $table->string('thumbnail_type', 20)->nullable();
            $table->string('thumbnail_asset', 1000)->nullable();
            $table->json('style')->nullable();
            $table->string('animation', 40)->nullable();
            $table->timestamp('leap_until')->nullable();
            $table->timestamps();
            $table->unique(['biolink_id', 'link_id']);
        });

        Schema::create('biolink_appearances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('biolink_id')->index();
            $table->longText('config');
            $table->timestamps();
        });

        Schema::create('biolink_products', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('biolink_id')->index();
            $table->string('legacy_key')->nullable();
            $table->string('name', 160);
            $table->text('description')->nullable();
            $table->string('image', 1000)->nullable();
            $table->decimal('price', 12, 2)->nullable();
            $table->string('currency', 3)->nullable();
            $table->string('url', 1000)->nullable();
            $table->boolean('active')->default(true);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['biolink_id', 'legacy_key']);
        });

        Schema::create('biolink_themes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('category', 30)->default('customizable')->index();
            $table->json('config');
            $table->json('metadata')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(true)->index();
            $table->boolean('is_system')->default(false);
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('biolink_widgets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('biolink_id')->index();
            $table->string('type', 50);
            $table->boolean('active')->default(true);
            $table->integer('position')->unsigned()->default(0);
            $table->string('pinned', 10)->nullable()->index();
            $table->string('password')->nullable();
            $table->text('utm')->nullable();
            $table->timestamp('activates_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->longText('config');
            $table->timestamps();
        });

        Schema::create('biolink_widget_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('biolink_id')->index();
            $table
                ->unsignedBigInteger('biolink_widget_id')
                ->nullable()
                ->index();
            $table->string('type', 50)->nullable();
            $table->boolean('active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('title', 160)->nullable();
            $table->text('description')->nullable();
            $table->string('url', 1000)->nullable();
            $table->string('image', 1000)->nullable();
            $table->decimal('price', 10, 2)->nullable();
            $table->string('currency', 3)->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();
        });

        Schema::create('linkeable_rules', function (Blueprint $table) {
            $table->id();
            $table->string('type', 30)->index();
            $table->integer('linkeable_id')->index();
            $table->string('linkeable_type', 50)->index();
            $table->string('key')->nullable();
            $table->string('value')->nullable();
            $table->timestamps();
        });

        Schema::create('tracking_pixels', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('user_id')->nullable()->index();
            $table->integer('workspace_id')->nullable()->index();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('qr_codes', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('back_half', 50)->index();
            $table->text('long_url')->nullable();
            $table->json('style')->nullable();
            $table->integer('linkeable_id')->nullable()->index();
            $table->string('linkeable_type', 50)->nullable()->index();
            $table->integer('user_id')->nullable()->index();
            $table->integer('workspace_id')->nullable()->index();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('link_tracking_pixel', function (Blueprint $table) {
            $table->id();
            $table->integer('linkeable_id')->index();
            $table->string('linkeable_type', 50)->index();
            $table->integer('tracking_pixel_id')->index();
            $table->timestamps();
            $table->unique(
                ['linkeable_id', 'linkeable_type', 'tracking_pixel_id'],
                'linkeable_pixel_unique',
            );
        });

        Schema::create('custom_domains', function (Blueprint $table) {
            $table->id();
            $table->string('host');
            $table->timestamps();
        });
    }
}
