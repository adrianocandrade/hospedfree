<?php

namespace Tests\Unit;

use App\Biolinks\Models\BiolinkWidget;
use App\Biolinks\Support\BiolinkWidgetConfig;
use Tests\TestCase;

class BiolinkWidgetConfigTest extends TestCase
{
    public function test_showcase_widgets_and_shared_sections_are_accepted(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        foreach (
            ['spotlight', 'ctaBanner', 'logoCloud', 'socialFeed']
            as $type
        ) {
            $items = match ($type) {
                'ctaBanner' => null,
                'socialFeed' => [
                    [
                        'title' => 'Post',
                        'url' => 'https://example.com/post',
                        'payload' => [
                            'network' => 'instagram',
                            'likes' => 12,
                            'comments' => 3,
                        ],
                    ],
                ],
                default => [
                    [
                        'title' => 'Item',
                        'url' => 'https://example.com/item',
                    ],
                ],
            };

            $this->assertSame(
                [],
                $support->validate(
                    $type,
                    [
                        'title' => 'Section',
                        'section' => [
                            'presentation' => 'open',
                            'showTitle' => false,
                            'icon' => 'Sparkles',
                            'anchorLabel' => 'Section',
                            'actionLabel' => 'View all',
                            'actionUrl' => 'https://example.com/all',
                        ],
                    ],
                    $items,
                ),
            );
        }

        $normalized = $support->normalizeConfig('imageGallery', [
            'title' => 'Gallery',
            'section' => [
                'presentation' => 'open',
                'showTitle' => false,
            ],
        ]);

        $this->assertSame('open', $normalized['section']['presentation']);
        $this->assertFalse($normalized['section']['showTitle']);
        $this->assertArrayHasKey(
            'config.section.showTitle',
            $support->validate('imageGallery', [
                'section' => ['showTitle' => 'no'],
            ]),
        );
    }

    public function test_showcase_widgets_reject_unsafe_urls_and_invalid_metrics(): void
    {
        $errors = app(BiolinkWidgetConfig::class)->validate(
            'socialFeed',
            ['title' => 'Wall'],
            [
                [
                    'title' => 'Unsafe',
                    'url' => 'javascript:alert(1)',
                    'image' => 'data:image/svg+xml,<svg onload=alert(1)>',
                    'payload' => [
                        'network' => 'unknown',
                        'likes' => -1,
                    ],
                ],
            ],
        );

        $this->assertArrayHasKey('items.0.url', $errors);
        $this->assertArrayHasKey('items.0.image', $errors);
        $this->assertArrayHasKey('items.0.payload.network', $errors);
        $this->assertArrayHasKey('items.0.payload.likes', $errors);
    }

    public function test_expanded_presentations_and_gallery_contract_are_persisted(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $this->assertSame(
            [],
            $support->validate('emailSignup', [
                'presentation' => 'inline',
            ]),
        );
        $this->assertSame(
            [],
            $support->validate('contactCard', [
                'presentation' => 'business',
            ]),
        );
        $this->assertSame(
            [],
            $support->validate('genericVideo', [
                'presentation' => 'featured',
                'coverImage' => 'storage/video/cover.jpg',
                'duration' => '12:30',
            ]),
        );

        $gallery = $support->normalizeConfig('imageGallery', [
            'aspectRatio' => 'portrait',
            'gridColumns' => '3',
            'imageZoom' => true,
        ]);

        $this->assertSame('portrait', $gallery['aspectRatio']);
        $this->assertSame(3, $gallery['gridColumns']);
        $this->assertTrue($gallery['imageZoom']);
    }

    public function test_capture_widget_configs_are_accepted(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $this->assertSame(
            [],
            $support->validate('contactForm', [
                'title' => 'Contact me',
                'description' => 'Send a short message.',
                'buttonLabel' => 'Send message',
                'successMessage' => 'Message sent.',
                'consentText' => 'I agree to share this information.',
                'requirePhone' => false,
                'contactMode' => 'email_or_phone',
            ]),
        );

        $this->assertSame(
            [],
            $support->validate('emailSignup', [
                'title' => 'Join my list',
                'buttonLabel' => 'Subscribe',
                'successMessage' => 'You are subscribed.',
                'consentText' => 'I agree to share my email.',
            ]),
        );

        $this->assertSame(
            [],
            $support->validate('eventRsvp', [
                'title' => 'RSVP',
                'eventDate' => '2026-08-15',
                'allowWaitlist' => true,
                'contactMode' => 'email_and_phone',
                'allowGuests' => true,
                'maxGuests' => 3,
            ]),
        );
    }

    public function test_capture_widget_configs_reject_invalid_contact_and_guest_rules(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $errors = $support->validate('contactForm', [
            'title' => 'Contact',
            'contactMode' => 'fax_required',
        ]);
        $this->assertArrayHasKey('config.contactMode', $errors);

        $errors = $support->validate('eventRsvp', [
            'title' => 'RSVP',
            'allowGuests' => true,
            'maxGuests' => 11,
        ]);
        $this->assertArrayHasKey('config.maxGuests', $errors);
    }

    public function test_item_widgets_accept_items_and_relative_upload_urls(): void
    {
        $errors = app(BiolinkWidgetConfig::class)->validate(
            'linkedProduct',
            [
                'title' => 'Products',
                'buttonLabel' => 'View product',
                'layout' => 'carousel',
                'boxBackgroundColor' => '#F8FAFC',
                'boxTextColor' => '#111827',
            ],
            [
                [
                    'title' => 'Digital product',
                    'description' => 'Redirects to an external payment page.',
                    'url' => 'https://example.com/buy',
                    'image' => 'api/v1/file-entries/123',
                    'price' => '49.90',
                    'currency' => 'BRL',
                    'active' => true,
                ],
            ],
        );

        $this->assertSame([], $errors);

        $normalized = app(BiolinkWidgetConfig::class)->normalizeConfig(
            'linkedProduct',
            [
                'title' => 'Products',
                'boxBackgroundColor' => '#F8FAFC',
                'boxTextColor' => '#111827',
            ],
        );

        $this->assertSame('#111827', $normalized['boxTextColor']);

        $errors = app(BiolinkWidgetConfig::class)->validate('linkedProduct', [
            'title' => 'Products',
            'boxTextColor' => 'red',
        ]);

        $this->assertArrayHasKey('config.boxTextColor', $errors);
    }

    public function test_text_widget_body_is_sanitized_when_normalized(): void
    {
        $support = app(BiolinkWidgetConfig::class);
        $config = [
            'title' => 'About',
            'body' =>
                '<p onclick="alert(1)">Safe <strong>text</strong></p><script>alert(1)</script><a href="javascript:alert(1)">link</a>',
        ];

        $this->assertSame([], $support->validate('text', $config));

        $normalized = $support->normalizeConfig('text', $config);

        $this->assertSame(
            '<p>Safe <strong>text</strong></p>link',
            $normalized['body'],
        );
    }

    public function test_text_config_repairs_legacy_mojibake_without_changing_utf8(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $normalized = $support->normalizeConfig('text', [
            'title' => 'InformaÃ§Ã£o',
            'body' => '<p>Agendamento para amanhÃ£.</p>',
        ]);

        $this->assertSame('Informação', $normalized['title']);
        $this->assertSame(
            '<p>Agendamento para amanhã.</p>',
            $normalized['body'],
        );

        $valid = $support->normalizeConfig('text', [
            'title' => 'Informação',
            'body' => '<p>Agendamento para amanhã.</p>',
        ]);

        $this->assertSame($normalized, $valid);
    }

    public function test_socials_style_is_validated(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $this->assertSame(
            [],
            $support->validate('socials', [
                'instagram' => '@meulinkbio',
                'style' => 'pills',
            ]),
        );

        $errors = $support->validate('socials', [
            'instagram' => 'javascript:alert(1)',
            'style' => 'giant',
        ]);

        $this->assertArrayHasKey('config.instagram', $errors);
        $this->assertArrayHasKey('config.style', $errors);
    }

    public function test_viewer_count_widget_accepts_optional_color_and_font(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $this->assertSame(
            [],
            $support->validate('viewerCount', [
                'color' => '#ffffff',
                'fontConfig' => [
                    'family' => 'Arial, sans-serif',
                    'google' => false,
                ],
            ]),
        );

        $this->assertSame(
            [
                'color' => '#ffffff',
                'fontConfig' => [
                    'family' => 'Arial, sans-serif',
                    'google' => false,
                ],
            ],
            $support->normalizeConfig('viewerCount', [
                'color' => '#ffffff',
                'fontConfig' => [
                    'family' => 'Arial, sans-serif',
                    'google' => false,
                    'ignored' => true,
                ],
                'ignored' => true,
            ]),
        );
    }

    public function test_booking_widget_config_is_accepted_and_normalized(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $this->assertSame(
            [],
            $support->validate('booking', [
                'title' => 'Agende',
                'serviceIds' => ['12', 15, 15],
                'showServiceDetails' => true,
            ]),
        );

        $this->assertSame(
            [12, 15],
            $support->normalizeConfig('booking', [
                'serviceIds' => ['12', 15, 15, 'invalid'],
                'showServiceDetails' => true,
            ])['serviceIds'],
        );
    }

    public function test_booking_widget_rejects_unknown_config(): void
    {
        $errors = app(BiolinkWidgetConfig::class)->validate('booking', [
            'unknown' => true,
        ]);

        $this->assertArrayHasKey('config', $errors);
    }

    public function test_viewer_count_widget_rejects_invalid_color_and_font(): void
    {
        $errors = app(BiolinkWidgetConfig::class)->validate('viewerCount', [
            'color' => 'red',
            'fontConfig' => [
                'family' => 'url(javascript:alert(1))',
                'google' => 'yes',
            ],
        ]);

        $this->assertArrayHasKey('config.color', $errors);
        $this->assertArrayHasKey('config.fontConfig.family', $errors);
        $this->assertArrayHasKey('config.fontConfig.google', $errors);
    }

    public function test_discord_and_gaming_profile_configs_are_accepted(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $this->assertSame(
            [],
            $support->validate('discordPresence', [
                'title' => 'Discord',
                'discordUsername' => 'AndradeRole',
                'discordStatus' => 'online',
                'discordActivity' => 'Riding with the community',
                'discordUrl' => 'https://discord.gg/example',
                'buttonLabel' => 'Join Discord',
            ]),
        );

        $this->assertSame(
            [],
            $support->validate('gamingProfile', [
                'title' => 'Gaming profile',
                'gamerTag' => 'AndradeRole',
                'currentGame' => 'Forza Horizon 5',
                'platform' => 'PC',
                'rank' => 'Diamond',
                'gamingUrl' => 'https://steamcommunity.com/id/example',
                'buttonLabel' => 'View profile',
            ]),
        );

        $errors = $support->validate('discordPresence', [
            'discordStatus' => 'busy',
            'discordUrl' => 'javascript:alert(1)',
        ]);

        $this->assertArrayHasKey('config.discordStatus', $errors);
        $this->assertArrayHasKey('config.discordUrl', $errors);
    }

    public function test_public_profile_sources_require_valid_ids_and_steam_urls(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $this->assertSame(
            [],
            $support->validate('discordPresence', [
                'discordSource' => 'lanyard',
                'discordUserId' => '123456789012345678',
            ]),
        );

        $this->assertSame(
            [],
            $support->validate('gamingProfile', [
                'gamingSource' => 'steam',
                'steamProfileUrl' =>
                    'https://steamcommunity.com/id/andrade-role',
            ]),
        );

        $discordErrors = $support->validate('discordPresence', [
            'discordSource' => 'lanyard',
            'discordUserId' => 'playername',
        ]);
        $this->assertArrayHasKey('config.discordUserId', $discordErrors);

        $steamErrors = $support->validate('gamingProfile', [
            'gamingSource' => 'steam',
            'steamProfileUrl' => 'https://example.com/id/andrade-role',
        ]);
        $this->assertArrayHasKey('config.steamProfileUrl', $steamErrors);
    }

    public function test_new_widget_catalog_configs_are_accepted(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $this->assertSame(
            [],
            $support->validate('contactCard', [
                'title' => 'Contact',
                'name' => 'Jane Doe',
                'email' => 'jane@example.com',
                'phone' => '+55 11 99999-9999',
                'whatsapp' => '+55 11 99999-9999',
                'address' => 'Sao Paulo',
                'hours' => 'Mon-Fri',
                'url' => 'https://example.com/contact',
                'buttonLabel' => 'Contact',
            ]),
        );

        $this->assertSame(
            [],
            $support->validate('smsSignup', [
                'title' => 'Join by SMS',
                'buttonLabel' => 'Subscribe',
                'successMessage' => 'You are subscribed.',
                'consentText' => 'I agree.',
                'campaign' => 'launch',
            ]),
        );

        $this->assertSame(
            [],
            $support->validate(
                'poll',
                [
                    'title' => 'Poll',
                    'question' => 'Pick one',
                    'buttonLabel' => 'Vote',
                    'successMessage' => 'Saved.',
                    'consentText' => 'I agree.',
                    'showResults' => true,
                ],
                [
                    ['title' => 'Option A', 'active' => true],
                    ['title' => 'Option B', 'active' => true],
                ],
            ),
        );

        $this->assertSame(
            [],
            $support->validate('discountCode', [
                'title' => 'Coupon',
                'code' => 'SAVE10',
                'expiresAt' => '2026-08-01',
                'url' => 'https://example.com',
            ]),
        );

        $this->assertSame(
            [],
            $support->validate('externalForm', [
                'title' => 'Form',
                'url' => 'https://docs.google.com/forms/d/e/example/viewform',
                'embedMode' => 'iframe',
            ]),
        );
    }

    public function test_linked_products_only_accept_the_catalog_source(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $this->assertSame(
            [],
            $support->validate('linkedProduct', [
                'source' => 'catalog',
                'productIds' => [1, 2],
            ]),
        );

        $errors = $support->validate('linkedProduct', [
            'source' => 'legacy',
        ]);

        $this->assertArrayHasKey('config.source', $errors);
    }

    public function test_product_style_config_is_accepted_and_normalized(): void
    {
        $support = app(BiolinkWidgetConfig::class);
        $config = [
            'title' => 'Products',
            'layout' => 'list',
            'productStyle' => [
                'imagePosition' => 'left',
                'imageSize' => 'large',
                'imageRadius' => 14,
                'showImages' => true,
                'showImageFallback' => true,
                'cardTransparency' => 20,
                'cardBorderWidth' => 2,
                'cardGlow' => true,
                'pricePosition' => 'right',
                'actionStyle' => 'icon',
            ],
        ];

        $this->assertSame([], $support->validate('linkedProduct', $config));
        $normalized = $support->normalizeConfig('linkedProduct', $config);

        $this->assertSame('icon', $normalized['productStyle']['actionStyle']);
    }

    public function test_product_style_config_rejects_invalid_values(): void
    {
        $errors = app(BiolinkWidgetConfig::class)->validate('linkedProduct', [
            'productStyle' => [
                'imagePosition' => 'right',
                'imageSize' => 'huge',
                'imageRadius' => 40,
                'showImages' => 'yes',
                'cardTransparency' => 101,
                'cardBorderWidth' => 9,
                'pricePosition' => 'top',
                'actionStyle' => 'link',
            ],
        ]);

        $this->assertArrayHasKey('config.productStyle.imagePosition', $errors);
        $this->assertArrayHasKey('config.productStyle.imageSize', $errors);
        $this->assertArrayHasKey('config.productStyle.imageRadius', $errors);
        $this->assertArrayHasKey('config.productStyle.showImages', $errors);
        $this->assertArrayHasKey(
            'config.productStyle.cardTransparency',
            $errors,
        );
        $this->assertArrayHasKey(
            'config.productStyle.cardBorderWidth',
            $errors,
        );
        $this->assertArrayHasKey('config.productStyle.pricePosition', $errors);
        $this->assertArrayHasKey('config.productStyle.actionStyle', $errors);
    }

    public function test_collection_layout_aliases_zoom_and_item_style_are_accepted(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        foreach (
            [
                'classic',
                'list',
                'grid',
                'featured',
                'carousel',
                'line',
                'card',
                'slide',
            ]
            as $layout
        ) {
            $this->assertSame(
                [],
                $support->validate('imageGallery', [
                    'layout' => $layout,
                    'imageZoom' => true,
                    'itemStyle' => [
                        'backgroundColor' => '#101828',
                        'textColor' => '#ffffff',
                        'borderColor' => '#475467',
                        'transparency' => 24,
                        'borderWidth' => 2,
                        'shadow' => 'soft',
                    ],
                ]),
            );
        }

        $normalized = $support->normalizeConfig('imageGallery', [
            'layout' => 'slide',
            'imageZoom' => true,
            'itemStyle' => [
                'backgroundColor' => '#101828',
                'ignored' => true,
            ],
        ]);

        $this->assertTrue($normalized['imageZoom']);
        $this->assertSame(
            '#101828',
            $normalized['itemStyle']['backgroundColor'],
        );
        $this->assertArrayNotHasKey('ignored', $normalized['itemStyle']);
    }

    public function test_collection_item_style_rejects_invalid_values(): void
    {
        $errors = app(BiolinkWidgetConfig::class)->validate('linkedProduct', [
            'layout' => 'masonry',
            'itemStyle' => [
                'backgroundColor' => 'red',
                'transparency' => 101,
                'borderWidth' => 9,
                'shadow' => 'glow',
            ],
        ]);

        $this->assertArrayHasKey('config.layout', $errors);
        $this->assertArrayHasKey('config.itemStyle.backgroundColor', $errors);
        $this->assertArrayHasKey('config.itemStyle.transparency', $errors);
        $this->assertArrayHasKey('config.itemStyle.borderWidth', $errors);
        $this->assertArrayHasKey('config.itemStyle.shadow', $errors);
    }

    public function test_qr_and_location_display_modes_are_accepted_and_normalized(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $this->assertSame(
            [],
            $support->validate('qrCode', [
                'value' => 'https://example.com/menu',
                'qrDisplay' => 'button',
            ]),
        );
        $this->assertSame(
            'button',
            $support->normalizeConfig('qrCode', [
                'value' => 'https://example.com/menu',
                'qrDisplay' => 'button',
            ])['qrDisplay'],
        );

        $this->assertSame(
            [],
            $support->validate('location', [
                'address' => 'Rua Magalhaes Barata 120',
                'url' => 'https://www.google.com/maps/embed?pb=test',
                'mapDisplay' => 'iframe',
            ]),
        );
        $this->assertSame(
            'iframe',
            $support->normalizeConfig('location', [
                'address' => 'Rua Magalhaes Barata 120',
                'url' => 'https://www.google.com/maps/embed?pb=test',
                'mapDisplay' => 'iframe',
            ])['mapDisplay'],
        );

        $locationConfig = [
            'address' => 'Praça da Sé, São Paulo - SP',
            'mapDisplay' => 'modal',
            'mapProvider' => 'waze',
            'cep' => '01001-000',
            'street' => 'Praça da Sé',
            'number' => '1',
            'neighborhood' => 'Sé',
            'city' => 'São Paulo',
            'state' => 'SP',
            'latitude' => '-23.550520',
            'longitude' => '-46.633308',
        ];

        $this->assertSame([], $support->validate('location', $locationConfig));
        $this->assertSame(
            'waze',
            $support->normalizeConfig('location', $locationConfig)[
                'mapProvider'
            ],
        );

        $coordinateErrors = $support->validate('location', [
            'mapProvider' => 'invalid',
            'cep' => '123',
            'latitude' => '-91',
            'longitude' => 'not-a-coordinate',
        ]);
        $this->assertArrayHasKey('config.mapProvider', $coordinateErrors);
        $this->assertArrayHasKey('config.cep', $coordinateErrors);
        $this->assertArrayHasKey('config.latitude', $coordinateErrors);
        $this->assertArrayHasKey('config.longitude', $coordinateErrors);

        $errors = $support->validate('qrCode', [
            'value' => 'https://example.com/menu',
            'qrDisplay' => 'modal',
        ]);
        $this->assertArrayHasKey('config.qrDisplay', $errors);
    }

    public function test_widget_validation_rejects_unknown_keys_and_unsafe_urls(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $errors = $support->validate('contactForm', [
            'title' => 'Contact',
            'script' => 'alert(1)',
        ]);
        $this->assertArrayHasKey('config', $errors);

        $errors = $support->validate(
            'linkedProduct',
            ['title' => 'Products'],
            [
                [
                    'title' => 'Unsafe product',
                    'url' => 'javascript:alert(1)',
                    'image' => 'data:image/svg+xml,<svg onload=alert(1)>',
                ],
            ],
        );
        $this->assertArrayHasKey('items.0.url', $errors);
        $this->assertArrayHasKey('items.0.image', $errors);
    }

    public function test_normalizes_item_widgets_without_touching_existing_widgets(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $this->assertSame(
            [['title' => 'Ignored']],
            $support->normalizeItems('text', [['title' => 'Ignored']]),
        );

        $items = $support->normalizeItems('linkCollection', [
            [
                'title' => ' Docs ',
                'description' => '',
                'url' => ' https://example.com/docs ',
                'price' => '',
                'currency' => '',
            ],
        ]);

        $this->assertSame('Docs', $items[0]['title']);
        $this->assertSame('https://example.com/docs', $items[0]['url']);
        $this->assertSame('link', $items[0]['type']);
        $this->assertSame(0, $items[0]['sort_order']);
        $this->assertNull($items[0]['price']);
    }

    public function test_music_hub_accepts_known_services_and_preserves_legacy_music_links(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $errors = $support->validate(
            'podcastMusic',
            [
                'title' => 'Road trip set',
                'description' => 'Andrade Role',
                'coverImage' => 'https://example.com/cover.jpg',
                'spotifyPresentation' => 'embed',
            ],
            [
                [
                    'type' => 'spotify',
                    'url' => 'https://open.spotify.com/track/123',
                ],
                [
                    'type' => 'musicLink',
                    'url' => 'https://example.com/pre-save',
                ],
            ],
        );

        $this->assertSame([], $errors);

        $normalized = $support->normalizeConfig('podcastMusic', [
            'title' => 'Road trip set',
            'coverImage' => 'https://example.com/cover.jpg',
            'spotifyPresentation' => 'link',
            'layout' => 'carousel',
        ]);

        $this->assertSame(
            'https://example.com/cover.jpg',
            $normalized['coverImage'],
        );
        $this->assertSame('link', $normalized['spotifyPresentation']);
        $this->assertArrayNotHasKey('layout', $normalized);
    }

    public function test_music_hub_rejects_invalid_service_rules(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $errors = $support->validate(
            'podcastMusic',
            ['title' => 'Release', 'spotifyPresentation' => 'embed'],
            [
                [
                    'type' => 'spotify',
                    'url' => 'http://open.spotify.com/track/123',
                ],
                [
                    'type' => 'spotify',
                    'url' => 'https://open.spotify.com/track/456',
                ],
                ['type' => 'custom', 'url' => 'https://example.com/custom'],
            ],
        );

        $this->assertArrayHasKey('items.0.url', $errors);
        $this->assertArrayHasKey('items.1.type', $errors);
        $this->assertArrayHasKey('items.2.title', $errors);

        $errors = $support->validate(
            'podcastMusic',
            ['title' => 'Release', 'spotifyPresentation' => 'embed'],
            [['type' => 'youtube', 'url' => 'https://youtube.com/watch?v=123']],
        );

        $this->assertArrayHasKey('config.spotifyPresentation', $errors);
    }

    public function test_music_hub_accepts_multiple_rich_releases(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $items = [
            [
                'type' => 'song',
                'title' => 'Vitamina C - Ao Vivo',
                'description' => 'Suel e Grupo Menos E Mais',
                'image' => 'https://example.com/vitamina-c.jpg',
                'payload' => [
                    'spotifyPresentation' => 'embed',
                    'services' => [
                        [
                            'type' => 'spotify',
                            'url' => 'https://open.spotify.com/track/123',
                            'active' => true,
                            'sort_order' => 0,
                        ],
                        [
                            'type' => 'appleMusic',
                            'url' => 'https://music.apple.com/us/album/123',
                            'active' => true,
                            'sort_order' => 1,
                        ],
                    ],
                ],
            ],
            [
                'type' => 'playlist',
                'title' => 'Playlist da Estrada',
                'description' => 'Selecao para viajar',
                'image' => 'https://example.com/playlist.jpg',
                'payload' => [
                    'spotifyPresentation' => 'link',
                    'services' => [
                        [
                            'type' => 'custom',
                            'title' => 'Site oficial',
                            'url' => 'https://example.com/listen',
                            'active' => true,
                        ],
                        [
                            'type' => 'pandora',
                            'url' => 'https://pandora.com/playlist/123',
                        ],
                    ],
                ],
            ],
        ];

        $this->assertSame(
            [],
            $support->validate(
                'podcastMusic',
                [
                    'title' => 'Musicas do role',
                ],
                $items,
            ),
        );

        $normalized = $support->normalizeItems('podcastMusic', $items);
        $this->assertCount(2, $normalized);
        $this->assertSame('song', $normalized[0]['type']);
        $this->assertSame('Vitamina C - Ao Vivo', $normalized[0]['title']);
        $this->assertSame(
            'spotify',
            $normalized[0]['payload']['services'][0]['type'],
        );
    }

    public function test_music_hub_rejects_invalid_nested_release_services(): void
    {
        $errors = app(BiolinkWidgetConfig::class)->validate(
            'podcastMusic',
            ['title' => 'Music Hub'],
            [
                [
                    'type' => 'invalid',
                    'title' => '',
                    'payload' => [
                        'services' => [
                            [
                                'type' => 'spotify',
                                'url' => 'https://example.com/not-spotify',
                            ],
                            [
                                'type' => 'spotify',
                                'url' => 'https://open.spotify.com/track/456',
                            ],
                            [
                                'type' => 'custom',
                                'url' => 'https://example.com/custom',
                            ],
                        ],
                    ],
                ],
            ],
        );

        $this->assertArrayHasKey('items.0.type', $errors);
        $this->assertArrayHasKey('items.0.title', $errors);
        $this->assertArrayHasKey('items.0.payload.services.0.url', $errors);
        $this->assertArrayHasKey('items.0.payload.services.1.type', $errors);
        $this->assertArrayHasKey('items.0.payload.services.2.title', $errors);
    }

    public function test_spotify_player_requires_a_spotify_url(): void
    {
        $errors = app(BiolinkWidgetConfig::class)->validate('spotify', [
            'spotifyPresentation' => 'embed',
        ]);

        $this->assertArrayHasKey('config.url', $errors);

        $errors = app(BiolinkWidgetConfig::class)->validate('spotify', [
            'url' => 'https://example.com/track/123',
            'spotifyPresentation' => 'embed',
        ]);

        $this->assertArrayHasKey('config.url', $errors);
    }

    public function test_biolink_widget_password_is_hashed_and_schedule_visibility_is_checked(): void
    {
        $widget = new BiolinkWidget([
            'active' => true,
            'password' => 'secret-pass',
        ]);

        $this->assertNotSame('secret-pass', $widget->password);
        $this->assertTrue($widget->passwordMatches('secret-pass'));
        $this->assertFalse($widget->passwordMatches('wrong-pass'));

        $widget->activates_at = now()->addHour();
        $this->assertFalse($widget->isCurrentlyVisible());

        $widget->activates_at = now()->subHour();
        $widget->expires_at = now()->addHour();
        $this->assertTrue($widget->isCurrentlyVisible());

        $widget->expires_at = now()->subMinute();
        $this->assertFalse($widget->isCurrentlyVisible());
    }

    public function test_youtube_cover_and_generic_video_motion_are_validated(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $this->assertSame(
            [],
            $support->validate('youtube', [
                'url' => 'https://www.youtube.com/watch?v=abcdefghijk',
                'presentation' => 'cover',
                'coverImage' => 'https://example.com/video-cover.jpg',
                'playButtonMotion' => 'pulse',
            ]),
        );
        $this->assertSame(
            [],
            $support->validate('genericVideo', [
                'url' => 'https://example.com/video.mp4',
                'presentation' => 'featured',
                'playBehavior' => 'inline',
                'playButtonMotion' => 'pulse',
            ]),
        );

        $errors = $support->validate('youtube', [
            'url' => 'https://www.youtube.com/watch?v=abcdefghijk',
            'presentation' => 'poster',
            'coverImage' => 'javascript:alert(1)',
            'playButtonMotion' => 'blink',
        ]);
        $this->assertArrayHasKey('config.presentation', $errors);
        $this->assertArrayHasKey('config.coverImage', $errors);
        $this->assertArrayHasKey('config.playButtonMotion', $errors);
    }

    public function test_social_color_mode_and_offer_card_variant_are_validated(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $this->assertSame(
            [],
            $support->validate('socials', [
                'instagram' => '@meulinkbio',
                'style' => 'icons',
                'colorMode' => 'brand',
            ]),
        );
        $this->assertSame(
            [],
            $support->validate('linkedProduct', [
                'productStyle' => ['cardVariant' => 'media'],
            ]),
        );

        $socialErrors = $support->validate('socials', [
            'colorMode' => 'neon',
        ]);
        $productErrors = $support->validate('linkedProduct', [
            'productStyle' => ['cardVariant' => 'floating'],
        ]);

        $this->assertArrayHasKey('config.colorMode', $socialErrors);
        $this->assertArrayHasKey(
            'config.productStyle.cardVariant',
            $productErrors,
        );
    }

    public function test_manual_product_merchandising_is_validated(): void
    {
        $support = app(BiolinkWidgetConfig::class);
        $items = [
            [
                'title' => 'Helmet',
                'price' => 799.9,
                'currency' => 'BRL',
                'payload' => [
                    'merchandising' => [
                        'comparePrice' => 999.9,
                        'badge' => 'Mais vendido',
                        'rating' => 4.8,
                        'stockLabel' => 'Pronta entrega',
                    ],
                ],
            ],
        ];

        $this->assertSame([], $support->validate('linkedProduct', [], $items));

        $items[0]['payload']['merchandising'] = [
            'comparePrice' => 700,
            'rating' => 6,
            'script' => 'alert(1)',
        ];
        $errors = $support->validate('linkedProduct', [], $items);

        $this->assertArrayHasKey('items.0.payload.merchandising', $errors);
        $this->assertArrayHasKey(
            'items.0.payload.merchandising.comparePrice',
            $errors,
        );
        $this->assertArrayHasKey(
            'items.0.payload.merchandising.rating',
            $errors,
        );

        $items[0]['payload']['merchandising'] = 'invalid';
        $errors = $support->validate('linkedProduct', [], $items);
        $this->assertArrayHasKey('items.0.payload.merchandising', $errors);
    }

    public function test_embed_collection_accepts_safe_previews_and_rejects_unsafe_payloads(): void
    {
        $support = app(BiolinkWidgetConfig::class);
        $items = [
            [
                'title' => 'Road trip',
                'description' => 'A short Instagram preview.',
                'url' => 'https://www.instagram.com/p/example/',
                'image' => 'https://cdn.example.com/preview.jpg',
                'payload' => [
                    'provider' => 'instagram',
                    'domain' => 'instagram.com',
                ],
            ],
        ];

        $this->assertSame(
            [],
            $support->validate(
                'embedCollection',
                [
                    'title' => 'Featured posts',
                    'layout' => 'classic',
                    'previewStyle' => 'compact',
                ],
                $items,
            ),
        );

        $normalized = $support->normalizeItems('embedCollection', $items);
        $this->assertSame('embed', $normalized[0]['type']);
        $this->assertSame('instagram.com', $normalized[0]['payload']['domain']);

        $items[0]['url'] = 'javascript:alert(1)';
        $items[0]['payload'] = [
            'provider' => 'unknown',
            'domain' => '<script>',
            'html' => '<iframe></iframe>',
        ];
        $errors = $support->validate(
            'embedCollection',
            ['previewStyle' => 'flashing'],
            $items,
        );

        $this->assertArrayHasKey('config.previewStyle', $errors);
        $this->assertArrayHasKey('items.0.url', $errors);
        $this->assertArrayHasKey('items.0.payload', $errors);
        $this->assertArrayHasKey('items.0.payload.provider', $errors);
    }

    public function test_enhanced_widget_types_are_validated_and_normalized(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $this->assertSame([], $support->validate('countdown', [
            'title' => 'Launch',
            'targetAt' => '2026-12-01T09:30',
            'timezone' => 'America/Sao_Paulo',
            'completionBehavior' => 'link',
            'completionUrl' => 'https://example.com/launch',
            'showSeconds' => true,
        ]));
        $this->assertSame([], $support->validate('audio', [
            'title' => 'Episode',
            'url' => 'storage/biolink-audio/episode.mp3',
            'coverImage' => 'storage/link-images/cover.webp',
        ]));
        $this->assertSame([], $support->validate('imageComparison', [
            'beforeImage' => 'storage/link-images/before.webp',
            'afterImage' => 'storage/link-images/after.webp',
            'initialPosition' => 45,
        ]));

        $normalized = $support->normalizeConfig('imageComparison', [
            'beforeImage' => ' storage/link-images/before.webp ',
            'afterImage' => 'storage/link-images/after.webp',
            'initialPosition' => '45',
            'unknown' => 'discarded',
        ]);

        $this->assertSame(45, $normalized['initialPosition']);
        $this->assertArrayNotHasKey('unknown', $normalized);

        $errors = $support->validate('countdown', [
            'targetAt' => 'not-a-date',
            'timezone' => 'Local/Browser',
            'completionBehavior' => 'execute',
        ]);
        $this->assertArrayHasKey('config.targetAt', $errors);
        $this->assertArrayHasKey('config.timezone', $errors);
        $this->assertArrayHasKey('config.completionBehavior', $errors);
    }

    public function test_generic_evolutions_keep_existing_widget_types(): void
    {
        $support = app(BiolinkWidgetConfig::class);

        $this->assertSame([], $support->validate('text', [
            'title' => 'Important',
            'variant' => 'notice',
            'noticeTone' => 'warning',
        ]));
        $this->assertSame([], $support->validate('document', [
            'url' => 'storage/biolink-documents/report.pdf',
            'documentKind' => 'pdf',
        ]));
        $this->assertSame([], $support->validate('contactCard', [
            'name' => 'Public contact',
            'enableVcard' => true,
        ]));
        $this->assertSame([], $support->validate('eventList', [
            'layout' => 'timeline',
        ], []));

        $errors = $support->validate('text', ['variant' => 'script']);
        $this->assertArrayHasKey('config.variant', $errors);
    }

    public function test_donation_accepts_valid_pix_and_rejects_invalid_key(): void
    {
        $support = app(BiolinkWidgetConfig::class);
        $config = [
            'pixEnabled' => true,
            'pixKeyType' => 'email',
            'pixKey' => 'creator@example.com',
            'pixReceiverName' => 'Creator Example',
            'pixReceiverCity' => 'Sao Paulo',
            'pixAmount' => '25.00',
            'pixDescription' => 'Support',
            'pixTxid' => 'MLB25',
        ];

        $this->assertSame([], $support->validate('donation', $config, []));

        $config['pixKey'] = 'not-an-email';
        $errors = $support->validate('donation', $config, []);
        $this->assertArrayHasKey('config.pixKey', $errors);
    }
}
