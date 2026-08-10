<?php

declare(strict_types=1);

use App\Biolinks\Models\Biolink;
use App\Biolinks\Models\BiolinkTheme;
use App\Biolinks\Support\BiolinkAppearanceConfig;
use App\Biolinks\Support\BiolinkWidgetConfig;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require dirname(__DIR__) . '/vendor/autoload.php';

$app = require dirname(__DIR__) . '/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$execute = in_array('--execute', $argv, true);
$identifier = 'adrianowebm';

foreach ($argv as $argument) {
    if (str_starts_with($argument, '--user=')) {
        $identifier = trim(substr($argument, 7));
    }
}

if ($identifier === '') {
    throw new RuntimeException('Informe um identificador de usuário válido.');
}

$user = User::query()
    ->where('username', $identifier)
    ->orWhere('name', $identifier)
    ->orWhere('email', $identifier)
    ->orWhere('email', "$identifier@gmail.com")
    ->first();

if (!$user) {
    throw new RuntimeException("Usuário [$identifier] não encontrado.");
}

$workspace = DB::table('workspaces')
    ->where('owner_id', $user->id)
    ->where('is_personal', true)
    ->first();

if (!$workspace) {
    throw new RuntimeException(
        "Workspace pessoal do usuário [{$user->id}] não encontrado.",
    );
}

$appUrl = rtrim((string) config('app.url'), '/');
$assets = [
    '/storage/demo-products/mundo-3d/hero-mundo-3d.png',
    '/storage/demo-products/mundo-3d/porta-lata-azul.png',
    '/storage/demo-products/mundo-3d/porta-lata-verde.png',
    '/storage/demo-products/mundo-3d/porta-lata-rosa.png',
    '/storage/demo-products/mundo-3d/suporte-ps5-azul.png',
    '/storage/demo-products/mundo-3d/suporte-ps5-branco.png',
    '/storage/demo-products/mundo-3d/suporte-ps5-preto.png',
    '/storage/demo-products/mundo-3d/suporte-ps5-rosa.png',
    '/storage/demo-products/mundo-3d/suporte-ps5-roxo.png',
    '/storage/demo-products/mundo-3d/suporte-ps5-vermelho.png',
    '/storage/demo-products/nova-acessorios/brinco-orbita.png',
    '/storage/demo-products/nova-acessorios/bolsa-prisma-cereja.png',
    '/storage/demo-products/nova-acessorios/relogio-eclipse-verde.png',
    '/storage/demo-products/nova-acessorios/oculos-iris-plum.png',
];

foreach ($assets as $asset) {
    if (!is_file(public_path(ltrim($asset, '/')))) {
        throw new RuntimeException("Asset obrigatório não encontrado: $asset");
    }
}

$pages = [
    [
        'name' => 'Mundo 3D do Claudio — Loja Criativa',
        'back_half' => 'mundo3d',
        'theme_slug' => 'gamer-zone',
        'appearance' => [
            'headerConfig' => [
                'alignment' => 'center',
                'layout' => 'hero',
                'title' => 'Mundo 3D do Claudio',
                'bio' => 'Ideias criativas ganham forma, cor e personalidade em impressão 3D.',
                'image' => '/storage/demo-products/mundo-3d/porta-lata-azul.png',
                'avatarSize' => 112,
                'avatarRadius' => 22,
                'avatarBorderWidth' => 2,
                'avatarBorderColor' => '#00E676',
                'bannerBackgroundType' => 'image',
                'bannerImage' => '/storage/demo-products/mundo-3d/hero-mundo-3d.png',
                'titleColor' => '#00E676',
                'showShareButton' => true,
            ],
            'desktopConfig' => [
                'enabled' => true,
                'layoutMode' => 'full',
                'contentMode' => 'stack',
                'gridMode' => '1',
                'profilePlacement' => 'center',
                'surfaceMode' => 'open',
            ],
            'boxConfig' => [
                'variant' => 'outline',
                'color' => '#0D1524',
                'textColor' => '#ECFFF4',
                'borderColor' => '#00E676',
                'borderWidth' => 1,
                'cornerWidth' => 14,
                'shadow' => 'none',
            ],
            'cardConfig' => [
                'backgroundColor' => '#0D1524',
                'textColor' => '#ECFFF4',
                'borderColor' => '#00E676',
                'borderWidth' => 1,
                'shadow' => 'soft',
                'shadowColor' => '#00E676',
                'radius' => 14,
                'imageRadius' => 0,
                'imagePosition' => 'top',
                'imageSize' => 'large',
                'showImages' => true,
                'showImageFallback' => true,
                'pricePosition' => 'below',
                'actionStyle' => 'button',
                'cardVariant' => 'poster',
            ],
        ],
        'products' => [
            [
                'key' => 'porta-lata-azul',
                'name' => 'Porta-lata 3D Turbo Azul',
                'description' => 'Caneca porta-lata com alça firme, tampa e acabamento em azul e turquesa.',
                'image' => '/storage/demo-products/mundo-3d/porta-lata-azul.png',
                'price' => 39.90,
                'compare_price' => 49.90,
                'badge' => 'Mais pedido',
                'rating' => 4.9,
                'stock_label' => 'Produção sob encomenda',
            ],
            [
                'key' => 'porta-lata-verde',
                'name' => 'Porta-lata 3D Pulse Verde',
                'description' => 'Contraste preto e verde para manter a bebida firme e o setup com personalidade.',
                'image' => '/storage/demo-products/mundo-3d/porta-lata-verde.png',
                'price' => 39.90,
                'compare_price' => 49.90,
                'badge' => 'Novo',
                'rating' => 4.8,
                'stock_label' => 'Produção sob encomenda',
            ],
            [
                'key' => 'porta-lata-rosa',
                'name' => 'Porta-lata 3D Pop Rosa',
                'description' => 'Versão rosa e branca com presença divertida para mesa, festa ou presente.',
                'image' => '/storage/demo-products/mundo-3d/porta-lata-rosa.png',
                'price' => 39.90,
                'compare_price' => 49.90,
                'badge' => 'Presenteável',
                'rating' => 4.9,
                'stock_label' => 'Produção sob encomenda',
            ],
            [
                'key' => 'suporte-ps5-azul',
                'name' => 'Suporte para Controle PS5 — Azul',
                'description' => 'Base 3D estável com acabamento azul intenso para organizar o setup.',
                'image' => '/storage/demo-products/mundo-3d/suporte-ps5-azul.png',
                'price' => 59.90,
                'compare_price' => 69.90,
                'badge' => 'Setup gamer',
                'rating' => 4.9,
                'stock_label' => 'Disponível por encomenda',
            ],
            [
                'key' => 'suporte-ps5-branco',
                'name' => 'Suporte para Controle PS5 — Branco',
                'description' => 'Visual limpo para setups claros, com encaixe pensado para o controle.',
                'image' => '/storage/demo-products/mundo-3d/suporte-ps5-branco.png',
                'price' => 59.90,
                'compare_price' => 69.90,
                'badge' => 'Minimal',
                'rating' => 4.8,
                'stock_label' => 'Disponível por encomenda',
            ],
            [
                'key' => 'suporte-ps5-preto',
                'name' => 'Suporte para Controle PS5 — Preto',
                'description' => 'Base preta discreta e firme para deixar o controle sempre no lugar.',
                'image' => '/storage/demo-products/mundo-3d/suporte-ps5-preto.png',
                'price' => 59.90,
                'compare_price' => 69.90,
                'badge' => 'Clássico',
                'rating' => 4.9,
                'stock_label' => 'Disponível por encomenda',
            ],
            [
                'key' => 'suporte-ps5-rosa',
                'name' => 'Suporte para Controle PS5 — Rosa',
                'description' => 'Uma base vibrante para setups que usam cor como parte da identidade.',
                'image' => '/storage/demo-products/mundo-3d/suporte-ps5-rosa.png',
                'price' => 59.90,
                'compare_price' => 69.90,
                'badge' => 'Color edition',
                'rating' => 4.8,
                'stock_label' => 'Disponível por encomenda',
            ],
            [
                'key' => 'suporte-ps5-roxo',
                'name' => 'Suporte para Controle PS5 — Roxo',
                'description' => 'Roxo profundo para combinar com iluminação RGB e ambientes criativos.',
                'image' => '/storage/demo-products/mundo-3d/suporte-ps5-roxo.png',
                'price' => 59.90,
                'compare_price' => 69.90,
                'badge' => 'RGB mood',
                'rating' => 4.9,
                'stock_label' => 'Disponível por encomenda',
            ],
            [
                'key' => 'suporte-ps5-vermelho',
                'name' => 'Suporte para Controle PS5 — Vermelho',
                'description' => 'Acabamento vermelho marcante para destacar o controle na bancada.',
                'image' => '/storage/demo-products/mundo-3d/suporte-ps5-vermelho.png',
                'price' => 59.90,
                'compare_price' => 69.90,
                'badge' => 'Impacto',
                'rating' => 4.8,
                'stock_label' => 'Disponível por encomenda',
            ],
        ],
        'widgets' => [
            [
                'type' => 'image',
                'config' => [
                    'url' => '/storage/demo-products/mundo-3d/hero-mundo-3d.png',
                    'type' => 'content',
                    'blueprintKey' => 'demo-mundo3d-hero',
                ],
            ],
            [
                'type' => 'text',
                'config' => [
                    'title' => 'Feito em 3D, do seu jeito',
                    'description' => 'Escolha a peça e a cor. Esta é uma vitrine demonstrativa com valores e links ilustrativos.',
                    'variant' => 'heading',
                    'showBackground' => false,
                    'blueprintKey' => 'demo-mundo3d-intro',
                ],
            ],
            [
                'type' => 'linkedProduct',
                'products' => true,
                'config' => [
                    'title' => 'Destaques da impressão 3D',
                    'description' => 'Porta-latas e suportes em várias cores para mostrar todo o potencial do catálogo.',
                    'buttonLabel' => 'Ver detalhes',
                    'layout' => 'grid',
                    'source' => 'catalog',
                    'productStyle' => [
                        'cardVariant' => 'poster',
                        'imagePosition' => 'top',
                        'imageSize' => 'large',
                        'imageRadius' => 0,
                        'showImages' => true,
                        'showImageFallback' => true,
                        'showBackground' => true,
                        'cardBorderWidth' => 1,
                        'cardGlow' => true,
                        'pricePosition' => 'below',
                        'actionStyle' => 'button',
                    ],
                    'blueprintKey' => 'demo-mundo3d-products',
                ],
            ],
        ],
    ],
    [
        'name' => 'NOVA — Acessórios de Cor',
        'back_half' => 'nova-acessorios',
        'theme_slug' => 'noir-luxe',
        'appearance' => [
            'fontConfig' => [
                'family' => 'Manrope',
                'google' => true,
            ],
            'headerConfig' => [
                'alignment' => 'center',
                'layout' => 'hero',
                'title' => 'NOVA Acessórios',
                'bio' => 'Formas marcantes, cores inesperadas e uma curadoria que transforma o look.',
                'image' => '/storage/demo-products/nova-acessorios/brinco-orbita.png',
                'avatarSize' => 120,
                'avatarRadius' => 18,
                'avatarBorderWidth' => 1,
                'avatarBorderColor' => '#D7A846',
                'titleColor' => '#FFFFFF',
                'titleFontConfig' => [
                    'family' => 'Bodoni Moda',
                    'google' => true,
                ],
                'showShareButton' => true,
            ],
            'btnConfig' => [
                'actionBtnColor' => '#D7A846',
                'actionBtnTextColor' => '#111111',
            ],
            'desktopConfig' => [
                'enabled' => true,
                'layoutMode' => 'full',
                'contentMode' => 'stack',
                'gridMode' => '1',
                'profilePlacement' => 'center',
                'surfaceMode' => 'open',
            ],
            'boxConfig' => [
                'variant' => 'outline',
                'color' => '#111111',
                'textColor' => '#F8F2E8',
                'borderColor' => '#D7A846',
                'borderWidth' => 1,
                'cornerWidth' => 14,
                'shadow' => 'none',
            ],
            'cardConfig' => [
                'backgroundColor' => '#111111',
                'textColor' => '#F8F2E8',
                'borderColor' => '#D7A846',
                'borderWidth' => 1,
                'shadow' => 'soft',
                'shadowColor' => '#D7A846',
                'radius' => 14,
                'imageRadius' => 0,
                'imagePosition' => 'top',
                'imageSize' => 'large',
                'showImages' => true,
                'showImageFallback' => true,
                'pricePosition' => 'below',
                'actionStyle' => 'button',
                'cardVariant' => 'poster',
            ],
        ],
        'products' => [
            [
                'key' => 'brinco-orbita',
                'name' => 'Brinco Órbita Dourado',
                'description' => 'Aros esculturais em movimento para um ponto de luz marcante.',
                'image' => '/storage/demo-products/nova-acessorios/brinco-orbita.png',
                'price' => 89.90,
                'compare_price' => 119.90,
                'badge' => 'Destaque',
                'rating' => 4.9,
                'stock_label' => 'Peça demonstrativa',
            ],
            [
                'key' => 'bolsa-prisma-cereja',
                'name' => 'Bolsa Prisma Cereja',
                'description' => 'Mini bag estruturada em vermelho cereja com ferragens douradas.',
                'image' => '/storage/demo-products/nova-acessorios/bolsa-prisma-cereja.png',
                'price' => 229.90,
                'compare_price' => 279.90,
                'badge' => 'Nova coleção',
                'rating' => 4.8,
                'stock_label' => 'Peça demonstrativa',
            ],
            [
                'key' => 'relogio-eclipse-verde',
                'name' => 'Relógio Eclipse Verde',
                'description' => 'Mostrador verde profundo e pulseira dourada de linhas precisas.',
                'image' => '/storage/demo-products/nova-acessorios/relogio-eclipse-verde.png',
                'price' => 319.90,
                'compare_price' => 389.90,
                'badge' => 'Edição especial',
                'rating' => 4.9,
                'stock_label' => 'Peça demonstrativa',
            ],
            [
                'key' => 'oculos-iris-plum',
                'name' => 'Óculos Íris Plum',
                'description' => 'Armação geométrica em tom ameixa com lentes de presença suave.',
                'image' => '/storage/demo-products/nova-acessorios/oculos-iris-plum.png',
                'price' => 149.90,
                'compare_price' => 189.90,
                'badge' => 'Color statement',
                'rating' => 4.8,
                'stock_label' => 'Peça demonstrativa',
            ],
        ],
        'widgets' => [
            [
                'type' => 'text',
                'config' => [
                    'title' => 'A cor entra antes do acessório',
                    'description' => 'Uma vitrine demonstrativa de produtos, preços e links ilustrativos para destacar o módulo na home.',
                    'variant' => 'heading',
                    'showBackground' => false,
                    'blueprintKey' => 'demo-nova-intro',
                ],
            ],
            [
                'type' => 'linkedProduct',
                'products' => true,
                'config' => [
                    'title' => 'Escolhas da coleção',
                    'description' => 'Quatro acessórios autorais em uma composição de alto contraste.',
                    'buttonLabel' => 'Conhecer peça',
                    'layout' => 'grid',
                    'source' => 'catalog',
                    'productStyle' => [
                        'cardVariant' => 'poster',
                        'imagePosition' => 'top',
                        'imageSize' => 'large',
                        'imageRadius' => 0,
                        'showImages' => true,
                        'showImageFallback' => true,
                        'showBackground' => true,
                        'cardBorderWidth' => 1,
                        'pricePosition' => 'below',
                        'actionStyle' => 'button',
                    ],
                    'blueprintKey' => 'demo-nova-products',
                ],
            ],
        ],
    ],
];

$appearanceValidator = app(BiolinkAppearanceConfig::class);
$widgetValidator = app(BiolinkWidgetConfig::class);

foreach ($pages as &$page) {
    $theme = BiolinkTheme::query()
        ->where('is_published', true)
        ->where('slug', $page['theme_slug'])
        ->first();

    if (!$theme) {
        throw new RuntimeException(
            "Tema publicado [{$page['theme_slug']}] não encontrado.",
        );
    }

    $page['appearance'] = array_replace_recursive(
        $theme->config,
        $page['appearance'],
    );
    $appearanceErrors = $appearanceValidator->validate($page['appearance']);

    if ($appearanceErrors !== []) {
        throw new RuntimeException(
            "Aparência inválida para [{$page['name']}]: " .
                json_encode($appearanceErrors, JSON_UNESCAPED_UNICODE),
        );
    }

    $page['appearance'] = $appearanceValidator->normalize(
        $page['appearance'],
    );

    foreach ($page['widgets'] as $widget) {
        $errors = $widgetValidator->validate(
            $widget['type'],
            $widget['config'],
        );
        if ($errors !== []) {
            throw new RuntimeException(
                "Widget [{$widget['type']}] inválido em [{$page['name']}]: " .
                    json_encode($errors, JSON_UNESCAPED_UNICODE),
            );
        }
    }
}
unset($page);

echo sprintf(
    "%s usuário #%d (%s), workspace #%d.\n",
    $execute ? 'Criando para' : 'Prévia para',
    $user->id,
    $user->name ?: $user->email,
    $workspace->id,
);

foreach ($pages as $page) {
    $existing = Biolink::withoutGlobalScopes()
        ->where('back_half', $page['back_half'])
        ->first();
    $status = $existing
        ? "já existe como página #{$existing->id}"
        : 'será criada';
    echo "- {$page['name']} /{$page['back_half']}: $status; " .
        count($page['products']) . ' produtos; ' .
        count($page['widgets']) . " widgets.\n";
}

if (!$execute) {
    echo "Nenhuma alteração foi gravada. Use --execute para criar.\n";
    exit(0);
}

$created = [];

foreach ($pages as $page) {
    $created[] = DB::transaction(function () use (
        $page,
        $user,
        $workspace,
        $appUrl,
        $widgetValidator,
    ): array {
        $existing = Biolink::withoutGlobalScopes()
            ->where('back_half', $page['back_half'])
            ->first();

        if ($existing) {
            if ((int) $existing->user_id !== (int) $user->id) {
                throw new RuntimeException(
                    "O caminho /{$page['back_half']} pertence a outro usuário.",
                );
            }

            return [
                'id' => $existing->id,
                'name' => $existing->name,
                'back_half' => $existing->back_half,
                'created' => false,
            ];
        }

        $biolink = new Biolink();
        $biolink->forceFill([
            'name' => $page['name'],
            'back_half' => $page['back_half'],
            'user_id' => $user->id,
            'workspace_id' => $workspace->id,
        ]);
        $biolink->save();

        $biolink->appearance()->create([
            'config' => $page['appearance'],
        ]);

        $productIds = [];
        $pageUrl = "$appUrl/{$page['back_half']}";

        foreach ($page['products'] as $position => $productData) {
            $product = $biolink->products()->create([
                'legacy_key' => "demo-showcase-v1:{$productData['key']}",
                'name' => $productData['name'],
                'description' => $productData['description'],
                'image' => $productData['image'],
                'price' => $productData['price'],
                'compare_price' => $productData['compare_price'],
                'currency' => 'BRL',
                'badge' => $productData['badge'],
                'rating' => $productData['rating'],
                'stock_label' => $productData['stock_label'],
                'url' => "$pageUrl#catalogo",
                'active' => true,
                'position' => $position,
            ]);
            $productIds[] = $product->id;
        }

        foreach ($page['widgets'] as $position => $widgetData) {
            $config = $widgetData['config'];
            if ($widgetData['products'] ?? false) {
                $config['productIds'] = $productIds;
            }

            $errors = $widgetValidator->validate(
                $widgetData['type'],
                $config,
            );
            if ($errors !== []) {
                throw new RuntimeException(
                    "Widget [{$widgetData['type']}] inválido após vincular produtos: " .
                        json_encode($errors, JSON_UNESCAPED_UNICODE),
                );
            }

            $biolink->widgets()->create([
                'type' => $widgetData['type'],
                'active' => true,
                'position' => $position,
                'pinned' => null,
                'config' => $widgetValidator->normalizeConfig(
                    $widgetData['type'],
                    $config,
                ),
            ]);
        }

        return [
            'id' => $biolink->id,
            'name' => $biolink->name,
            'back_half' => $biolink->back_half,
            'created' => true,
        ];
    });
}

foreach ($created as $page) {
    $verb = $page['created'] ? 'Criada' : 'Mantida';
    echo "$verb página #{$page['id']}: {$page['name']} " .
        "$appUrl/{$page['back_half']}\n";
}
