<?php

declare(strict_types=1);

use App\Biolinks\Models\Biolink;
use App\Biolinks\Models\BiolinkTheme;
use App\Biolinks\Support\BiolinkAppearanceConfig;
use App\Biolinks\Support\BiolinkWidgetConfig;
use App\Folders\Models\Folder;
use App\Links\Models\Link;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

require dirname(__DIR__).'/vendor/autoload.php';

$app = require dirname(__DIR__).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$apply = in_array('--apply', $argv, true);
$email = 'adrianowebm@gmail.com';
$cases = caseDefinitions();

$user = User::query()->where('email', $email)->first();
if (!$user) {
    throw new RuntimeException("Account not found: {$email}");
}

$workspace = $user->workspaces()->where('is_personal', true)->first()
    ?? $user->workspaces()->first();
if (!$workspace) {
    throw new RuntimeException("No workspace found for {$email}");
}

preflight($cases, $user, $workspace->id);

$existing = Biolink::query()
    ->where('user_id', $user->id)
    ->where('workspace_id', $workspace->id)
    ->whereIn('back_half', array_column($cases, 'back_half'))
    ->get(['id', 'name', 'back_half']);

if ($existing->count() === count($cases)) {
    printResult('already_created', $existing->map(fn (Biolink $biolink) => [
        'id' => $biolink->id,
        'name' => $biolink->name,
        'back_half' => $biolink->back_half,
        'url' => url($biolink->back_half),
    ])->values()->all());
    exit(0);
}

if (!$apply) {
    printResult('dry_run', array_map(fn (array $case) => [
        'name' => $case['name'],
        'back_half' => $case['back_half'],
        'theme' => $case['theme'],
        'widgets' => array_column($case['widgets'], 'type'),
    ], $cases));
    exit(0);
}

$created = DB::transaction(function () use ($cases, $user, $workspace): array {
    $widgetConfig = app(BiolinkWidgetConfig::class);
    $appearanceConfig = app(BiolinkAppearanceConfig::class);
    $result = [];

    foreach ($cases as $case) {
        $theme = BiolinkTheme::query()
            ->where('slug', $case['theme'])
            ->where('is_published', true)
            ->firstOrFail();

        $biolink = Biolink::query()->create([
            'name' => $case['name'],
            'back_half' => $case['back_half'],
            'user_id' => $user->id,
            'workspace_id' => $workspace->id,
            'domain_id' => null,
            'clicks_count' => 0,
        ]);

        $widgetIds = [];
        $widgetTitles = [];
        foreach ($case['widgets'] as $position => $definition) {
            $config = $widgetConfig->normalizeConfig(
                $definition['type'],
                $definition['config'],
            );
            $items = $widgetConfig->normalizeItems(
                $definition['type'],
                $definition['items'],
            );

            $widget = $biolink->widgets()->create([
                'type' => $definition['type'],
                'position' => $position,
                'active' => true,
                'config' => $config,
            ]);

            $widgetIds[$definition['key']] = $widget->id;
            $widgetTitles[$definition['key']] = $config['title'] ?? $definition['key'];

            foreach ($items ?? [] as $item) {
                $widget->items()->create([
                    ...Arr::only($item, [
                        'type',
                        'active',
                        'sort_order',
                        'title',
                        'description',
                        'url',
                        'image',
                        'price',
                        'currency',
                        'payload',
                    ]),
                    'biolink_id' => $biolink->id,
                ]);
            }
        }

        $appearance = buildAppearance(
            $case,
            $theme->config,
            $widgetIds,
            $widgetTitles,
        );
        $appearanceErrors = $appearanceConfig->validate($appearance);
        if ($appearanceErrors !== []) {
            throw new RuntimeException(
                "Invalid appearance for {$case['name']}: ".json_encode(
                    $appearanceErrors,
                    JSON_UNESCAPED_UNICODE,
                ),
            );
        }

        $biolink->appearance()->create([
            'config' => $appearanceConfig->normalize($appearance),
        ]);

        $result[] = [
            'id' => $biolink->id,
            'name' => $biolink->name,
            'back_half' => $biolink->back_half,
            'url' => url($biolink->back_half),
            'widgets' => count($case['widgets']),
        ];
    }

    return $result;
});

printResult('created', $created);

/**
 * @param array<int, array<string, mixed>> $cases
 */
function preflight(array $cases, User $user, int $workspaceId): void
{
    $aliases = array_column($cases, 'back_half');
    $names = array_column($cases, 'name');

    if (count($aliases) !== count(array_unique($aliases))) {
        throw new RuntimeException('Case aliases must be unique.');
    }
    if (count($names) !== count(array_unique($names))) {
        throw new RuntimeException('Case names must be unique.');
    }

    foreach ($aliases as $alias) {
        if (strlen($alias) < 5 || strlen($alias) > 10) {
            throw new RuntimeException("Alias must have 5 to 10 characters: {$alias}");
        }
        if (!preg_match('/^[a-z0-9-]+$/', $alias)) {
            throw new RuntimeException("Alias must be alpha-dash: {$alias}");
        }
    }

    $foreignConflicts = [
        'links' => Link::query()->whereIn('back_half', $aliases)->pluck('back_half')->all(),
        'folders' => Folder::query()->whereIn('back_half', $aliases)->pluck('back_half')->all(),
    ];
    if ($foreignConflicts['links'] !== [] || $foreignConflicts['folders'] !== []) {
        throw new RuntimeException(
            'Aliases conflict with other resources: '.json_encode($foreignConflicts),
        );
    }

    $biolinkConflicts = Biolink::withTrashed()
        ->whereIn('back_half', $aliases)
        ->get(['id', 'name', 'back_half', 'user_id', 'workspace_id', 'deleted_at']);
    foreach ($biolinkConflicts as $conflict) {
        $expected = collect($cases)->firstWhere('back_half', $conflict->back_half);
        $isExactOwnedCase = $expected
            && $conflict->user_id === $user->id
            && $conflict->workspace_id === $workspaceId
            && $conflict->name === $expected['name']
            && $conflict->deleted_at === null;
        if (!$isExactOwnedCase) {
            throw new RuntimeException(
                "Biolink alias conflict: {$conflict->back_half}",
            );
        }
    }

    $nameConflicts = Biolink::withTrashed()
        ->where('workspace_id', $workspaceId)
        ->whereIn('name', $names)
        ->get(['name', 'back_half']);
    foreach ($nameConflicts as $conflict) {
        $expected = collect($cases)->firstWhere('name', $conflict->name);
        if (!$expected || $expected['back_half'] !== $conflict->back_half) {
            throw new RuntimeException("Biolink name conflict: {$conflict->name}");
        }
    }

    $widgetConfig = app(BiolinkWidgetConfig::class);
    $appearanceConfig = app(BiolinkAppearanceConfig::class);
    foreach ($cases as $case) {
        $theme = BiolinkTheme::query()
            ->where('slug', $case['theme'])
            ->where('is_published', true)
            ->first();
        if (!$theme) {
            throw new RuntimeException("Published theme not found: {$case['theme']}");
        }

        foreach ($case['widgets'] as $definition) {
            $errors = $widgetConfig->validate(
                $definition['type'],
                $definition['config'],
                $definition['items'],
            );
            if ($errors !== []) {
                throw new RuntimeException(
                    "Invalid widget {$definition['key']} for {$case['name']}: ".json_encode(
                        $errors,
                        JSON_UNESCAPED_UNICODE,
                    ),
                );
            }
        }

        $fakeIds = [];
        $titles = [];
        foreach ($case['widgets'] as $index => $definition) {
            $fakeIds[$definition['key']] = $index + 1;
            $titles[$definition['key']] = $definition['config']['title'] ?? $definition['key'];
        }
        $appearance = buildAppearance(
            $case,
            $theme->config,
            $fakeIds,
            $titles,
        );
        $errors = $appearanceConfig->validate($appearance);
        if ($errors !== []) {
            throw new RuntimeException(
                "Invalid appearance for {$case['name']}: ".json_encode(
                    $errors,
                    JSON_UNESCAPED_UNICODE,
                ),
            );
        }
    }
}

/**
 * @param array<string, mixed> $case
 * @param array<string, mixed> $base
 * @param array<string, int> $widgetIds
 * @param array<string, string> $widgetTitles
 * @return array<string, mixed>
 */
function buildAppearance(
    array $case,
    array $base,
    array $widgetIds,
    array $widgetTitles,
): array {
    $palette = $case['palette'];
    $appearance = $base;

    $appearance['theme'] = [
        'slug' => $case['theme'],
        'category' => 'curated',
        'locked' => false,
        'modified' => true,
    ];
    $appearance['bgConfig'] = array_replace(
        $appearance['bgConfig'] ?? [],
        [
            'activeType' => 'gradient',
            'backgroundColor' => $palette['background'],
            'backgroundImage' => sprintf(
                'linear-gradient(155deg, %s 0%%, %s 58%%, %s 100%%)',
                $palette['surface'],
                $palette['background'],
                $palette['backgroundDeep'],
            ),
            'color' => $palette['text'],
        ],
    );
    $appearance['btnConfig'] = array_replace(
        $appearance['btnConfig'] ?? [],
        [
            'color' => $palette['accent'],
            'textColor' => $palette['accentText'],
            'borderColor' => $palette['border'],
        ],
    );
    $appearance['boxConfig'] = array_replace(
        $appearance['boxConfig'] ?? [],
        [
            'color' => $palette['surface'],
            'textColor' => $palette['text'],
            'borderColor' => $palette['border'],
        ],
    );
    $appearance['cardConfig'] = array_replace(
        $appearance['cardConfig'] ?? [],
        [
            'backgroundColor' => $palette['surface'],
            'textColor' => $palette['text'],
            'borderColor' => $palette['border'],
            'shadowColor' => $palette['shadow'],
        ],
    );
    $appearance['headerConfig'] = array_replace(
        $appearance['headerConfig'] ?? [],
        [
            'layout' => $case['headerLayout'],
            'alignment' => 'center',
            'title' => $case['title'],
            'bio' => $case['bio'],
            'image' => $case['hero'],
            'titleStyle' => 'text',
            'titleColor' => $palette['text'],
            'avatarBorderColor' => $palette['accent'],
            'bannerBackgroundType' => 'image',
            'bannerImage' => $case['hero'],
            'bannerGradientFrom' => $palette['surface'],
            'bannerGradientTo' => $palette['background'],
            'showShareButton' => true,
            'showNavigation' => true,
        ],
    );
    if ($case['headerLayout'] === 'shape') {
        $appearance['headerConfig']['shapeVariant'] = $case['shapeVariant'] ?? 'flower';
        $appearance['headerConfig']['shapeColor'] = $palette['border'];
    }

    $appearance['socialConfig'] = array_replace(
        $appearance['socialConfig'] ?? [],
        [
            'enabled' => true,
            'mobilePlacement' => 'header',
            'desktopPlacement' => 'badge',
            'style' => 'icons',
            'colorMode' => $case['socialColorMode'] ?? 'brand',
            'links' => $case['socials'],
        ],
    );
    $appearance['effectsConfig'] = array_replace(
        $appearance['effectsConfig'] ?? [],
        [
            'respectReducedMotion' => true,
            'effectColor' => $palette['accent'],
            'effectSecondaryColor' => $palette['border'],
        ],
    );

    $navKeys = array_values(array_map(
        fn (array $widget) => $widget['key'],
        array_filter($case['widgets'], fn (array $widget) => $widget['nav']),
    ));
    $appearance['headerConfig']['navigationWidgetIds'] = array_values(
        array_map(fn (string $key) => $widgetIds[$key], $navKeys),
    );
    $appearance['headerConfig']['showNavigation'] = $navKeys !== [];

    $footerLinks = [];
    foreach (array_slice($navKeys, 0, 3) as $position => $key) {
        $footerLinks[] = [
            'id' => "case-{$key}",
            'label' => $widgetTitles[$key],
            'source' => 'widget',
            'widgetId' => $widgetIds[$key],
            'variant' => $position === min(2, count($navKeys) - 1) ? 'cta' : 'link',
            'active' => true,
            'position' => $position,
        ];
    }
    $appearance['footerConfig'] = array_replace(
        $appearance['footerConfig'] ?? [],
        [
            'version' => 1,
            'enabled' => true,
            'preset' => $case['footerPreset'],
            'brandSource' => 'avatar',
            'blocks' => [
                'brand' => true,
                'navigation' => true,
                'socials' => true,
                'cta' => true,
                'backToTop' => true,
            ],
            'showPlatformLinks' => true,
            'links' => $footerLinks,
        ],
    );

    return $appearance;
}

/**
 * @return array<int, array<string, mixed>>
 */
function caseDefinitions(): array
{
    $hairOne = unsplash('1750263147685-1bee1cdb8c44');
    $hairTwo = unsplash('1634449571010-02389ed0f9b0');
    $barber = unsplash('1653875700322-cf550d9a52ff');
    $skin = unsplash('1552693673-1bf958298935');
    $dentist = unsplash('1758653500342-5476c8ec3da6');
    $gameOne = unsplash('1542751371-adc38448a05e');
    $gameTwo = unsplash('1593305841991-05c297ba4575');
    $gameThree = unsplash('1626218174358-7769486c4b79');
    $motorcycleOne = unsplash('1558980394-da1f85d3b540');
    $motorcycleTwo = unsplash('1568772585407-9361f9bf3a87');
    $burger = unsplash('1568901346375-23c9450c58cd');
    $fitness = unsplash('1534438327276-14e5300c3a48');
    $tattooOne = unsplash('1769605767681-749db570b426');
    $tattooTwo = unsplash('1775565845581-3a8fc841da66');
    $photoOne = unsplash('1495745966610-2a67f2297e5e');
    $photoTwo = unsplash('1497316730643-415fac54a2af');
    $anime = '/images/biolink-case-library/nekoverse-hero.png';

    return [
        businessCase(
            name: 'Ateliê dos Fios — Cabeleireiro',
            backHalf: 'ateliefios',
            title: 'Ateliê dos Fios',
            bio: 'Cortes, cor e cuidado capilar em um espaço acolhedor. Modelo demonstrativo.',
            theme: 'model-salao-beleza',
            headerLayout: 'hero',
            hero: $hairOne,
            palette: palette('#f8f1ec', '#f1e2d9', '#2f211d', '#a9543f', '#ffffff', '#fffaf7', '#dbb8ab'),
            offeringTitle: 'Transformações em destaque',
            offerings: [
                item('Corte com identidade', 'Consultoria de estilo e finalização.', 'https://example.com/agendar', $hairOne),
                item('Cor e mechas', 'Planejamento de cor com teste de mecha.', 'https://example.com/agendar', $hairTwo),
                item('Tratamento e escova', 'Cuidado, brilho e finalização.', 'https://example.com/agendar', $hairOne),
            ],
            gallery: [
                item('Corte e movimento', image: $hairOne),
                item('Cor personalizada', image: $hairTwo),
                item('Finalização', image: $hairOne),
            ],
            highlights: [
                item('Diagnóstico antes do serviço'),
                item('Rotina de cuidados explicada'),
                item('Resultado pensado para o dia a dia'),
            ],
            ctaTitle: 'Pronta para renovar o visual?',
            ctaDescription: 'Troque este link pelo seu sistema de agenda ou WhatsApp.',
        ),
        businessCase(
            name: 'Forge Navalha — Barbearia',
            backHalf: 'forgebarb',
            title: 'Forge Navalha',
            bio: 'Corte, barba e presença. Uma barbearia de demonstração pronta para personalizar.',
            theme: 'model-barbearia-premium',
            headerLayout: 'hero',
            hero: $barber,
            palette: palette('#0b0b09', '#050504', '#fff6df', '#d3a349', '#11100d', '#181713', '#5a4828'),
            offeringTitle: 'Serviços da casa',
            offerings: [
                item('Corte masculino', 'Do clássico ao contemporâneo.', 'https://example.com/agendar', $barber),
                item('Barba completa', 'Desenho, toalha quente e acabamento.', 'https://example.com/agendar', $barber),
                item('Combo corte + barba', 'Experiência completa em uma visita.', 'https://example.com/agendar', $barber),
            ],
            gallery: [
                item('Precisão no corte', image: $barber),
                item('Acabamento de barba', image: $barber),
                item('Ambiente Forge', image: $barber),
            ],
            highlights: [
                item('Atendimento com hora marcada'),
                item('Técnica e acabamento'),
                item('Produtos selecionados'),
            ],
            ctaTitle: 'Seu próximo corte começa aqui',
            ctaDescription: 'Use esta chamada para levar direto ao agendamento.',
            socialColorMode: 'monochrome',
        ),
        businessCase(
            name: 'Aurora Beauty — Salão de Beleza',
            backHalf: 'aurorabeau',
            title: 'Aurora Beauty',
            bio: 'Cabelo, unhas e maquiagem reunidos em uma experiência leve. Modelo demonstrativo.',
            theme: 'model-salao-beleza',
            headerLayout: 'shape',
            hero: $hairTwo,
            palette: palette('#fff7fa', '#fce8f0', '#42202f', '#d84878', '#ffffff', '#fffdfd', '#e9bdcd'),
            offeringTitle: 'Beleza em cada detalhe',
            offerings: [
                item('Mechas e iluminação', 'Planejamento personalizado de tom.', 'https://example.com/agendar', $hairTwo),
                item('Penteados', 'Produções para eventos e ocasiões especiais.', 'https://example.com/agendar', $hairOne),
                item('Manicure e cuidado', 'Serviço demonstrativo para completar o menu.', 'https://example.com/agendar', $hairTwo),
            ],
            gallery: [
                item('Iluminação', image: $hairTwo),
                item('Penteado', image: $hairOne),
                item('Finalização', image: $hairTwo),
            ],
            highlights: [
                item('Equipe multidisciplinar'),
                item('Consulta antes do procedimento'),
                item('Ambiente preparado para receber'),
            ],
            ctaTitle: 'Reserve seu momento Aurora',
            ctaDescription: 'Substitua pelo link real da agenda do salão.',
        ),
        businessCase(
            name: 'Essenza — Estética e Bem-estar',
            backHalf: 'essenzaspa',
            title: 'Essenza Estética',
            bio: 'Protocolos faciais e corporais apresentados com clareza e cuidado. Modelo demonstrativo.',
            theme: 'model-salao-beleza',
            headerLayout: 'shape',
            hero: $skin,
            palette: palette('#f1f6f2', '#e4eee6', '#22372b', '#5f8f73', '#ffffff', '#fbfdfb', '#b8d0be'),
            offeringTitle: 'Protocolos de cuidado',
            offerings: [
                item('Limpeza de pele', 'Avaliação e protocolo personalizado.', 'https://example.com/agendar', $skin),
                item('Hidratação facial', 'Cuidado demonstrativo para diferentes rotinas.', 'https://example.com/agendar', $skin),
                item('Massagem relaxante', 'Uma pausa planejada para o bem-estar.', 'https://example.com/agendar', $skin),
            ],
            gallery: [
                item('Cuidado facial', image: $skin),
                item('Ambiente de atendimento', image: $skin),
                item('Rotina de autocuidado', image: $skin),
            ],
            highlights: [
                item('Avaliação individual'),
                item('Orientação pós-atendimento'),
                item('Protocolos explicados sem promessas irreais'),
            ],
            ctaTitle: 'Agende sua avaliação',
            ctaDescription: 'Use este espaço para explicar o primeiro passo do atendimento.',
            extras: [
                faqWidget('Dúvidas antes de agendar', [
                    item('Como escolher o procedimento?', 'Comece por uma avaliação profissional.'),
                    item('O que levar no dia?', 'Inclua aqui as orientações reais do seu espaço.'),
                ]),
            ],
        ),
        businessCase(
            name: 'Sorriso Zen — Dentista',
            backHalf: 'sorrisozen',
            title: 'Sorriso Zen',
            bio: 'Odontologia acolhedora com informações simples para o paciente. Modelo demonstrativo.',
            theme: 'model-criadora-comunidade',
            headerLayout: 'banner',
            hero: $dentist,
            palette: palette('#effafa', '#dff2f2', '#17353b', '#168a8f', '#ffffff', '#ffffff', '#a9d9d9'),
            offeringTitle: 'Cuidados odontológicos',
            offerings: [
                item('Avaliação inicial', 'Primeiro passo para entender sua necessidade.', 'https://example.com/agendar', $dentist),
                item('Prevenção e limpeza', 'Acompanhamento e orientação de higiene.', 'https://example.com/agendar', $dentist),
                item('Estética do sorriso', 'Converse com o profissional sobre possibilidades.', 'https://example.com/agendar', $dentist),
            ],
            gallery: [
                item('Atendimento acolhedor', image: $dentist),
                item('Cuidado preventivo', image: $dentist),
                item('Clínica demonstrativa', image: $dentist),
            ],
            highlights: [
                item('Plano de cuidado explicado'),
                item('Espaço para orientações do paciente'),
                item('Contato fácil com a clínica'),
            ],
            ctaTitle: 'Vamos cuidar do seu sorriso?',
            ctaDescription: 'Direcione para a agenda real da clínica.',
            extras: [
                faqWidget('Perguntas frequentes', [
                    item('Como funciona a primeira consulta?', 'Use esta resposta para explicar avaliação, documentos e duração.'),
                    item('Atende convênio?', 'Informe aqui os convênios ou a política de reembolso.'),
                    item('Há atendimento de urgência?', 'Substitua pela orientação real da clínica.'),
                ]),
            ],
        ),
        animeCase($anime),
        gamingCase($gameOne, $gameTwo, $gameThree),
        motorcycleCase($motorcycleOne, $motorcycleTwo),
        businessCase(
            name: 'Brasa Burger — Hamburgueria',
            backHalf: 'brasaburg',
            title: 'Brasa Burger',
            bio: 'Smash, combos e pedidos rápidos em uma página direta. Modelo demonstrativo.',
            theme: 'model-restaurante-delivery',
            headerLayout: 'cutout',
            hero: $burger,
            palette: palette('#100b08', '#080503', '#fff5e7', '#f5a524', '#21140d', '#20140d', '#654128'),
            offeringTitle: 'Destaques do cardápio',
            offerings: [
                item('Brasa Classic', 'Smash, queijo e molho da casa. Item demonstrativo.', 'https://example.com/cardapio', $burger),
                item('Brasa Bacon', 'Bacon, queijo e cebola. Item demonstrativo.', 'https://example.com/cardapio', $burger),
                item('Combo da casa', 'Burger, acompanhamento e bebida. Item demonstrativo.', 'https://example.com/cardapio', $burger),
            ],
            gallery: [
                item('Brasa Classic', image: $burger),
                item('Combo demonstrativo', image: $burger),
                item('Pedido pronto', image: $burger),
            ],
            highlights: [
                item('Pedido por delivery'),
                item('Retirada no balcão'),
                item('Cardápio fácil de atualizar'),
            ],
            ctaTitle: 'Bateu a fome?',
            ctaDescription: 'Troque pelo link do seu delivery ou cardápio digital.',
            offeringType: 'linkedProduct',
            footerPreset: 'commercial',
            extras: [
                widget('pagamentos', 'logoCloud', 'Formas de pagamento', [
                    'layout' => 'strip',
                ], [
                    item('Crédito'),
                    item('Débito'),
                    item('Pix'),
                ]),
            ],
        ),
        businessCase(
            name: 'Impulso Fit — Personal Trainer',
            backHalf: 'fitimpulso',
            title: 'Impulso Fit',
            bio: 'Treino orientado, acompanhamento e uma rota clara para começar. Modelo demonstrativo.',
            theme: 'model-aventura-conteudo',
            headerLayout: 'hero',
            hero: $fitness,
            palette: palette('#0d1410', '#07100b', '#efffe9', '#9be564', '#102014', '#152219', '#42633a'),
            offeringTitle: 'Como posso ajudar',
            offerings: [
                item('Treino personalizado', 'Plano demonstrativo adaptado à sua rotina.', 'https://example.com/avaliacao', $fitness),
                item('Consultoria online', 'Acompanhamento remoto com revisões combinadas.', 'https://example.com/avaliacao', $fitness),
                item('Treino em dupla', 'Uma opção para compartilhar a jornada.', 'https://example.com/avaliacao', $fitness),
            ],
            gallery: [
                item('Treino orientado', image: $fitness),
                item('Acompanhamento', image: $fitness),
                item('Consistência', image: $fitness),
            ],
            highlights: [
                item('Avaliação antes do plano'),
                item('Metas revisadas em conjunto'),
                item('Orientações dentro do escopo profissional'),
            ],
            ctaTitle: 'Comece pela avaliação',
            ctaDescription: 'Substitua pelo formulário ou agenda do profissional.',
            extras: [
                widget('indicadores', 'stats', 'Indicadores que você pode mostrar', [
                    'layout' => 'grid',
                ], [
                    item('Alunos acompanhados', 'Insira apenas o número real.'),
                    item('Modalidades', 'Liste as modalidades reais.'),
                    item('Agenda disponível', 'Atualize com a disponibilidade real.'),
                ]),
            ],
            socialColorMode: 'monochrome',
        ),
        businessCase(
            name: 'Black Ink — Estúdio de Tatuagem',
            backHalf: 'blackink',
            title: 'Black Ink Studio',
            bio: 'Portfólio, orçamento e cuidados reunidos em um só lugar. Modelo demonstrativo.',
            theme: 'model-barbearia-premium',
            headerLayout: 'hero',
            hero: $tattooOne,
            palette: palette('#0d0c0c', '#050505', '#f7f1eb', '#c64b42', '#130d0c', '#1a1716', '#69352f'),
            offeringTitle: 'Estilos e sessões',
            offerings: [
                item('Fine line', 'Apresente aqui o estilo e o processo do artista.', 'https://example.com/orcamento', $tattooTwo),
                item('Blackwork', 'Inclua referências autorais do portfólio.', 'https://example.com/orcamento', $tattooOne),
                item('Projeto personalizado', 'Explique briefing, sinal e aprovação.', 'https://example.com/orcamento', $tattooTwo),
            ],
            gallery: [
                item('Artista em sessão', image: $tattooOne),
                item('Processo criativo', image: $tattooTwo),
                item('Estúdio demonstrativo', image: $tattooOne),
            ],
            highlights: [
                item('Briefing antes do desenho'),
                item('Orientações de cicatrização'),
                item('Portfólio organizado por estilo'),
            ],
            ctaTitle: 'Conte sua ideia',
            ctaDescription: 'Leve a pessoa para o briefing ou orçamento.',
            extras: [
                faqWidget('Antes da sessão', [
                    item('Como pedir um orçamento?', 'Explique tamanho, local do corpo e referências.'),
                    item('Como preparar a pele?', 'Substitua pelas orientações reais do estúdio.'),
                ]),
            ],
            socialColorMode: 'monochrome',
        ),
        businessCase(
            name: 'Luz & Lente — Fotógrafo',
            backHalf: 'luzelente',
            title: 'Luz & Lente',
            bio: 'Portfólio, pacotes e orçamento com o trabalho visual em primeiro plano. Modelo demonstrativo.',
            theme: 'model-criadora-comunidade',
            headerLayout: 'hero',
            hero: $photoOne,
            palette: palette('#f4f1eb', '#e9e4dc', '#1e1d1a', '#2f5b56', '#ffffff', '#fbfaf7', '#b9b4aa'),
            offeringTitle: 'Ensaios e projetos',
            offerings: [
                item('Ensaio individual', 'Apresente duração, entrega e formato.', 'https://example.com/orcamento', $photoOne),
                item('Eventos', 'Explique cobertura e disponibilidade.', 'https://example.com/orcamento', $photoTwo),
                item('Conteúdo para marcas', 'Mostre o processo de briefing e produção.', 'https://example.com/orcamento', $photoOne),
            ],
            gallery: [
                item('Retratos', image: $photoOne),
                item('Bastidores', image: $photoTwo),
                item('Projetos autorais', image: $photoOne),
            ],
            highlights: [
                item('Direção durante o ensaio'),
                item('Curadoria e edição'),
                item('Entrega combinada em contrato'),
            ],
            ctaTitle: 'Vamos fotografar sua história?',
            ctaDescription: 'Troque este link pelo formulário real de orçamento.',
        ),
    ];
}

/**
 * @param array<int, array<string, mixed>> $offerings
 * @param array<int, array<string, mixed>> $gallery
 * @param array<int, array<string, mixed>> $highlights
 * @param array<int, array<string, mixed>> $extras
 * @return array<string, mixed>
 */
function businessCase(
    string $name,
    string $backHalf,
    string $title,
    string $bio,
    string $theme,
    string $headerLayout,
    string $hero,
    array $palette,
    string $offeringTitle,
    array $offerings,
    array $gallery,
    array $highlights,
    string $ctaTitle,
    string $ctaDescription,
    string $offeringType = 'service',
    string $footerPreset = 'commercial',
    array $extras = [],
    string $socialColorMode = 'brand',
): array {
    $widgets = [
        widget('atalhos', 'linkCollection', 'Links rápidos', [
            'description' => 'Atualize estes destinos com os canais reais do negócio.',
            'layout' => 'line',
        ], [
            item('Agendar ou pedir orçamento', url: 'https://example.com/agendar'),
            item('Falar pelo WhatsApp', url: 'https://example.com/whatsapp'),
            item('Ver serviços', url: 'https://example.com/servicos'),
            item('Como chegar', url: 'https://example.com/localizacao'),
        ], true),
        widget('ofertas', $offeringType, $offeringTitle, [
            'description' => 'Conteúdo e valores demonstrativos: revise antes de publicar.',
            'buttonLabel' => 'Saiba mais',
            'layout' => 'slide',
            'productStyle' => ['cardVariant' => 'media'],
        ], $offerings, true),
        ...$extras,
        widget('galeria', 'imageGallery', 'Portfólio visual', [
            'description' => 'Substitua pelas imagens reais do trabalho.',
            'layout' => 'grid',
            'aspectRatio' => 'portrait',
            'gridColumns' => 3,
            'imageZoom' => true,
        ], $gallery, true),
        widget('sobre', 'spotlight', 'Por que escolher este espaço', [
            'description' => 'Uma seção pronta para explicar diferenciais verdadeiros.',
            'image' => $hero,
            'imagePosition' => 'left',
            'buttonLabel' => 'Conheça mais',
            'url' => 'https://example.com/sobre',
        ], $highlights),
        widget('avaliacoes', 'reviews', 'O que clientes podem dizer', [
            'description' => 'Depoimentos abaixo são marcadores demonstrativos.',
            'layout' => 'slide',
        ], [
            item('Cliente demonstrativo', 'Substitua por uma avaliação real e autorizada.'),
            item('Cliente demonstrativo', 'Não publique depoimentos sem consentimento.'),
        ]),
        widget('contato', 'contactCard', 'Contato e horários', [
            'description' => 'Dados de exemplo para orientar o preenchimento.',
            'name' => $title,
            'occupation' => 'Atendimento demonstrativo',
            'email' => 'contato@example.com',
            'phone' => '(11) 00000-0000',
            'whatsapp' => '(11) 00000-0000',
            'address' => 'Rua Exemplo, 123 — São Paulo, SP',
            'hours' => 'Seg a sex, 9h às 18h (exemplo)',
            'url' => 'https://example.com/localizacao',
            'buttonLabel' => 'Ver localização',
            'presentation' => 'business',
        ]),
        widget('mensagem', 'contactForm', 'Peça informações', [
            'description' => 'Use o formulário para captar contatos no próprio biolink.',
            'buttonLabel' => 'Enviar mensagem',
            'successMessage' => 'Mensagem enviada. Em breve entraremos em contato.',
            'consentText' => 'Concordo com o envio dos meus dados para contato.',
            'requirePhone' => false,
            'contactMode' => 'email_or_phone',
        ]),
        widget('chamada', 'ctaBanner', $ctaTitle, [
            'description' => $ctaDescription,
            'buttonLabel' => 'Começar agora',
            'url' => 'https://example.com/agendar',
            'image' => $hero,
            'layout' => 'split',
            'backgroundColor' => $palette['accent'],
            'textColor' => $palette['accentText'],
        ]),
        demoNotice(),
    ];

    return [
        'name' => $name,
        'back_half' => $backHalf,
        'title' => $title,
        'bio' => $bio,
        'theme' => $theme,
        'headerLayout' => $headerLayout,
        'hero' => $hero,
        'palette' => $palette,
        'socials' => [
            'instagram' => 'https://instagram.com/',
            'whatsapp' => 'https://example.com/whatsapp',
            'facebook' => 'https://facebook.com/',
            'mail' => 'mailto:contato@example.com',
        ],
        'socialColorMode' => $socialColorMode,
        'footerPreset' => $footerPreset,
        'widgets' => $widgets,
    ];
}

/** @return array<string, mixed> */
function animeCase(string $hero): array
{
    return [
        'name' => 'NekoVerse — Anime e Arte',
        'back_half' => 'nekoverse',
        'title' => 'NekoVerse',
        'bio' => 'Arte autoral, encontros e uma comunidade para quem vive ilustração. Modelo demonstrativo.',
        'theme' => 'model-criadora-comunidade',
        'headerLayout' => 'hero',
        'hero' => $hero,
        'palette' => palette('#0a1024', '#050916', '#f4f2ff', '#ff5fa2', '#160f31', '#17112f', '#6543a0'),
        'socials' => [
            'instagram' => 'https://instagram.com/',
            'youtube' => 'https://youtube.com/',
            'tiktok' => 'https://tiktok.com/',
            'twitch' => 'https://twitch.tv/',
        ],
        'footerPreset' => 'community',
        'widgets' => [
            widget('atalhos', 'linkCollection', 'Entre no NekoVerse', [
                'description' => 'Canais demonstrativos para a comunidade.',
                'layout' => 'line',
            ], [
                item('Servidor da comunidade', url: 'https://discord.com/'),
                item('Portfólio de arte', url: 'https://example.com/portfolio'),
                item('Agenda de encontros', url: 'https://example.com/eventos'),
            ], true),
            widget('galeria', 'imageGallery', 'Universo visual', [
                'description' => 'A primeira arte é original; as demais são texturas locais do acervo.',
                'layout' => 'grid',
                'aspectRatio' => 'portrait',
                'gridColumns' => 3,
                'imageZoom' => true,
            ], [
                item('Cidade NekoVerse', image: $hero),
                item('Noite cromática', image: '/images/wallpapers/raycast/chromatic_dark_1.webp'),
                item('Moonrise', image: '/images/wallpapers/raycast/moonrise.webp'),
            ], true),
            widget('agenda', 'eventList', 'Próximos encontros', [
                'description' => 'Datas e links abaixo são demonstrativos.',
                'buttonLabel' => 'Ver evento',
                'layout' => 'card',
            ], [
                item('Sessão de desenho ao vivo', 'Data a confirmar — encontro demonstrativo.', 'https://example.com/evento'),
                item('Clube de animação', 'Encontro demonstrativo para discussão de processos criativos.', 'https://example.com/evento'),
                item('Desafio mensal de arte', 'Tema e regras devem ser substituídos.', 'https://example.com/desafio'),
            ], true),
            widget('enquete', 'poll', 'Escolha o próximo tema', [
                'description' => 'Uma enquete pronta para engajar a comunidade.',
                'question' => 'Qual tema você quer no próximo desafio?',
                'buttonLabel' => 'Votar',
                'successMessage' => 'Voto registrado.',
                'consentText' => 'Concordo com o registro desta resposta.',
                'showResults' => true,
            ], [
                item('Cidade chuvosa'),
                item('Criaturas do cerrado'),
                item('Moda futurista'),
            ]),
            widget('mural', 'socialFeed', 'Mural da comunidade', [
                'description' => 'Use imagens próprias e links reais ao publicar.',
                'layout' => 'grid',
            ], [
                item('Processo da arte principal', 'Post demonstrativo.', 'https://example.com/post', $hero, ['network' => 'instagram']),
                item('Bastidores da comunidade', 'Post demonstrativo.', 'https://example.com/post', '/images/wallpapers/raycast/moonrise.webp', ['network' => 'youtube']),
            ]),
            widget('newsletter', 'emailSignup', 'Receba os próximos temas', [
                'description' => 'Capte inscrições diretamente no biolink.',
                'buttonLabel' => 'Entrar na lista',
                'successMessage' => 'Inscrição confirmada.',
                'consentText' => 'Quero receber novidades desta comunidade.',
                'campaign' => 'nekoverse-demo',
                'presentation' => 'inline',
            ]),
            widget('chamada', 'ctaBanner', 'Crie, compartilhe, encontre sua turma', [
                'description' => 'Troque pelo convite real da comunidade.',
                'buttonLabel' => 'Entrar na comunidade',
                'url' => 'https://discord.com/',
                'image' => $hero,
                'layout' => 'background',
                'backgroundColor' => '#ff5fa2',
                'textColor' => '#160f31',
            ]),
            demoNotice('Arte principal original gerada para este modelo; não usa personagens licenciados.'),
        ],
    ];
}

/** @return array<string, mixed> */
function gamingCase(string $gameOne, string $gameTwo, string $gameThree): array
{
    return [
        'name' => 'Squad Base — Games e Discord',
        'back_half' => 'squadbase',
        'title' => 'Squad Base',
        'bio' => 'Servidor, partidas, eventos e perfis em uma central com energia de comunidade. Modelo demonstrativo.',
        'theme' => 'model-aventura-conteudo',
        'headerLayout' => 'hero',
        'hero' => $gameOne,
        'palette' => palette('#080b18', '#03050d', '#eef0ff', '#7c5cff', '#10162e', '#12172a', '#38418a'),
        'socials' => [
            'twitch' => 'https://twitch.tv/',
            'youtube' => 'https://youtube.com/',
            'tiktok' => 'https://tiktok.com/',
            'twitter' => 'https://x.com/',
        ],
        'footerPreset' => 'community',
        'widgets' => [
            widget('discord', 'discordPresence', 'Ao vivo no Discord', [
                'description' => 'O modo manual funciona sem ID real; conecte o Lanyard depois se desejar presença ao vivo.',
                'discordSource' => 'manual',
                'discordUsername' => 'SeuNick',
                'discordStatus' => 'online',
                'discordActivity' => 'Em call com a comunidade',
                'discordUrl' => 'https://discord.com/',
                'buttonLabel' => 'Entrar no servidor',
            ], nav: true),
            widget('perfil', 'gamingProfile', 'Perfil gamer', [
                'description' => 'Dados demonstrativos para personalizar no editor.',
                'gamingSource' => 'manual',
                'gamerTag' => 'SEU_NICK',
                'currentGame' => 'Atualize com seu jogo atual',
                'platform' => 'PC / Console',
                'rank' => 'Insira seu ranking real',
                'gamingUrl' => 'https://example.com/perfil',
                'buttonLabel' => 'Ver perfil',
            ], nav: true),
            widget('atalhos', 'linkCollection', 'Partiu jogar', [
                'layout' => 'line',
            ], [
                item('Regras do servidor', url: 'https://example.com/regras'),
                item('Agenda de campeonatos', url: 'https://example.com/eventos'),
                item('Clipes da comunidade', url: 'https://example.com/clipes'),
            ], true),
            widget('setup', 'imageGallery', 'Setup e comunidade', [
                'layout' => 'grid',
                'aspectRatio' => '16/9',
                'gridColumns' => 3,
                'imageZoom' => true,
            ], [
                item('Noite de partidas', image: $gameOne),
                item('Setup principal', image: $gameTwo),
                item('Estação da comunidade', image: $gameThree),
            ]),
            widget('eventos', 'eventList', 'Calendário da squad', [
                'description' => 'Eventos demonstrativos.',
                'buttonLabel' => 'Participar',
                'layout' => 'card',
            ], [
                item('Ranked Night', 'Sexta, 21h — horário demonstrativo.', 'https://example.com/evento'),
                item('Campeonato da comunidade', 'Data a confirmar.', 'https://example.com/evento'),
            ]),
            widget('enquete', 'poll', 'Qual será o próximo modo?', [
                'question' => 'O que a squad joga na próxima noite?',
                'buttonLabel' => 'Votar',
                'successMessage' => 'Voto registrado.',
                'consentText' => 'Concordo com o registro da resposta.',
                'showResults' => true,
            ], [
                item('Competitivo'),
                item('Cooperativo'),
                item('Party game'),
            ]),
            widget('chamada', 'ctaBanner', 'Sua squad já está online', [
                'description' => 'Troque pelo convite real do servidor.',
                'buttonLabel' => 'Entrar no Discord',
                'url' => 'https://discord.com/',
                'image' => $gameTwo,
                'layout' => 'background',
                'backgroundColor' => '#7c5cff',
                'textColor' => '#ffffff',
            ]),
            demoNotice(),
        ],
    ];
}

/** @return array<string, mixed> */
function motorcycleCase(string $motorcycleOne, string $motorcycleTwo): array
{
    return [
        'name' => 'Rota 77 — Motoqueiro',
        'back_half' => 'rota77',
        'title' => 'Rota 77',
        'bio' => 'Estradas, encontros e equipamentos para quem vive sobre duas rodas. Modelo demonstrativo.',
        'theme' => 'model-aventura-conteudo',
        'headerLayout' => 'hero',
        'hero' => $motorcycleOne,
        'palette' => palette('#0b1118', '#05080c', '#f4f7fa', '#ef7d32', '#121c25', '#15202a', '#5f402e'),
        'socials' => [
            'instagram' => 'https://instagram.com/',
            'youtube' => 'https://youtube.com/',
            'tiktok' => 'https://tiktok.com/',
            'whatsapp' => 'https://example.com/grupo',
        ],
        'socialColorMode' => 'monochrome',
        'footerPreset' => 'community',
        'widgets' => [
            widget('atalhos', 'linkCollection', 'Links de estrada', [
                'layout' => 'line',
            ], [
                item('Próximo rolê', url: 'https://example.com/role'),
                item('Grupo da comunidade', url: 'https://example.com/grupo'),
                item('Mapa e ponto de encontro', url: 'https://example.com/mapa'),
            ], true),
            widget('galeria', 'imageGallery', 'Diário de bordo', [
                'layout' => 'slide',
                'aspectRatio' => '16/9',
                'gridColumns' => 3,
                'imageZoom' => true,
            ], [
                item('Na estrada', image: $motorcycleOne),
                item('A máquina', image: $motorcycleTwo),
                item('Próxima rota', image: $motorcycleOne),
            ], true),
            widget('agenda', 'eventList', 'Próximas rotas', [
                'description' => 'Datas e percursos demonstrativos.',
                'buttonLabel' => 'Ver rota',
                'layout' => 'card',
            ], [
                item('Serra ao amanhecer', 'Data e quilometragem a confirmar.', 'https://example.com/rota'),
                item('Encontro de domingo', 'Ponto de encontro demonstrativo.', 'https://example.com/encontro'),
            ], true),
            widget('equipamentos', 'linkedProduct', 'Equipamentos que uso', [
                'description' => 'Links externos e recomendações demonstrativas.',
                'buttonLabel' => 'Ver item',
                'layout' => 'slide',
                'productStyle' => ['cardVariant' => 'media'],
            ], [
                item('Capacete de viagem', 'Substitua por um item real e revise o link.', 'https://example.com/equipamento', $motorcycleTwo),
                item('Jaqueta para estrada', 'Substitua por um item real e revise o link.', 'https://example.com/equipamento', $motorcycleOne),
            ]),
            widget('sobre', 'spotlight', 'Pilotar também é planejar', [
                'description' => 'Use esta área para reforçar segurança, manutenção e responsabilidade.',
                'image' => $motorcycleTwo,
                'imagePosition' => 'left',
            ], [
                item('Equipamento adequado'),
                item('Moto revisada'),
                item('Rota compartilhada'),
            ]),
            widget('chamada', 'ctaBanner', 'Nos vemos na próxima curva', [
                'description' => 'Troque pelo grupo ou formulário real do rolê.',
                'buttonLabel' => 'Entrar no grupo',
                'url' => 'https://example.com/grupo',
                'image' => $motorcycleOne,
                'layout' => 'background',
                'backgroundColor' => '#ef7d32',
                'textColor' => '#0b1118',
            ]),
            demoNotice(),
        ],
    ];
}

/**
 * @param array<int, array<string, mixed>> $items
 * @return array<string, mixed>
 */
function faqWidget(string $title, array $items): array
{
    return widget('duvidas', 'faq', $title, [
        'description' => 'Respostas demonstrativas para substituir pelas regras reais.',
    ], $items);
}

/** @return array<string, mixed> */
function demoNotice(string $extra = ''): array
{
    $description = 'Modelo demonstrativo: substitua nomes, contatos, links, horários, preços, imagens e depoimentos antes de publicar.';
    if ($extra !== '') {
        $description .= ' '.$extra;
    }

    return widget('aviso', 'text', 'Antes de publicar', [
        'description' => $description,
        'showBackground' => true,
    ]);
}

/**
 * @param array<int, array<string, mixed>>|null $items
 * @return array<string, mixed>
 */
function widget(
    string $key,
    string $type,
    string $title,
    array $config = [],
    array|null $items = null,
    bool $nav = false,
): array {
    return [
        'key' => $key,
        'type' => $type,
        'nav' => $nav,
        'config' => [
            'title' => $title,
            ...$config,
            'section' => [
                'presentation' => 'open',
                'anchorLabel' => $title,
            ],
            'blueprintKey' => "case-{$key}",
        ],
        'items' => $items,
    ];
}

/** @return array<string, mixed> */
function item(
    string $title,
    string|null $description = null,
    string|null $url = null,
    string|null $image = null,
    array|null $payload = null,
): array {
    return array_filter([
        'title' => $title,
        'description' => $description,
        'url' => $url,
        'image' => $image,
        'payload' => $payload,
        'active' => true,
    ], fn (mixed $value) => $value !== null);
}

/** @return array<string, string> */
function palette(
    string $background,
    string $backgroundDeep,
    string $text,
    string $accent,
    string $accentText,
    string $surface,
    string $border,
): array {
    return [
        'background' => $background,
        'backgroundDeep' => $backgroundDeep,
        'text' => $text,
        'accent' => $accent,
        'accentText' => $accentText,
        'surface' => $surface,
        'border' => $border,
        'shadow' => $border,
    ];
}

function unsplash(string $photoId): string
{
    return "https://images.unsplash.com/photo-{$photoId}?auto=format&fit=crop&w=1600&q=82";
}

/** @param array<int, array<string, mixed>> $pages */
function printResult(string $status, array $pages): void
{
    echo json_encode(
        [
            'status' => $status,
            'count' => count($pages),
            'pages' => $pages,
        ],
        JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
    ).PHP_EOL;
}
