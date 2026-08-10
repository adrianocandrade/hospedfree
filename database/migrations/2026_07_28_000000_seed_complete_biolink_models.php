<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    private const SEED_VERSION = 'complete-models-v1';

    public function up(): void
    {
        if (
            !Schema::hasTable('biolink_themes') ||
            !Schema::hasColumn('biolink_themes', 'metadata')
        ) {
            return;
        }

        $now = now();
        foreach ($this->models() as $model) {
            DB::table('biolink_themes')->updateOrInsert(
                ['slug' => $model['slug']],
                [
                    'name' => $model['name'],
                    'category' => 'curated',
                    'config' => json_encode(
                        $this->appearance(
                            $model['slug'],
                            $model['palette'],
                            $model['footerPreset'],
                        ),
                        JSON_THROW_ON_ERROR,
                    ),
                    'metadata' => json_encode(
                        [
                            'isModel' => true,
                            'device' => 'both',
                            'tags' => $model['tags'],
                            'requiredFeatures' => ['model_gallery'],
                            'seedVersion' => self::SEED_VERSION,
                            'contentBlueprint' => $this->blueprint(
                                $model['widgets'],
                                $model['footerKeys'],
                            ),
                        ],
                        JSON_THROW_ON_ERROR,
                    ),
                    'sort_order' => $model['sortOrder'],
                    'is_published' => true,
                    'is_system' => true,
                    'created_by' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );
        }
    }

    public function down(): void
    {
        if (
            !Schema::hasTable('biolink_themes') ||
            !Schema::hasColumn('biolink_themes', 'metadata')
        ) {
            return;
        }

        $ids = DB::table('biolink_themes')
            ->whereIn('slug', array_column($this->models(), 'slug'))
            ->get(['id', 'metadata'])
            ->filter(function (object $theme) {
                $metadata = json_decode($theme->metadata ?? '[]', true);

                return ($metadata['seedVersion'] ?? null) ===
                    self::SEED_VERSION;
            })
            ->pluck('id');

        if ($ids->isNotEmpty()) {
            DB::table('biolink_themes')->whereIn('id', $ids)->delete();
        }
    }

    private function appearance(
        string $slug,
        array $palette,
        string $footerPreset,
    ): array {
        return [
            'theme' => [
                'slug' => $slug,
                'category' => 'curated',
                'locked' => false,
                'modified' => false,
            ],
            'bgConfig' => [
                'activeType' => 'gradient',
                'backgroundColor' => $palette['background'],
                'backgroundImage' => $palette['gradient'],
                'color' => $palette['text'],
            ],
            'btnConfig' => [
                'variant' => 'solid',
                'radius' => 'rounded-lg',
                'shadow' => 'soft',
                'color' => $palette['accent'],
                'textColor' => $palette['accentText'],
            ],
            'boxConfig' => [
                'variant' => 'outline',
                'radius' => 'rounded-lg',
                'shadow' => 'none',
                'color' => $palette['surface'],
                'textColor' => $palette['text'],
                'borderColor' => $palette['border'],
                'borderWidth' => 1,
            ],
            'fontConfig' => [
                'family' => 'ui-sans-serif, system-ui, sans-serif',
            ],
            'headerConfig' => [
                'layout' => 'banner',
                'alignment' => 'center',
                'titleStyle' => 'text',
                'titleColor' => $palette['text'],
                'bannerBackgroundType' => 'gradient',
                'bannerGradientFrom' => $palette['surface'],
                'bannerGradientTo' => $palette['background'],
                'showShareButton' => true,
                'showNavigation' => true,
            ],
            'desktopConfig' => [
                'enabled' => true,
                'layoutMode' => 'full',
                'contentMode' => 'stack',
                'gridMode' => 'auto',
                'profilePlacement' => 'center',
                'surfaceMode' => 'open',
            ],
            'footerConfig' => [
                'version' => 1,
                'enabled' => true,
                'preset' => $footerPreset,
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
        ];
    }

    private function blueprint(array $widgets, array $footerKeys): array
    {
        $widgets = collect($widgets)
            ->values()
            ->map(function (array $widget, int $index) {
                $widget['position'] = $index;
                $widget['active'] = false;
                $widget['config']['blueprintKey'] = $widget['key'];
                $widget['config']['section'] = [
                    ...$widget['config']['section'] ?? [],
                    'presentation' => 'open',
                    'anchorLabel' =>
                        $widget['config']['title'] ?? $widget['key'],
                ];

                return $widget;
            })
            ->all();

        $checklist = collect($widgets)
            ->map(
                fn(array $widget) => [
                    'widgetKey' => $widget['key'],
                    'label' =>
                        'Preencha e revise: ' .
                        ($widget['config']['title'] ?? $widget['key']),
                ],
            )
            ->all();

        return [
            'version' => 1,
            'widgets' => $widgets,
            'checklist' => $checklist,
            'header' => ['navigationWidgetKeys' => $footerKeys],
            'footer' => [
                'links' => collect($footerKeys)
                    ->values()
                    ->map(
                        fn(string $key, int $index) => [
                            'id' => "model-$key",
                            'source' => 'widget',
                            'widgetKey' => $key,
                            'variant' =>
                                $index === count($footerKeys) - 1
                                    ? 'cta'
                                    : 'link',
                            'active' => true,
                            'position' => $index,
                        ],
                    )
                    ->all(),
            ],
        ];
    }

    private function models(): array
    {
        return [
            [
                'name' => 'Aventura & Conteúdo',
                'slug' => 'model-aventura-conteudo',
                'sortOrder' => 1000,
                'footerPreset' => 'compact',
                'tags' => ['criador', 'aventura', 'vídeo'],
                'palette' => $this->palette(
                    '#07111f',
                    '#e9f3ff',
                    '#36a7ff',
                    '#061a2d',
                    '#284662',
                    '#04101d',
                ),
                'footerKeys' => ['destaques', 'video', 'motos'],
                'widgets' => [
                    $this->widget(
                        'destaques',
                        'linkCollection',
                        'Destaques',
                        [
                            $this->item('Roteiro em destaque'),
                            $this->item('Bastidores da viagem'),
                        ],
                        ['layout' => 'slide'],
                    ),
                    $this->widget(
                        'patrocinadores',
                        'logoCloud',
                        'Patrocinadores',
                        [
                            $this->item('Parceiro principal'),
                            $this->item('Apoiador'),
                        ],
                        ['layout' => 'strip'],
                    ),
                    $this->widget(
                        'video',
                        'genericVideo',
                        'Último vídeo',
                        [],
                        [
                            'presentation' => 'featured',
                            'buttonLabel' => 'Assistir',
                        ],
                    ),
                    $this->widget(
                        'equipamentos',
                        'linkedProduct',
                        'Equipamentos',
                        [
                            $this->item('Item essencial'),
                            $this->item('Equipamento recomendado'),
                        ],
                        ['layout' => 'slide'],
                    ),
                    $this->widget(
                        'motos',
                        'spotlight',
                        'Minha máquina',
                        [
                            $this->item('Ano e versão'),
                            $this->item('Ponto forte'),
                        ],
                        ['buttonLabel' => 'Ver ficha completa'],
                    ),
                    $this->widget('playlists', 'linkCollection', 'Playlists', [
                        $this->item('Viagens'),
                        $this->item('Guias e manutenção'),
                    ]),
                    $this->widget('mural', 'socialFeed', 'Mural', [
                        $this->item(
                            'Publicação recente',
                            'Conte a história por trás deste conteúdo.',
                        ),
                    ]),
                ],
            ],
            [
                'name' => 'Criadora & Comunidade',
                'slug' => 'model-criadora-comunidade',
                'sortOrder' => 1010,
                'footerPreset' => 'community',
                'tags' => ['criadora', 'comunidade', 'newsletter'],
                'palette' => $this->palette(
                    '#f7f5ff',
                    '#201a3d',
                    '#6d45e5',
                    '#ffffff',
                    '#ddd6f6',
                    '#ffffff',
                ),
                'footerKeys' => ['recursos', 'sobre', 'newsletter'],
                'widgets' => [
                    $this->widget(
                        'recursos',
                        'linkedProduct',
                        'Recursos gratuitos',
                        [
                            $this->item('Material gratuito'),
                            $this->item('Guia prático'),
                        ],
                        ['layout' => 'grid'],
                    ),
                    $this->widget('sobre', 'spotlight', 'Sobre mim', [
                        $this->item('Conteúdo útil'),
                        $this->item('Comunidade acolhedora'),
                    ]),
                    $this->widget(
                        'metricas',
                        'stats',
                        'Números que conectam',
                        [
                            $this->item('Comunidade'),
                            $this->item('Conteúdos publicados'),
                            $this->item('Engajamento'),
                        ],
                        ['layout' => 'grid'],
                    ),
                    $this->widget(
                        'newsletter',
                        'emailSignup',
                        'Receba novidades',
                        [],
                        [
                            'presentation' => 'inline',
                            'buttonLabel' => 'Inscrever-se',
                        ],
                    ),
                    $this->widget(
                        'avaliacoes',
                        'reviews',
                        'O que dizem por aí',
                        [
                            $this->item(
                                'Nome da pessoa',
                                'Adicione um depoimento real.',
                            ),
                            $this->item(
                                'Nome da pessoa',
                                'Adicione um depoimento real.',
                            ),
                        ],
                        ['layout' => 'slide'],
                    ),
                    $this->widget(
                        'conectar',
                        'ctaBanner',
                        'Vamos nos conectar?',
                        [],
                        [
                            'description' =>
                                'Convide a comunidade para a próxima ação.',
                            'buttonLabel' => 'Entrar em contato',
                            'layout' => 'split',
                        ],
                    ),
                ],
            ],
            [
                'name' => 'Restaurante & Delivery',
                'slug' => 'model-restaurante-delivery',
                'sortOrder' => 1020,
                'footerPreset' => 'commercial',
                'tags' => ['restaurante', 'delivery', 'cardápio'],
                'palette' => $this->palette(
                    '#100b08',
                    '#fff5e7',
                    '#f5a524',
                    '#20140d',
                    '#654128',
                    '#080503',
                ),
                'footerKeys' => ['pedidos', 'produtos', 'contato'],
                'widgets' => [
                    $this->widget('pedidos', 'linkCollection', 'Peça agora', [
                        $this->item('Delivery'),
                        $this->item('Retirar no balcão'),
                        $this->item('Falar com a equipe'),
                    ]),
                    $this->widget(
                        'produtos',
                        'linkedProduct',
                        'Destaques do cardápio',
                        [
                            $this->item('Produto em destaque'),
                            $this->item('Produto em destaque'),
                            $this->item('Produto em destaque'),
                        ],
                        ['layout' => 'slide'],
                    ),
                    $this->widget(
                        'combos',
                        'linkedProduct',
                        'Combos',
                        [
                            $this->item('Combo da casa'),
                            $this->item('Combo especial'),
                        ],
                        ['layout' => 'grid'],
                    ),
                    $this->widget(
                        'promocao',
                        'ctaBanner',
                        'Oferta da semana',
                        [],
                        [
                            'buttonLabel' => 'Ver promoção',
                            'layout' => 'background',
                        ],
                    ),
                    $this->widget('historia', 'spotlight', 'Nossa história', [
                        $this->item('Ingredientes selecionados'),
                        $this->item('Preparo cuidadoso'),
                    ]),
                    $this->widget(
                        'contato',
                        'contactCard',
                        'Contato e horários',
                        [],
                        [
                            'presentation' => 'business',
                            'buttonLabel' => 'Como chegar',
                        ],
                    ),
                    $this->widget(
                        'pagamentos',
                        'logoCloud',
                        'Formas de pagamento',
                        [
                            $this->item('Crédito'),
                            $this->item('Débito'),
                            $this->item('Pagamento instantâneo'),
                        ],
                        ['layout' => 'strip'],
                    ),
                ],
            ],
            [
                'name' => 'Barbearia Premium',
                'slug' => 'model-barbearia-premium',
                'sortOrder' => 1030,
                'footerPreset' => 'commercial',
                'tags' => ['barbearia', 'serviços', 'agendamento'],
                'palette' => $this->palette(
                    '#0b0b09',
                    '#fff8e8',
                    '#d5a64c',
                    '#181713',
                    '#5a4828',
                    '#050504',
                ),
                'footerKeys' => ['agendamento', 'servicos', 'informacoes'],
                'widgets' => [
                    $this->widget(
                        'agendamento',
                        'booking',
                        'Agende seu horário',
                        [],
                        [
                            'buttonLabel' => 'Agendar horário',
                        ],
                    ),
                    $this->widget(
                        'servicos',
                        'service',
                        'Nossos serviços',
                        [
                            $this->item('Serviço principal'),
                            $this->item('Serviço completo'),
                            $this->item('Serviço especial'),
                        ],
                        ['layout' => 'slide'],
                    ),
                    $this->widget(
                        'galeria',
                        'imageGallery',
                        'Nosso trabalho',
                        [
                            $this->item('Resultado em destaque'),
                            $this->item('Ambiente'),
                        ],
                        [
                            'layout' => 'grid',
                            'gridColumns' => 3,
                            'aspectRatio' => 'square',
                        ],
                    ),
                    $this->widget(
                        'oferta',
                        'ctaBanner',
                        'Oferta de boas-vindas',
                        [],
                        [
                            'buttonLabel' => 'Quero aproveitar',
                            'layout' => 'split',
                        ],
                    ),
                    $this->widget('sobre', 'spotlight', 'Sobre nós', [
                        $this->item('Profissionais experientes'),
                        $this->item('Atendimento personalizado'),
                    ]),
                    $this->widget(
                        'avaliacoes',
                        'reviews',
                        'O que nossos clientes dizem',
                        [
                            $this->item(
                                'Nome do cliente',
                                'Inclua uma avaliação verificada.',
                            ),
                        ],
                        ['layout' => 'slide'],
                    ),
                    $this->widget(
                        'informacoes',
                        'contactCard',
                        'Onde estamos',
                        [],
                        [
                            'presentation' => 'business',
                            'buttonLabel' => 'Ver no mapa',
                        ],
                    ),
                ],
            ],
            [
                'name' => 'Salão & Beleza',
                'slug' => 'model-salao-beleza',
                'sortOrder' => 1040,
                'footerPreset' => 'commercial',
                'tags' => ['salão', 'beleza', 'agendamento'],
                'palette' => $this->palette(
                    '#fff7f8',
                    '#421d2a',
                    '#df4f7b',
                    '#ffffff',
                    '#f0ccd7',
                    '#fffafa',
                ),
                'footerKeys' => ['servicos', 'galeria', 'localizacao'],
                'widgets' => [
                    $this->widget(
                        'servicos',
                        'service',
                        'Serviços em destaque',
                        [
                            $this->item('Serviço em destaque'),
                            $this->item('Serviço em destaque'),
                            $this->item('Serviço em destaque'),
                        ],
                        ['layout' => 'slide'],
                    ),
                    $this->widget(
                        'oferta',
                        'ctaBanner',
                        'Seu momento de autocuidado',
                        [],
                        [
                            'buttonLabel' => 'Quero aproveitar',
                            'layout' => 'split',
                        ],
                    ),
                    $this->widget('sobre', 'spotlight', 'Sobre nós', [
                        $this->item('Profissionais especializadas'),
                        $this->item('Produtos de qualidade'),
                        $this->item('Ambiente confortável'),
                    ]),
                    $this->widget(
                        'avaliacoes',
                        'reviews',
                        'O que nossas clientes dizem',
                        [
                            $this->item(
                                'Nome da cliente',
                                'Inclua uma avaliação verificada.',
                            ),
                        ],
                        ['layout' => 'slide'],
                    ),
                    $this->widget(
                        'galeria',
                        'imageGallery',
                        'Nosso trabalho',
                        [
                            $this->item('Resultado em destaque'),
                            $this->item('Ambiente'),
                        ],
                        [
                            'layout' => 'grid',
                            'gridColumns' => 3,
                            'aspectRatio' => 'portrait',
                        ],
                    ),
                    $this->widget(
                        'localizacao',
                        'contactCard',
                        'Localização e horários',
                        [],
                        [
                            'presentation' => 'business',
                            'buttonLabel' => 'Ver no mapa',
                        ],
                    ),
                    $this->widget(
                        'agendar',
                        'ctaBanner',
                        'Agende e realce sua beleza',
                        [],
                        [
                            'buttonLabel' => 'Agendar horário',
                            'layout' => 'compact',
                        ],
                    ),
                    $this->widget(
                        'pagamentos',
                        'logoCloud',
                        'Formas de pagamento',
                        [
                            $this->item('Crédito'),
                            $this->item('Débito'),
                            $this->item('Pagamento instantâneo'),
                        ],
                        ['layout' => 'strip'],
                    ),
                ],
            ],
        ];
    }

    private function widget(
        string $key,
        string $type,
        string $title,
        array $items = [],
        array $config = [],
    ): array {
        return [
            'key' => $key,
            'type' => $type,
            'config' => ['title' => $title, ...$config],
            ...$items === [] ? [] : ['items' => $items],
        ];
    }

    private function item(string $title, string|null $description = null): array
    {
        return array_filter(
            [
                'title' => $title,
                'description' => $description,
                'active' => true,
            ],
            fn(mixed $value) => $value !== null,
        );
    }

    private function palette(
        string $background,
        string $text,
        string $accent,
        string $surface,
        string $border,
        string $accentText,
    ): array {
        return [
            'background' => $background,
            'gradient' => "linear-gradient(180deg, $surface 0%, $background 42%, $background 100%)",
            'text' => $text,
            'accent' => $accent,
            'accentText' => $accentText,
            'surface' => $surface,
            'border' => $border,
        ];
    }
};
