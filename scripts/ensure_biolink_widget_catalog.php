<?php

declare(strict_types=1);

use App\Biolinks\Models\Biolink;
use App\Biolinks\Models\BiolinkProduct;
use App\Biolinks\Support\BiolinkWidgetConfig;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

require dirname(__DIR__).'/vendor/autoload.php';

$app = require dirname(__DIR__).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$apply = in_array('--apply', $argv, true);
$biolinkId = (int) argumentValue($argv, '--biolink', '2');
$expectedBackHalf = argumentValue($argv, '--back-half', 'liam-burge');

$biolink = Biolink::query()
    ->with(['user:id,email', 'widgets:id,biolink_id,type,position,active,config'])
    ->findOrFail($biolinkId);

if ($biolink->back_half !== $expectedBackHalf) {
    throw new RuntimeException(
        "Biolink {$biolinkId} has back_half '{$biolink->back_half}', expected '{$expectedBackHalf}'.",
    );
}

$widgetConfig = app(BiolinkWidgetConfig::class);
$definitions = widgetDefinitions();
$existingTypes = $biolink->widgets->pluck('type')->unique()->values();
$missingTypes = collect(BiolinkWidgetConfig::TYPES)
    ->reject(fn(string $type) => $existingTypes->contains($type))
    ->values();

foreach ($missingTypes as $type) {
    $definition = $definitions[$type] ?? null;
    if (!$definition) {
        throw new RuntimeException("Missing test definition for widget type: {$type}");
    }

    $errors = $widgetConfig->validate(
        $type,
        $definition['config'],
        $definition['items'],
    );
    if ($errors !== []) {
        throw new RuntimeException(
            "Invalid {$type} definition: ".json_encode(
                $errors,
                JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR,
            ),
        );
    }
}

if (!$apply || $missingTypes->isEmpty()) {
    printResult($apply ? 'already_complete' : 'dry_run', $biolink, [
        'existing_types' => $existingTypes->all(),
        'missing_types' => $missingTypes->all(),
        'total_catalog_types' => count(BiolinkWidgetConfig::TYPES),
    ]);
    exit(0);
}

$created = DB::transaction(function () use (
    $biolink,
    $definitions,
    $missingTypes,
    $widgetConfig,
): array {
    $linkPosition = (int) DB::table('biolink_link')
        ->where('biolink_id', $biolink->id)
        ->max('position');
    $widgetPosition = (int) $biolink->widgets()->max('position');
    $position = max($linkPosition, $widgetPosition) + 1;
    $productIds = $biolink->products()
        ->where('active', true)
        ->orderBy('position')
        ->limit(3)
        ->pluck('id')
        ->map(fn($id) => (int) $id)
        ->all();

    if (in_array('linkedProduct', $missingTypes->all(), true) && $productIds === []) {
        $product = BiolinkProduct::query()->create([
            'biolink_id' => $biolink->id,
            'legacy_key' => 'widget-catalog-demo-product',
            'name' => 'Produto demonstrativo',
            'description' => 'Item criado para validar o widget de produto neste biolink de teste.',
            'image' => '/images/others/charlota-blunarova-U7ud6KGrsRQ-unsplash.jpg',
            'price' => 49.90,
            'currency' => 'BRL',
            'url' => 'https://example.com/produto',
            'active' => true,
            'position' => 0,
        ]);
        $productIds = [(int) $product->id];
    }

    $created = [];
    foreach ($missingTypes as $type) {
        $definition = $definitions[$type];
        if ($type === 'linkedProduct') {
            $definition['config']['productIds'] = $productIds;
        }

        $config = $widgetConfig->normalizeConfig($type, $definition['config']);
        $items = $widgetConfig->normalizeItems($type, $definition['items']);

        $widget = $biolink->widgets()->create([
            'type' => $type,
            'position' => $position++,
            'active' => true,
            'config' => $config,
        ]);

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

        $created[] = ['id' => $widget->id, 'type' => $type];
    }

    return $created;
});

$biolink->unsetRelation('widgets');
$biolink->load('widgets:id,biolink_id,type,position,active,config');
printResult('applied', $biolink, [
    'created' => $created,
    'final_types' => $biolink->widgets->pluck('type')->unique()->values()->all(),
    'total_catalog_types' => count(BiolinkWidgetConfig::TYPES),
]);

/** @return array<string, array{config: array<string, mixed>, items: array<int, array<string, mixed>>|null}> */
function widgetDefinitions(): array
{
    $image = '/images/others/charlota-blunarova-U7ud6KGrsRQ-unsplash.jpg';
    $imageAlt = '/images/others/anthony-persegol-rDQLQg1L99A-unsplash.jpg';
    $base = [];

    foreach (BiolinkWidgetConfig::TYPES as $type) {
        $base[$type] = [
            'config' => [
                'section' => [
                    'presentation' => 'contained',
                    'anchorLabel' => testTitle($type),
                ],
                'blueprintKey' => 'widget-catalog-'.strtolower($type),
            ],
            'items' => null,
        ];
    }

    $configs = [
        'image' => ['url' => $image, 'destinationUrl' => 'https://example.com/imagem'],
        'text' => ['title' => 'Bloco de texto', 'description' => 'Conteúdo demonstrativo do catálogo de widgets.', 'showBackground' => true],
        'socials' => ['instagram' => 'https://instagram.com/', 'youtube' => 'https://youtube.com/'],
        'youtube' => ['url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'presentation' => 'cover', 'coverImage' => $image],
        'soundcloud' => ['url' => 'https://soundcloud.com/monstercat'],
        'vimeo' => ['url' => 'https://vimeo.com/76979871'],
        'spotify' => ['url' => 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT', 'spotifyPresentation' => 'embed'],
        'twitch' => ['url' => 'https://www.twitch.tv/twitch'],
        'tiktok' => ['url' => 'https://www.tiktok.com/@tiktok', 'presentation' => 'cover'],
        'contactForm' => captureConfig('Formulário de contato', 'Enviar mensagem'),
        'emailSignup' => captureConfig('Novidades por e-mail', 'Inscrever-se') + ['presentation' => 'action'],
        'eventRsvp' => captureConfig('Confirme sua presença', 'Responder') + ['allowWaitlist' => true],
        'linkedProduct' => ['title' => 'Produtos', 'layout' => 'grid', 'source' => 'catalog', 'productIds' => []],
        'linkedCourse' => ['title' => 'Cursos', 'description' => 'Conteúdos para aprender no seu ritmo.', 'buttonLabel' => 'Ver curso', 'layout' => 'grid'],
        'service' => ['title' => 'Serviços', 'description' => 'Escolha o atendimento ideal.', 'buttonLabel' => 'Saber mais', 'layout' => 'grid'],
        'booking' => ['title' => 'Agendamento', 'description' => 'Escolha um serviço e um horário.', 'serviceIds' => [], 'showServiceDetails' => true, 'layout' => 'classic'],
        'faq' => ['title' => 'Perguntas frequentes', 'description' => 'Respostas rápidas para dúvidas comuns.'],
        'linkCollection' => ['title' => 'Links úteis', 'description' => 'Acesse os principais destinos.', 'layout' => 'classic'],
        'embedCollection' => ['title' => 'Conteúdos incorporados', 'description' => 'Prévias de links externos.', 'layout' => 'grid', 'previewStyle' => 'compact'],
        'imageGallery' => ['title' => 'Galeria de imagens', 'description' => 'Portfólio visual demonstrativo.', 'layout' => 'grid', 'aspectRatio' => '4/3', 'gridColumns' => 3, 'imageZoom' => true],
        'qrCode' => ['title' => 'QR Code', 'description' => 'Escaneie para abrir o endereço.', 'value' => 'https://example.com/', 'label' => 'Abrir link', 'qrDisplay' => 'card'],
        'location' => ['title' => 'Localização', 'description' => 'Endereço demonstrativo.', 'address' => 'Avenida Paulista, 1000 — São Paulo, SP', 'url' => 'https://www.google.com/maps/search/?api=1&query=Avenida+Paulista+1000', 'buttonLabel' => 'Ver no mapa', 'mapDisplay' => 'button', 'mapProvider' => 'google'],
        'contactCard' => ['title' => 'Contato', 'description' => 'Fale com nossa equipe.', 'name' => 'Equipe demonstrativa', 'occupation' => 'Atendimento', 'email' => 'contato@example.com', 'phone' => '(11) 00000-0000', 'whatsapp' => '(11) 00000-0000', 'address' => 'São Paulo, SP', 'hours' => 'Seg. a sex., 9h às 18h', 'url' => 'https://example.com/contato', 'buttonLabel' => 'Entrar em contato', 'presentation' => 'business'],
        'smsSignup' => captureConfig('Avisos por SMS', 'Quero receber') + ['presentation' => 'action'],
        'poll' => ['title' => 'Enquete', 'question' => 'Qual conteúdo você quer ver a seguir?', 'buttonLabel' => 'Votar', 'successMessage' => 'Seu voto foi salvo.', 'consentText' => 'Concordo em enviar esta resposta ao responsável pela página.', 'showResults' => true],
        'reviews' => ['title' => 'Avaliações', 'description' => 'O que as pessoas dizem.', 'layout' => 'carousel'],
        'stats' => ['title' => 'Números', 'description' => 'Indicadores demonstrativos.', 'layout' => 'grid'],
        'discountCode' => ['title' => 'Cupom de desconto', 'description' => 'Copie o código para usar na compra.', 'code' => 'TESTE10', 'buttonLabel' => 'Copiar cupom', 'url' => 'https://example.com/oferta'],
        'document' => ['title' => 'Documento', 'description' => 'Material demonstrativo para download.', 'url' => 'https://example.com/documento.pdf', 'buttonLabel' => 'Abrir documento', 'label' => 'PDF'],
        'genericVideo' => ['title' => 'Vídeo', 'description' => 'Assista ao conteúdo em destaque.', 'url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'buttonLabel' => 'Assistir', 'embedMode' => 'link', 'presentation' => 'cover', 'coverImage' => $image],
        'podcastMusic' => ['title' => 'Podcast e música', 'description' => 'Episódios e faixas em destaque.', 'coverImage' => $image, 'spotifyPresentation' => 'embed'],
        'mobileApp' => ['title' => 'Aplicativo', 'description' => 'Baixe o aplicativo nas lojas.', 'buttonLabel' => 'Baixar', 'layout' => 'grid'],
        'eventList' => ['title' => 'Agenda', 'description' => 'Próximos eventos demonstrativos.', 'buttonLabel' => 'Participar', 'layout' => 'classic'],
        'externalForm' => ['title' => 'Formulário externo', 'description' => 'Responda em uma nova página.', 'url' => 'https://docs.google.com/forms/', 'buttonLabel' => 'Abrir formulário', 'embedMode' => 'link'],
        'rssFeed' => ['title' => 'Notícias', 'description' => 'Atualizações de uma fonte externa.', 'url' => 'https://www.nasa.gov/rss/dyn/breaking_news.rss', 'buttonLabel' => 'Ler notícia'],
        'donation' => ['title' => 'Apoie este projeto', 'description' => 'Escolha uma forma de contribuir.', 'buttonLabel' => 'Contribuir', 'layout' => 'grid'],
        'viewerCount' => ['color' => '#7c3aed'],
        'discordPresence' => ['title' => 'Presença no Discord', 'description' => 'Status demonstrativo.', 'discordSource' => 'manual', 'discordUsername' => 'liam-burge', 'discordStatus' => 'online', 'discordActivity' => 'Testando todos os widgets', 'discordUrl' => 'https://discord.com/', 'buttonLabel' => 'Abrir Discord'],
        'gamingProfile' => ['title' => 'Perfil gamer', 'description' => 'Dados demonstrativos.', 'gamingSource' => 'manual', 'gamerTag' => 'LIAM_BURGE', 'currentGame' => 'Jogo demonstrativo', 'platform' => 'PC', 'rank' => 'Teste', 'gamingUrl' => 'https://example.com/gamer', 'buttonLabel' => 'Ver perfil'],
        'spotlight' => ['title' => 'Destaque', 'description' => 'Uma seção para contar a história principal.', 'body' => '<p>Conteúdo demonstrativo para validar texto, imagem e benefícios.</p>', 'image' => $image, 'imagePosition' => 'left', 'buttonLabel' => 'Conheça mais', 'url' => 'https://example.com/destaque'],
        'ctaBanner' => ['title' => 'Vamos começar?', 'description' => 'Banner demonstrativo usando diretamente as cores do tema.', 'buttonLabel' => 'Começar agora', 'url' => 'https://example.com/acao', 'image' => $imageAlt, 'layout' => 'split'],
        'logoCloud' => ['title' => 'Parceiros', 'description' => 'Marcas e certificações demonstrativas.', 'layout' => 'grid'],
        'socialFeed' => ['title' => 'Mural social', 'description' => 'Publicações manuais para validar o tema.', 'layout' => 'grid'],
    ];

    $items = [
        'linkedCourse' => [offerItem('Curso demonstrativo', 'Conteúdo completo em módulos.', $image, 79.90)],
        'service' => [offerItem('Atendimento demonstrativo', 'Serviço criado para teste visual.', $imageAlt, 60.00)],
        'faq' => [['title' => 'Como funciona?', 'description' => 'Este conteúdo é apenas demonstrativo.', 'active' => true]],
        'linkCollection' => [['title' => 'Site principal', 'description' => 'Destino de exemplo.', 'url' => 'https://example.com/', 'active' => true]],
        'embedCollection' => [['title' => 'Publicação demonstrativa', 'description' => 'Prévia manual para teste.', 'url' => 'https://example.com/post', 'image' => $image, 'payload' => ['provider' => 'other', 'domain' => 'example.com'], 'active' => true]],
        'imageGallery' => [
            ['title' => 'Imagem 1', 'image' => $image, 'active' => true],
            ['title' => 'Imagem 2', 'image' => $imageAlt, 'active' => true],
            ['title' => 'Imagem 3', 'image' => '/images/others/1millidollars-pWt4Ga867MY-unsplash.jpg', 'active' => true],
        ],
        'poll' => [
            ['title' => 'Mais tutoriais', 'active' => true],
            ['title' => 'Mais bastidores', 'active' => true],
            ['title' => 'Mais novidades', 'active' => true],
        ],
        'reviews' => [
            ['title' => 'Cliente demonstrativo', 'description' => 'Experiência excelente e atendimento cuidadoso.', 'image' => $image, 'payload' => ['rating' => 5], 'active' => true],
            ['title' => 'Visitante de teste', 'description' => 'Conteúdo claro e página fácil de usar.', 'payload' => ['rating' => 5], 'active' => true],
        ],
        'stats' => [
            ['title' => 'Projetos', 'description' => '120+', 'active' => true],
            ['title' => 'Avaliação', 'description' => '4,9/5', 'active' => true],
        ],
        'podcastMusic' => [['type' => 'spotify', 'title' => 'Episódio demonstrativo', 'description' => 'Faixa usada para validação.', 'url' => 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT', 'image' => $image, 'active' => true]],
        'mobileApp' => [['title' => 'App Store', 'description' => 'iPhone e iPad', 'url' => 'https://www.apple.com/app-store/', 'image' => $image, 'active' => true]],
        'eventList' => [['title' => 'Encontro demonstrativo', 'description' => 'Data e horário a confirmar.', 'url' => 'https://example.com/evento', 'image' => $imageAlt, 'active' => true]],
        'donation' => [offerItem('Contribuição livre', 'Apoie com o valor que preferir.', $image, 10.00, 'https://example.com/doar')],
        'spotlight' => [
            ['title' => 'Conteúdo flexível', 'description' => 'Adapte textos e imagens no editor.', 'active' => true],
            ['title' => 'Tema integrado', 'description' => 'Cores herdadas automaticamente.', 'active' => true],
        ],
        'logoCloud' => [
            ['title' => 'Parceiro A', 'image' => $image, 'url' => 'https://example.com/a', 'active' => true],
            ['title' => 'Parceiro B', 'image' => $imageAlt, 'url' => 'https://example.com/b', 'active' => true],
        ],
        'socialFeed' => [
            ['title' => 'Publicação de teste', 'description' => 'Um post manual que respeita a superfície do tema.', 'url' => 'https://instagram.com/', 'image' => $image, 'payload' => ['network' => 'instagram', 'likes' => 42, 'comments' => 7], 'active' => true],
            ['title' => 'Novidade da comunidade', 'description' => 'Segundo item para testar o grid responsivo.', 'url' => 'https://youtube.com/', 'image' => $imageAlt, 'payload' => ['network' => 'youtube', 'likes' => 18, 'comments' => 3], 'active' => true],
        ],
    ];

    foreach ($base as $type => &$definition) {
        $definition['config'] = [
            ...$definition['config'],
            ...($configs[$type] ?? ['title' => testTitle($type)]),
        ];
        $definition['items'] = $items[$type] ?? null;
    }

    return $base;
}

/** @return array<string, mixed> */
function captureConfig(string $title, string $buttonLabel): array
{
    return [
        'title' => $title,
        'description' => 'Preencha os dados demonstrativos.',
        'buttonLabel' => $buttonLabel,
        'successMessage' => 'Dados recebidos com sucesso.',
        'consentText' => 'Concordo em compartilhar estas informações com o responsável pela página.',
    ];
}

/** @return array<string, mixed> */
function offerItem(
    string $title,
    string $description,
    string $image,
    float $price,
    string $url = 'https://example.com/oferta',
): array {
    return [
        'title' => $title,
        'description' => $description,
        'url' => $url,
        'image' => $image,
        'price' => $price,
        'currency' => 'BRL',
        'active' => true,
    ];
}

function testTitle(string $type): string
{
    return match ($type) {
        'ctaBanner' => 'Banner de chamada para ação',
        'socialFeed' => 'Mural social',
        'imageGallery' => 'Galeria de imagens',
        'contactCard' => 'Cartão de contato',
        default => ucfirst((string) preg_replace('/(?<!^)[A-Z]/', ' $0', $type)),
    };
}

function argumentValue(array $arguments, string $name, string $default): string
{
    foreach ($arguments as $argument) {
        if (str_starts_with($argument, "{$name}=")) {
            return substr($argument, strlen($name) + 1);
        }
    }

    return $default;
}

/** @param array<string, mixed> $details */
function printResult(string $status, Biolink $biolink, array $details): void
{
    echo json_encode([
        'status' => $status,
        'biolink' => [
            'id' => $biolink->id,
            'name' => $biolink->name,
            'back_half' => $biolink->back_half,
            'user_email' => $biolink->user?->email,
            'workspace_id' => $biolink->workspace_id,
        ],
        ...$details,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR).PHP_EOL;
}
