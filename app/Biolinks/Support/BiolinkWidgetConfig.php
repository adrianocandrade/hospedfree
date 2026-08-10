<?php

namespace App\Biolinks\Support;

use App\QrCodes\Services\PixPayloadBuilder;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use InvalidArgumentException;

class BiolinkWidgetConfig
{
    public const TYPES = [
        'image',
        'text',
        'socials',
        'youtube',
        'soundcloud',
        'vimeo',
        'spotify',
        'twitch',
        'tiktok',
        'contactForm',
        'emailSignup',
        'eventRsvp',
        'linkedProduct',
        'linkedCourse',
        'service',
        'booking',
        'faq',
        'linkCollection',
        'embedCollection',
        'imageGallery',
        'qrCode',
        'location',
        'contactCard',
        'smsSignup',
        'poll',
        'reviews',
        'stats',
        'discountCode',
        'document',
        'genericVideo',
        'podcastMusic',
        'mobileApp',
        'eventList',
        'externalForm',
        'rssFeed',
        'donation',
        'viewerCount',
        'discordPresence',
        'gamingProfile',
        'spotlight',
        'ctaBanner',
        'logoCloud',
        'socialFeed',
        'countdown',
        'audio',
        'imageComparison',
    ];

    public const SUBMISSION_TYPES = [
        'contactForm',
        'emailSignup',
        'eventRsvp',
        'smsSignup',
        'poll',
    ];

    private const CONFIG_KEYS = [
        'image' => ['url', 'destinationUrl', 'type'],
        'text' => [
            'title',
            'description',
            'body',
            'showBackground',
            'variant',
            'noticeTone',
        ],
        'youtube' => ['url', 'presentation', 'coverImage', 'playButtonMotion'],
        'soundcloud' => ['url', 'embedUrl'],
        'vimeo' => ['url'],
        'spotify' => ['url', 'type', 'spotifyPresentation'],
        'twitch' => ['url'],
        'tiktok' => ['url', 'presentation'],
        'contactForm' => [
            'title',
            'description',
            'buttonLabel',
            'successMessage',
            'consentText',
            'requirePhone',
            'contactMode',
        ],
        'emailSignup' => [
            'title',
            'description',
            'buttonLabel',
            'successMessage',
            'consentText',
            'campaign',
            'presentation',
        ],
        'eventRsvp' => [
            'title',
            'description',
            'buttonLabel',
            'successMessage',
            'consentText',
            'eventDate',
            'allowWaitlist',
            'contactMode',
            'allowGuests',
            'maxGuests',
        ],
        'linkedProduct' => [
            'title',
            'description',
            'buttonLabel',
            'layout',
            'source',
            'productIds',
            'presentation',
            'boxBackgroundColor',
            'boxTextColor',
            'productStyle',
            'itemStyle',
        ],
        'linkedCourse' => [
            'title',
            'description',
            'buttonLabel',
            'layout',
            'boxBackgroundColor',
            'boxTextColor',
            'productStyle',
            'itemStyle',
        ],
        'service' => [
            'title',
            'description',
            'buttonLabel',
            'layout',
            'boxBackgroundColor',
            'boxTextColor',
            'productStyle',
            'itemStyle',
        ],
        'booking' => [
            'title',
            'description',
            'buttonLabel',
            'serviceIds',
            'showServiceDetails',
            'layout',
            'itemStyle',
        ],
        'faq' => ['title', 'description'],
        'linkCollection' => ['title', 'description', 'layout', 'itemStyle'],
        'embedCollection' => [
            'title',
            'description',
            'layout',
            'previewStyle',
            'itemStyle',
        ],
        'imageGallery' => [
            'title',
            'description',
            'layout',
            'aspectRatio',
            'gridColumns',
            'imageZoom',
            'itemStyle',
        ],
        'qrCode' => ['title', 'description', 'value', 'label', 'qrDisplay'],
        'location' => [
            'title',
            'description',
            'address',
            'url',
            'buttonLabel',
            'mapDisplay',
            'mapProvider',
            'cep',
            'street',
            'number',
            'complement',
            'neighborhood',
            'city',
            'state',
            'latitude',
            'longitude',
        ],
        'contactCard' => [
            'title',
            'description',
            'name',
            'occupation',
            'email',
            'phone',
            'whatsapp',
            'address',
            'hours',
            'url',
            'buttonLabel',
            'presentation',
            'enableVcard',
        ],
        'smsSignup' => [
            'title',
            'description',
            'buttonLabel',
            'successMessage',
            'consentText',
            'campaign',
            'presentation',
        ],
        'poll' => [
            'title',
            'description',
            'question',
            'buttonLabel',
            'successMessage',
            'consentText',
            'showResults',
        ],
        'reviews' => ['title', 'description', 'layout', 'itemStyle'],
        'stats' => ['title', 'description', 'layout', 'itemStyle'],
        'discountCode' => [
            'title',
            'description',
            'code',
            'buttonLabel',
            'expiresAt',
            'url',
        ],
        'document' => [
            'title',
            'description',
            'url',
            'buttonLabel',
            'label',
            'documentKind',
        ],
        'genericVideo' => [
            'title',
            'description',
            'url',
            'buttonLabel',
            'embedMode',
            'presentation',
            'coverImage',
            'duration',
            'metadataLabel',
            'playBehavior',
            'playButtonMotion',
        ],
        'podcastMusic' => [
            'title',
            'description',
            'coverImage',
            'spotifyPresentation',
            'itemStyle',
        ],
        'mobileApp' => [
            'title',
            'description',
            'buttonLabel',
            'layout',
            'itemStyle',
        ],
        'eventList' => [
            'title',
            'description',
            'buttonLabel',
            'layout',
            'itemStyle',
        ],
        'externalForm' => [
            'title',
            'description',
            'url',
            'buttonLabel',
            'embedMode',
        ],
        'rssFeed' => ['title', 'description', 'url', 'buttonLabel'],
        'discordPresence' => [
            'title',
            'description',
            'discordSource',
            'discordUserId',
            'discordUsername',
            'discordStatus',
            'discordActivity',
            'discordUrl',
            'buttonLabel',
        ],
        'gamingProfile' => [
            'title',
            'description',
            'gamingSource',
            'steamProfileUrl',
            'gamerTag',
            'currentGame',
            'platform',
            'rank',
            'gamingUrl',
            'buttonLabel',
        ],
        'spotlight' => [
            'title',
            'description',
            'body',
            'image',
            'imagePosition',
            'buttonLabel',
            'url',
        ],
        'ctaBanner' => [
            'title',
            'description',
            'buttonLabel',
            'url',
            'image',
            'layout',
            'backgroundColor',
            'textColor',
        ],
        'logoCloud' => ['title', 'description', 'layout'],
        'socialFeed' => ['title', 'description', 'layout'],
        'donation' => [
            'title',
            'description',
            'buttonLabel',
            'layout',
            'boxBackgroundColor',
            'boxTextColor',
            'productStyle',
            'itemStyle',
            'pixEnabled',
            'pixKeyType',
            'pixKey',
            'pixReceiverName',
            'pixReceiverCity',
            'pixAmount',
            'pixDescription',
            'pixTxid',
        ],
        'viewerCount' => ['color', 'fontConfig'],
        'countdown' => [
            'title',
            'description',
            'targetAt',
            'timezone',
            'completionBehavior',
            'completionMessage',
            'completionUrl',
            'buttonLabel',
            'showSeconds',
        ],
        'audio' => [
            'title',
            'description',
            'url',
            'coverImage',
            'artist',
            'caption',
        ],
        'imageComparison' => [
            'title',
            'description',
            'beforeImage',
            'afterImage',
            'beforeLabel',
            'afterLabel',
            'initialPosition',
        ],
    ];

    private const ITEM_KEYS = [
        'type',
        'active',
        'title',
        'description',
        'url',
        'image',
        'price',
        'currency',
        'payload',
    ];

    private const ITEM_WIDGET_TYPES = [
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

    private const COLLECTION_TYPES = [
        'linkedProduct',
        'linkedCourse',
        'service',
        'booking',
        'linkCollection',
        'embedCollection',
        'imageGallery',
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

    private const ITEM_STYLE_KEYS = [
        'backgroundColor',
        'textColor',
        'borderColor',
        'transparency',
        'borderWidth',
        'shadow',
        'shadowColor',
        'radius',
        'fontFamily',
        'imagePosition',
        'imageSize',
        'imageRadius',
        'showImages',
        'showImageFallback',
        'pricePosition',
        'actionStyle',
    ];

    private const CONTACT_MODES = [
        'email_required',
        'phone_required',
        'email_or_phone',
        'email_and_phone',
    ];

    private const SECTION_KEYS = [
        'presentation',
        'showTitle',
        'icon',
        'anchorLabel',
        'actionLabel',
        'actionUrl',
    ];

    private const MUSIC_SERVICE_TYPES = [
        'spotify',
        'appleMusic',
        'youtubeMusic',
        'youtube',
        'deezer',
        'soundcloud',
        'bandcamp',
        'mixcloud',
        'tidal',
        'amazonMusic',
        'audiomack',
        'pandora',
        'yandexMusic',
        'napster',
        'itunes',
        'custom',
    ];

    private const MUSIC_RELEASE_TYPES = [
        'song',
        'playlist',
        'album',
        'podcast',
        'other',
    ];

    private const SOCIAL_KEYS = [
        'mail',
        'facebook',
        'twitter',
        'instagram',
        'tiktok',
        'youtube',
        'soundcloud',
        'bandcamp',
        'linkedin',
        'whatsapp',
        'telegram',
        'twitch',
        'patreon',
        'pinterest',
        'reddit',
        'spotify',
        'amazon',
        'snapchat',
        'apple',
        'style',
        'colorMode',
    ];

    public function validate(
        string $type,
        array $config,
        array|null $items = null,
    ): array {
        $errors = [];

        if (!in_array($type, self::TYPES, true)) {
            return ['type' => 'The selected widget type is invalid.'];
        }

        $this->validateConfig($errors, $type, $config);
        $this->validateItems($errors, $type, $items);
        $this->validateMusicHub($errors, $type, $config, $items);

        return $errors;
    }

    public function removeEmptyUnsupportedConfigKeys(
        string $type,
        array $config,
    ): array {
        $allowed = $this->configKeysFor($type);

        return array_filter(
            $config,
            fn(mixed $value, string|int $key) => in_array(
                $key,
                $allowed,
                true,
            ) || !$this->isEmpty($value),
            ARRAY_FILTER_USE_BOTH,
        );
    }

    public function normalizeConfig(string $type, array $config): array
    {
        $keys = $this->configKeysFor($type);
        $config = Arr::only($config, $keys);

        foreach ($config as $key => $value) {
            if (is_string($value)) {
                $value = $this->repairMojibake(trim($value));
                $config[$key] = $value;
            }

            if (
                in_array(
                    $key,
                    [
                        'requirePhone',
                        'allowWaitlist',
                        'allowGuests',
                        'showResults',
                        'imageZoom',
                        'showBackground',
                        'showSeconds',
                        'enableVcard',
                        'pixEnabled',
                    ],
                    true,
                )
            ) {
                $config[$key] = filter_var($value, FILTER_VALIDATE_BOOLEAN);
            }

            if (
                in_array(
                    $key,
                    ['maxGuests', 'gridColumns', 'initialPosition'],
                    true,
                )
            ) {
                $config[$key] = (int) $value;
            }

            if ($key === 'body') {
                $config[$key] = app(BiolinkTextSanitizer::class)->sanitize(
                    $value,
                );
            }

            if ($key === 'section' && is_array($value)) {
                $config[$key] = array_filter(
                    Arr::only($value, self::SECTION_KEYS),
                    fn(mixed $item) => $item !== null && $item !== '',
                );
            }

            if ($key === 'serviceIds' && is_array($value)) {
                $config[$key] = collect($value)
                    ->filter(
                        fn(mixed $id) => is_int($id) ||
                            (is_string($id) && ctype_digit($id)),
                    )
                    ->map(fn(mixed $id) => (int) $id)
                    ->filter(fn(int $id) => $id > 0)
                    ->unique()
                    ->values()
                    ->all();
            }

            if ($key === 'productIds' && is_array($value)) {
                $config[$key] = collect($value)
                    ->filter(
                        fn(mixed $id) => is_int($id) ||
                            (is_string($id) && ctype_digit($id)),
                    )
                    ->map(fn(mixed $id) => (int) $id)
                    ->filter(fn(int $id) => $id > 0)
                    ->unique()
                    ->values()
                    ->all();
            }
        }

        if (
            $type === 'viewerCount' &&
            isset($config['fontConfig']) &&
            is_array($config['fontConfig'])
        ) {
            $config['fontConfig'] = Arr::only($config['fontConfig'], [
                'family',
                'google',
            ]);
        }

        if (
            in_array(
                $type,
                ['linkedProduct', 'linkedCourse', 'service', 'donation'],
                true,
            ) &&
            isset($config['productStyle']) &&
            is_array($config['productStyle'])
        ) {
            $config['productStyle'] = Arr::only($config['productStyle'], [
                'imagePosition',
                'imageSize',
                'imageRadius',
                'showImages',
                'showImageFallback',
                'cardTransparency',
                'cardBorderWidth',
                'cardGlow',
                'pricePosition',
                'actionStyle',
                'showBackground',
                'shadowColor',
                'radius',
                'fontFamily',
                'cardVariant',
            ]);
        }

        if (
            in_array($type, self::COLLECTION_TYPES, true) &&
            isset($config['itemStyle']) &&
            is_array($config['itemStyle'])
        ) {
            $config['itemStyle'] = Arr::only(
                $config['itemStyle'],
                self::ITEM_STYLE_KEYS,
            );
        }

        return array_filter(
            $config,
            fn($value) => $value !== null && $value !== '',
        );
    }

    public function normalizeItems(string $type, array|null $items): array|null
    {
        if (
            $items === null ||
            !in_array($type, self::ITEM_WIDGET_TYPES, true)
        ) {
            return $items;
        }

        return collect($items)
            ->map(function (array $item, int $index) use ($type) {
                $item = Arr::only($item, self::ITEM_KEYS);
                $item['type'] = $item['type'] ?? $this->defaultItemType($type);
                $item['active'] = Arr::get($item, 'active', true);
                $item['sort_order'] = $index;

                foreach (
                    ['title', 'description', 'url', 'image', 'currency']
                    as $key
                ) {
                    if (isset($item[$key]) && is_string($item[$key])) {
                        $item[$key] = $this->repairMojibake(trim($item[$key]));
                    }
                }

                if (isset($item['price']) && $item['price'] === '') {
                    $item['price'] = null;
                }

                if (
                    $type === 'embedCollection' &&
                    isset($item['payload']) &&
                    is_array($item['payload'])
                ) {
                    $item['payload'] = array_filter(
                        collect(
                            Arr::only($item['payload'], ['provider', 'domain']),
                        )
                            ->map(
                                fn(mixed $value) => is_string($value)
                                    ? trim($value)
                                    : $value,
                            )
                            ->all(),
                        fn(mixed $value) => $value !== null && $value !== '',
                    );
                }

                return $item;
            })
            ->filter(
                fn(array $item) => ($item['title'] ?? '') !== '' ||
                    ($item['url'] ?? '') !== '' ||
                    ($item['image'] ?? '') !== '',
            )
            ->values()
            ->all();
    }

    public function acceptsSubmissions(string $type): bool
    {
        return in_array($type, self::SUBMISSION_TYPES, true);
    }

    private function validateConfig(
        array &$errors,
        string $type,
        array $config,
    ): void {
        $allowed = $this->configKeysFor($type);
        $this->allowedKeys($errors, 'config', $config, $allowed);

        foreach ($config as $key => $value) {
            $path = "config.$key";
            match ($key) {
                'title' => $this->string($errors, $path, $value, 160, true),
                'description' => $this->string(
                    $errors,
                    $path,
                    $value,
                    500,
                    true,
                ),
                'buttonLabel',
                'successMessage',
                'consentText',
                'label',
                'campaign',
                'address',
                'street',
                'number',
                'complement',
                'neighborhood',
                'city',
                'state',
                'name',
                'occupation',
                'email',
                'phone',
                'whatsapp',
                'hours',
                'code',
                'expiresAt',
                'question',
                'discordUserId',
                'discordUsername',
                'discordActivity',
                'gamerTag',
                'currentGame',
                'platform',
                'rank'
                    => $this->string($errors, $path, $value, 255, true),
                'artist',
                'caption',
                'beforeLabel',
                'afterLabel',
                'completionMessage'
                    => $this->string($errors, $path, $value, 255, true),
                'pixKey',
                'pixReceiverName',
                'pixReceiverCity',
                'pixDescription',
                'pixTxid'
                    => $this->string($errors, $path, $value, 255, true),
                'duration', 'metadataLabel' => $this->string(
                    $errors,
                    $path,
                    $value,
                    80,
                    true,
                ),
                'blueprintKey' => $this->string(
                    $errors,
                    $path,
                    $value,
                    80,
                    true,
                ),
                'url',
                'destinationUrl',
                'embedUrl',
                'discordUrl',
                'gamingUrl',
                'steamProfileUrl'
                    => $this->safeUrl($errors, $path, $value, true),
                'completionUrl' => $this->safeUrl(
                    $errors,
                    $path,
                    $value,
                    true,
                ),
                'coverImage', 'image', 'beforeImage', 'afterImage' => $this->safeImageUrl(
                    $errors,
                    $path,
                    $value,
                ),
                'value' => $this->safeUrlOrText($errors, $path, $value),
                'eventDate' => $this->string($errors, $path, $value, 40, true),
                'targetAt' => $this->isoDate($errors, $path, $value),
                'timezone' => $this->timezone($errors, $path, $value),
                'variant' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['text', 'heading', 'notice', 'divider'],
                    true,
                ),
                'noticeTone' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['neutral', 'info', 'success', 'warning'],
                    true,
                ),
                'completionBehavior' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['stay', 'hide', 'message', 'link'],
                    true,
                ),
                'documentKind' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['pdf', 'spreadsheet', 'presentation', 'file'],
                    true,
                ),
                'pixKeyType' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['cpf', 'cnpj', 'phone', 'email', 'random'],
                    true,
                ),
                'pixAmount' => $this->price($errors, $path, $value),
                'layout' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    [
                        'classic',
                        'featured',
                        'grid',
                        'list',
                        'carousel',
                        'line',
                        'card',
                        'slide',
                        'compact',
                        'split',
                        'background',
                        'strip',
                        'timeline',
                    ],
                    true,
                ),
                'source' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['catalog'],
                    true,
                ),
                'productIds' => $this->integerList($errors, $path, $value, 50),
                'presentation' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    [
                        'standard',
                        'featured',
                        'top',
                        'embed',
                        'video',
                        'link',
                        'action',
                        'inline',
                        'business',
                        'cover',
                    ],
                    true,
                ),
                'playBehavior' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['external', 'inline'],
                    true,
                ),
                'playButtonMotion' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['none', 'pulse'],
                    true,
                ),
                'previewStyle' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['compact', 'comfortable'],
                    true,
                ),
                'colorMode' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['theme', 'brand', 'monochrome'],
                    true,
                ),
                'style' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['icons', 'buttons', 'pills'],
                    true,
                ),
                'spotifyPresentation' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['embed', 'link'],
                    true,
                ),
                'imageZoom' => $this->boolean($errors, $path, $value, true),
                'qrDisplay' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['card', 'code', 'button'],
                    true,
                ),
                'mapDisplay' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['button', 'iframe', 'modal'],
                    true,
                ),
                'mapProvider' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['google', 'waze', 'openstreetmap', 'custom'],
                    true,
                ),
                'cep' => $this->postalCode($errors, $path, $value),
                'latitude' => $this->coordinate(
                    $errors,
                    $path,
                    $value,
                    -90,
                    90,
                ),
                'longitude' => $this->coordinate(
                    $errors,
                    $path,
                    $value,
                    -180,
                    180,
                ),
                'discordStatus' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['online', 'idle', 'dnd', 'offline'],
                    true,
                ),
                'discordSource' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['manual', 'lanyard'],
                    true,
                ),
                'gamingSource' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['manual', 'steam'],
                    true,
                ),
                'embedMode' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['link', 'iframe'],
                    true,
                ),
                'contactMode' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    self::CONTACT_MODES,
                    true,
                ),
                'style' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['icons', 'buttons', 'pills'],
                    true,
                ),
                'boxBackgroundColor',
                'boxTextColor',
                'backgroundColor',
                'textColor'
                    => $this->color($errors, $path, $value, true),
                'productStyle' => $this->validateProductStyle(
                    $errors,
                    $path,
                    $value,
                ),
                'itemStyle' => $this->validateItemStyle($errors, $path, $value),
                'serviceIds' => $this->integerList($errors, $path, $value, 50),
                'showServiceDetails' => $this->boolean(
                    $errors,
                    $path,
                    $value,
                    true,
                ),
                'color' => $this->color($errors, $path, $value, true),
                'fontConfig' => $this->fontConfig($errors, $path, $value),
                'section' => $this->validateSection($errors, $path, $value),
                'body' => $this->html($errors, $path, $value, 5000, true),
                'type' => $this->string($errors, $path, $value, 40, true),
                'imagePosition' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['left', 'right', 'top', 'background'],
                    true,
                ),
                'aspectRatio' => $this->enum(
                    $errors,
                    $path,
                    $value,
                    ['square', '1/1', '4/3', '3/2', '16/9', 'portrait'],
                    true,
                ),
                'gridColumns' => $this->integer(
                    $errors,
                    $path,
                    $value,
                    1,
                    4,
                    true,
                ),
                'requirePhone',
                'allowWaitlist',
                'allowGuests',
                'showResults',
                'showBackground'
                    => $this->boolean($errors, $path, $value, true),
                'showSeconds' => $this->boolean(
                    $errors,
                    $path,
                    $value,
                    true,
                ),
                'enableVcard' => $this->boolean(
                    $errors,
                    $path,
                    $value,
                    true,
                ),
                'pixEnabled' => $this->boolean(
                    $errors,
                    $path,
                    $value,
                    true,
                ),
                'maxGuests' => $this->integer(
                    $errors,
                    $path,
                    $value,
                    0,
                    10,
                    true,
                ),
                'initialPosition' => $this->integer(
                    $errors,
                    $path,
                    $value,
                    0,
                    100,
                    true,
                ),
                default => in_array($key, self::SOCIAL_KEYS, true)
                    ? $this->safeUrlOrText($errors, $path, $value)
                    : null,
            };
        }

        if (($config['discordSource'] ?? 'manual') === 'lanyard') {
            $discordUserId = $config['discordUserId'] ?? null;
            if (
                !is_string($discordUserId) ||
                !preg_match('/^\d{17,20}$/', $discordUserId)
            ) {
                $errors['config.discordUserId'] =
                    'Enter a valid Discord user ID.';
            }
        }

        if (($config['gamingSource'] ?? 'manual') === 'steam') {
            $steamProfileUrl = $config['steamProfileUrl'] ?? null;
            if (!$this->isSteamCommunityProfileUrl($steamProfileUrl)) {
                $errors['config.steamProfileUrl'] =
                    'Enter a valid Steam Community profile URL.';
            }
        }

        if (
            isset($config['blueprintKey']) &&
            (!is_string($config['blueprintKey']) ||
                preg_match(
                    '/^[a-z][a-z0-9_-]{0,79}$/',
                    $config['blueprintKey'],
                ) !== 1)
        ) {
            $errors['config.blueprintKey'] =
                'The blueprint key must use lowercase letters, numbers, dashes or underscores.';
        }

        if (
            $type === 'spotify' &&
            ($config['spotifyPresentation'] ?? 'embed') === 'embed' &&
            !$this->isSpotifyShareUrl($config['url'] ?? null)
        ) {
            $errors['config.url'] =
                'Enter a Spotify URL before enabling the player.';
        }

        if ($type === 'donation' && ($config['pixEnabled'] ?? false)) {
            try {
                app(PixPayloadBuilder::class)->build([
                    'key_type' => $config['pixKeyType'] ?? '',
                    'key' => $config['pixKey'] ?? '',
                    'receiver_name' => $config['pixReceiverName'] ?? '',
                    'receiver_city' => $config['pixReceiverCity'] ?? '',
                    'amount' => $config['pixAmount'] ?? null,
                    'description' => $config['pixDescription'] ?? '',
                    'txid' => $config['pixTxid'] ?? '',
                ]);
            } catch (InvalidArgumentException $exception) {
                $errors['config.pixKey'] = $exception->getMessage();
            }
        }
    }

    private function isSteamCommunityProfileUrl(mixed $value): bool
    {
        if (!is_string($value) || $value === '') {
            return false;
        }

        $parts = parse_url($value);
        $host = strtolower((string) ($parts['host'] ?? ''));
        $path = (string) ($parts['path'] ?? '');

        if (
            !in_array(
                $host,
                ['steamcommunity.com', 'www.steamcommunity.com'],
                true,
            )
        ) {
            return false;
        }

        return preg_match(
            '#^/(?:id/[A-Za-z0-9_-]+|profiles/\d{17})/?$#',
            $path,
        ) === 1;
    }

    private function isSpotifyShareUrl(mixed $value): bool
    {
        if (!is_string($value) || $value === '') {
            return false;
        }

        $parts = parse_url($value);
        $host = strtolower((string) ($parts['host'] ?? ''));
        $path = (string) ($parts['path'] ?? '');

        if (!in_array($host, ['open.spotify.com', 'embed.spotify.com'], true)) {
            return false;
        }

        return preg_match(
            '#^/(?:intl-[A-Za-z-]+/)?(?:track|artist|album|playlist|episode|show|user)/[^/]+/?$#',
            $path,
        ) === 1;
    }

    private function validateItems(
        array &$errors,
        string $type,
        array|null $items,
    ): void {
        if ($items === null) {
            return;
        }

        if (!in_array($type, self::ITEM_WIDGET_TYPES, true)) {
            $errors['items'] = 'This widget type does not accept items.';
            return;
        }

        $maxItems = $type === 'embedCollection' ? 20 : 50;
        if (count($items) > $maxItems) {
            $errors['items'] = "The widget can have at most $maxItems items.";
            return;
        }

        foreach ($items as $index => $item) {
            if (!is_array($item)) {
                $errors["items.$index"] = 'The item must be an object.';
                continue;
            }

            $this->allowedKeys($errors, "items.$index", $item, self::ITEM_KEYS);
            $this->string(
                $errors,
                "items.$index.title",
                Arr::get($item, 'title'),
                160,
                true,
            );
            $this->string(
                $errors,
                "items.$index.description",
                Arr::get($item, 'description'),
                1000,
                true,
            );
            $this->safeUrl(
                $errors,
                "items.$index.url",
                Arr::get($item, 'url'),
                true,
            );
            $this->safeImageUrl(
                $errors,
                "items.$index.image",
                Arr::get($item, 'image'),
            );
            $this->price(
                $errors,
                "items.$index.price",
                Arr::get($item, 'price'),
            );
            $this->currency(
                $errors,
                "items.$index.currency",
                Arr::get($item, 'currency'),
            );
            $this->boolean(
                $errors,
                "items.$index.active",
                Arr::get($item, 'active'),
                true,
            );

            if (
                $type === 'embedCollection' &&
                $this->isEmpty(Arr::get($item, 'url'))
            ) {
                $errors["items.$index.url"] =
                    'A URL is required for each embedded preview.';
            }

            if (
                Arr::has($item, 'payload') &&
                !is_array(Arr::get($item, 'payload'))
            ) {
                $errors["items.$index.payload"] =
                    'The payload must be an object.';
                continue;
            }

            $payload = Arr::get($item, 'payload', []);
            if ($type === 'socialFeed' && is_array($payload)) {
                $payloadPath = "items.$index.payload";
                $this->allowedKeys($errors, $payloadPath, $payload, [
                    'network',
                    'likes',
                    'comments',
                    'publishedAt',
                ]);
                $this->enum(
                    $errors,
                    "$payloadPath.network",
                    Arr::get($payload, 'network'),
                    [
                        'instagram',
                        'tiktok',
                        'youtube',
                        'facebook',
                        'linkedin',
                        'x',
                    ],
                    true,
                );
                $this->integer(
                    $errors,
                    "$payloadPath.likes",
                    Arr::get($payload, 'likes'),
                    0,
                    1000000000,
                    true,
                );
                $this->integer(
                    $errors,
                    "$payloadPath.comments",
                    Arr::get($payload, 'comments'),
                    0,
                    1000000000,
                    true,
                );
                $this->string(
                    $errors,
                    "$payloadPath.publishedAt",
                    Arr::get($payload, 'publishedAt'),
                    40,
                    true,
                );
            }

            if ($type === 'spotlight' && is_array($payload)) {
                $payloadPath = "items.$index.payload";
                $this->allowedKeys($errors, $payloadPath, $payload, ['icon']);
                $this->string(
                    $errors,
                    "$payloadPath.icon",
                    Arr::get($payload, 'icon'),
                    80,
                    true,
                );
            }

            if ($type === 'embedCollection' && is_array($payload)) {
                $payloadPath = "items.$index.payload";
                $this->allowedKeys($errors, $payloadPath, $payload, [
                    'provider',
                    'domain',
                ]);
                $this->enum(
                    $errors,
                    "$payloadPath.provider",
                    Arr::get($payload, 'provider'),
                    [
                        'instagram',
                        'tiktok',
                        'youtube',
                        'facebook',
                        'x',
                        'linkedin',
                        'bluesky',
                        'spotify',
                        'soundcloud',
                        'other',
                    ],
                    true,
                );
                $this->string(
                    $errors,
                    "$payloadPath.domain",
                    Arr::get($payload, 'domain'),
                    255,
                    true,
                );
            }

            if (
                $type === 'linkedProduct' &&
                is_array($payload) &&
                array_key_exists('merchandising', $payload) &&
                !is_array(Arr::get($payload, 'merchandising'))
            ) {
                $errors["items.$index.payload.merchandising"] =
                    'The merchandising value must be an object.';
            }

            if (
                $type === 'linkedProduct' &&
                is_array(Arr::get($payload, 'merchandising'))
            ) {
                $merchandising = Arr::get($payload, 'merchandising');
                $payloadPath = "items.$index.payload.merchandising";
                $this->allowedKeys($errors, $payloadPath, $merchandising, [
                    'comparePrice',
                    'badge',
                    'rating',
                    'stockLabel',
                ]);
                $this->price(
                    $errors,
                    "$payloadPath.comparePrice",
                    Arr::get($merchandising, 'comparePrice'),
                );
                $this->rating(
                    $errors,
                    "$payloadPath.rating",
                    Arr::get($merchandising, 'rating'),
                );
                $this->string(
                    $errors,
                    "$payloadPath.badge",
                    Arr::get($merchandising, 'badge'),
                    40,
                    true,
                );
                $this->string(
                    $errors,
                    "$payloadPath.stockLabel",
                    Arr::get($merchandising, 'stockLabel'),
                    80,
                    true,
                );

                $price = Arr::get($item, 'price');
                $comparePrice = Arr::get($merchandising, 'comparePrice');
                if (
                    is_numeric($price) &&
                    is_numeric($comparePrice) &&
                    (float) $comparePrice <= (float) $price
                ) {
                    $errors["$payloadPath.comparePrice"] =
                        'The compare price must be greater than the current price.';
                }
            }
        }
    }

    private function validateMusicHub(
        array &$errors,
        string $type,
        array $config,
        array|null $items,
    ): void {
        if ($type !== 'podcastMusic' || $items === null) {
            return;
        }

        $legacySeen = [];
        $hasCanonicalRelease = false;
        $hasLegacySpotify = false;

        foreach ($items as $index => $item) {
            if (!is_array($item)) {
                continue;
            }

            $nestedServices = Arr::get($item, 'payload.services');
            if (is_array($nestedServices)) {
                $hasCanonicalRelease = true;
                $this->validateMusicRelease($errors, $index, $item, $config);
                continue;
            }

            // Flat items are the pre-Music Hub shape. Keep accepting them so
            // existing pages can be opened and saved through the new editor.
            $this->validateMusicService(
                $errors,
                "items.$index",
                $item,
                Arr::get($item, 'type', 'musicLink'),
                $legacySeen,
            );
            if (
                Arr::get($item, 'type') === 'spotify' &&
                $this->isSpotifyShareUrl(Arr::get($item, 'url'))
            ) {
                $hasLegacySpotify = true;
            }
        }

        if (
            !$hasCanonicalRelease &&
            ($config['spotifyPresentation'] ?? 'link') === 'embed' &&
            !$hasLegacySpotify
        ) {
            $errors['config.spotifyPresentation'] =
                'Add a Spotify service URL before enabling the player.';
        }
    }

    private function validateMusicRelease(
        array &$errors,
        int $index,
        array $release,
        array $config,
    ): void {
        $path = "items.$index";
        $this->enum(
            $errors,
            "$path.type",
            Arr::get($release, 'type', 'song'),
            self::MUSIC_RELEASE_TYPES,
        );
        $releaseTitle = Arr::get($release, 'title');
        if (!is_string($releaseTitle) || trim($releaseTitle) === '') {
            $errors["$path.title"] = 'Enter a title for the release.';
        } else {
            $this->string($errors, "$path.title", $releaseTitle, 160);
        }

        $payload = Arr::get($release, 'payload');
        if (!is_array($payload)) {
            $errors["$path.payload"] = 'The payload must be an object.';
            return;
        }

        $this->allowedKeys($errors, "$path.payload", $payload, [
            'services',
            'spotifyPresentation',
        ]);
        $this->enum(
            $errors,
            "$path.payload.spotifyPresentation",
            Arr::get(
                $payload,
                'spotifyPresentation',
                Arr::get($config, 'spotifyPresentation', 'embed'),
            ),
            ['embed', 'link'],
        );

        $services = Arr::get($payload, 'services');
        if (count($services) > 20) {
            $errors["$path.payload.services"] =
                'A release can have at most 20 services.';
        }

        $seen = [];
        foreach ($services as $serviceIndex => $service) {
            $servicePath = "$path.payload.services.$serviceIndex";
            if (!is_array($service)) {
                $errors[$servicePath] = 'The service must be an object.';
                continue;
            }

            $this->allowedKeys($errors, $servicePath, $service, [
                'type',
                'title',
                'url',
                'active',
                'sort_order',
            ]);
            $serviceType = Arr::get($service, 'type', 'custom');
            $this->validateMusicService(
                $errors,
                $servicePath,
                $service,
                $serviceType,
                $seen,
            );
        }

        if (
            Arr::get(
                $payload,
                'spotifyPresentation',
                Arr::get($config, 'spotifyPresentation', 'embed'),
            ) === 'embed' &&
            !isset($seen['spotify'])
        ) {
            $errors["$path.payload.spotifyPresentation"] =
                'Add a Spotify service URL before enabling the player.';
        }
    }

    private function validateMusicService(
        array &$errors,
        string $path,
        array $service,
        mixed $serviceType,
        array &$seen,
    ): void {
        $isLegacyMusicLink = $serviceType === 'musicLink';
        if ($serviceType === 'musicLink') {
            $serviceType = 'custom';
        }

        if (
            !is_string($serviceType) ||
            !in_array($serviceType, self::MUSIC_SERVICE_TYPES, true)
        ) {
            $errors["$path.type"] = 'The music service is invalid.';
            return;
        }

        if ($isLegacyMusicLink) {
            if (isset($service['title'])) {
                $this->string(
                    $errors,
                    "$path.title",
                    $service['title'],
                    120,
                    true,
                );
            }
            return;
        }

        if ($serviceType !== 'custom' && isset($seen[$serviceType])) {
            $errors["$path.type"] =
                'Each music service can only be added once.';
        }
        if ($serviceType !== 'custom') {
            $seen[$serviceType] = true;
        }

        $title = Arr::get($service, 'title');
        if ($serviceType === 'custom') {
            if (!is_string($title) || trim($title) === '') {
                $errors["$path.title"] = 'Enter a name for the custom service.';
            } else {
                $this->string($errors, "$path.title", $title, 120);
            }
        } elseif ($title !== null && $title !== '') {
            $this->string($errors, "$path.title", $title, 120, true);
        }

        $url = Arr::get($service, 'url');
        if (!is_string($url) || trim($url) === '') {
            $errors["$path.url"] = 'Enter a music service URL.';
            return;
        }

        if ($serviceType === 'spotify' && !$this->isSpotifyShareUrl($url)) {
            $errors["$path.url"] = 'Enter a valid Spotify URL.';
            return;
        }

        if (!str_starts_with(Str::lower(trim($url)), 'https://')) {
            $errors["$path.url"] = 'Use a secure HTTPS URL for music services.';
        }

        if (array_key_exists('active', $service)) {
            $this->boolean($errors, "$path.active", $service['active']);
        }
        if (array_key_exists('sort_order', $service)) {
            $this->integer(
                $errors,
                "$path.sort_order",
                $service['sort_order'],
                0,
                1000,
            );
        }
    }

    private function configKeysFor(string $type): array
    {
        $keys =
            $type === 'socials'
                ? self::SOCIAL_KEYS
                : self::CONFIG_KEYS[$type] ?? [];

        return array_values(
            array_unique([...$keys, 'section', 'blueprintKey']),
        );
    }

    private function validateProductStyle(
        array &$errors,
        string $path,
        mixed $value,
    ): void {
        if (!is_array($value)) {
            $errors[$path] = 'The product style value must be an object.';
            return;
        }

        $allowed = [
            'imagePosition',
            'imageSize',
            'imageRadius',
            'showImages',
            'showImageFallback',
            'cardTransparency',
            'cardBorderWidth',
            'cardGlow',
            'pricePosition',
            'actionStyle',
            'showBackground',
            'shadowColor',
            'radius',
            'fontFamily',
            'cardVariant',
        ];
        $this->allowedKeys($errors, $path, $value, $allowed);
        $this->enum(
            $errors,
            "$path.imagePosition",
            Arr::get($value, 'imagePosition'),
            ['left', 'top'],
            true,
        );
        $this->enum(
            $errors,
            "$path.imageSize",
            Arr::get($value, 'imageSize'),
            ['small', 'medium', 'large'],
            true,
        );
        $this->integer(
            $errors,
            "$path.imageRadius",
            Arr::get($value, 'imageRadius'),
            0,
            32,
            true,
        );
        $this->boolean(
            $errors,
            "$path.showImages",
            Arr::get($value, 'showImages'),
            true,
        );
        $this->boolean(
            $errors,
            "$path.showImageFallback",
            Arr::get($value, 'showImageFallback'),
            true,
        );
        $this->integer(
            $errors,
            "$path.cardTransparency",
            Arr::get($value, 'cardTransparency'),
            0,
            100,
            true,
        );
        $this->integer(
            $errors,
            "$path.cardBorderWidth",
            Arr::get($value, 'cardBorderWidth'),
            0,
            8,
            true,
        );
        $this->boolean(
            $errors,
            "$path.cardGlow",
            Arr::get($value, 'cardGlow'),
            true,
        );
        $this->enum(
            $errors,
            "$path.pricePosition",
            Arr::get($value, 'pricePosition'),
            ['inline', 'right', 'below'],
            true,
        );
        $this->enum(
            $errors,
            "$path.actionStyle",
            Arr::get($value, 'actionStyle'),
            ['button', 'icon', 'text'],
            true,
        );
        $this->boolean(
            $errors,
            "$path.showBackground",
            Arr::get($value, 'showBackground'),
            true,
        );
        $this->color(
            $errors,
            "$path.shadowColor",
            Arr::get($value, 'shadowColor'),
            true,
        );
        $this->integer(
            $errors,
            "$path.radius",
            Arr::get($value, 'radius'),
            0,
            32,
            true,
        );
        $this->fontFamily(
            $errors,
            "$path.fontFamily",
            Arr::get($value, 'fontFamily'),
        );
        $this->enum(
            $errors,
            "$path.cardVariant",
            Arr::get($value, 'cardVariant'),
            ['standard', 'media', 'compact', 'poster', 'minimal'],
            true,
        );
    }

    private function validateItemStyle(
        array &$errors,
        string $path,
        mixed $value,
    ): void {
        if (!is_array($value)) {
            $errors[$path] = 'The item style value must be an object.';
            return;
        }

        $this->allowedKeys($errors, $path, $value, self::ITEM_STYLE_KEYS);
        $this->color(
            $errors,
            "$path.backgroundColor",
            Arr::get($value, 'backgroundColor'),
            true,
        );
        $this->color(
            $errors,
            "$path.textColor",
            Arr::get($value, 'textColor'),
            true,
        );
        $this->color(
            $errors,
            "$path.borderColor",
            Arr::get($value, 'borderColor'),
            true,
        );
        $this->integer(
            $errors,
            "$path.transparency",
            Arr::get($value, 'transparency'),
            0,
            100,
            true,
        );
        $this->integer(
            $errors,
            "$path.borderWidth",
            Arr::get($value, 'borderWidth'),
            0,
            8,
            true,
        );
        $this->enum(
            $errors,
            "$path.shadow",
            Arr::get($value, 'shadow'),
            ['none', 'soft', 'strong', 'hard'],
            true,
        );
        $this->color(
            $errors,
            "$path.shadowColor",
            Arr::get($value, 'shadowColor'),
            true,
        );
        $this->integer(
            $errors,
            "$path.radius",
            Arr::get($value, 'radius'),
            0,
            32,
            true,
        );
        $this->fontFamily(
            $errors,
            "$path.fontFamily",
            Arr::get($value, 'fontFamily'),
        );
        $this->enum(
            $errors,
            "$path.imagePosition",
            Arr::get($value, 'imagePosition'),
            ['left', 'top'],
            true,
        );
        $this->enum(
            $errors,
            "$path.imageSize",
            Arr::get($value, 'imageSize'),
            ['small', 'medium', 'large'],
            true,
        );
        $this->integer(
            $errors,
            "$path.imageRadius",
            Arr::get($value, 'imageRadius'),
            0,
            32,
            true,
        );
        $this->boolean(
            $errors,
            "$path.showImages",
            Arr::get($value, 'showImages'),
            true,
        );
        $this->boolean(
            $errors,
            "$path.showImageFallback",
            Arr::get($value, 'showImageFallback'),
            true,
        );
        $this->enum(
            $errors,
            "$path.pricePosition",
            Arr::get($value, 'pricePosition'),
            ['inline', 'right', 'below'],
            true,
        );
        $this->enum(
            $errors,
            "$path.actionStyle",
            Arr::get($value, 'actionStyle'),
            ['button', 'icon', 'text'],
            true,
        );
    }

    private function defaultItemType(string $type): string
    {
        return match ($type) {
            'linkedProduct' => 'product',
            'linkedCourse' => 'course',
            'service' => 'service',
            'faq' => 'faq',
            'linkCollection' => 'link',
            'embedCollection' => 'embed',
            'imageGallery' => 'image',
            'poll' => 'pollOption',
            'reviews' => 'review',
            'stats' => 'stat',
            'podcastMusic' => 'musicLink',
            'mobileApp' => 'appLink',
            'eventList' => 'event',
            'donation' => 'donationLink',
            'spotlight' => 'benefit',
            'logoCloud' => 'logo',
            'socialFeed' => 'post',
            default => 'item',
        };
    }

    /**
     * Repair text that was previously decoded as ISO-8859-1/Windows-1252.
     * Correct UTF-8 text is returned untouched, so existing content is safe.
     */
    private function repairMojibake(string $value): string
    {
        if (
            $value === '' ||
            (!str_contains($value, 'Ã') &&
                !str_contains($value, 'Â') &&
                !str_contains($value, 'â€') &&
                !str_contains($value, 'ðŸ'))
        ) {
            return $value;
        }

        $latinBytes = @iconv('UTF-8', 'Windows-1252//IGNORE', $value);
        if ($latinBytes === false) {
            return $value;
        }

        $repaired = $latinBytes;
        if ($repaired === '') {
            return $value;
        }

        return $repaired;
    }

    private function integerList(
        array &$errors,
        string $path,
        mixed $value,
        int $max,
    ): void {
        if (!is_array($value)) {
            $errors[$path] = 'The value must be an array.';
            return;
        }

        if (count($value) > $max) {
            $errors[$path] = "The value must contain at most $max items.";
            return;
        }

        foreach ($value as $index => $item) {
            $this->integer($errors, "$path.$index", $item, 1, PHP_INT_MAX);
        }
    }

    private function allowedKeys(
        array &$errors,
        string $path,
        array $value,
        array $allowed,
    ): void {
        $unknown = array_values(array_diff(array_keys($value), $allowed));
        if ($unknown) {
            $errors[$path] =
                'Unsupported keys: ' . implode(', ', $unknown) . '.';
        }
    }

    private function postalCode(
        array &$errors,
        string $path,
        mixed $value,
    ): void {
        if ($this->isEmpty($value)) {
            return;
        }

        if (
            !is_string($value) ||
            preg_match('/^\d{5}-?\d{3}$/', $value) !== 1
        ) {
            $errors[$path] = 'Enter a valid 8-digit postal code.';
        }
    }

    private function coordinate(
        array &$errors,
        string $path,
        mixed $value,
        float $min,
        float $max,
    ): void {
        if ($this->isEmpty($value)) {
            return;
        }

        if (
            (!is_string($value) && !is_int($value) && !is_float($value)) ||
            !is_numeric($value)
        ) {
            $errors[$path] = 'Enter a valid coordinate.';
            return;
        }

        $coordinate = (float) $value;

        if ($coordinate < $min || $coordinate > $max) {
            $errors[$path] = "The coordinate must be between $min and $max.";
        }
    }

    private function enum(
        array &$errors,
        string $path,
        mixed $value,
        array $allowed,
        bool $nullable = false,
    ): void {
        if ($this->isEmpty($value) && $nullable) {
            return;
        }

        if (!is_string($value) || !in_array($value, $allowed, true)) {
            $errors[$path] = 'The selected value is invalid.';
        }
    }

    private function string(
        array &$errors,
        string $path,
        mixed $value,
        int $max,
        bool $nullable = false,
    ): void {
        if ($this->isEmpty($value) && $nullable) {
            return;
        }

        if (!is_string($value)) {
            $errors[$path] = 'The value must be a string.';
            return;
        }

        if (Str::length($value) > $max) {
            $errors[
                $path
            ] = "The value must not be greater than $max characters.";
        }

        if (
            str_contains($value, '<') ||
            preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value)
        ) {
            $errors[$path] = 'The value contains unsupported characters.';
        }
    }

    private function html(
        array &$errors,
        string $path,
        mixed $value,
        int $max,
        bool $nullable = false,
    ): void {
        if ($this->isEmpty($value) && $nullable) {
            return;
        }

        if (!is_string($value)) {
            $errors[$path] = 'The value must be a string.';
            return;
        }

        if (Str::length($value) > $max) {
            $errors[
                $path
            ] = "The value must not be greater than $max characters.";
        }

        if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value)) {
            $errors[$path] = 'The value contains unsupported characters.';
        }
    }

    private function color(
        array &$errors,
        string $path,
        mixed $value,
        bool $nullable = false,
    ): void {
        if ($this->isEmpty($value) && $nullable) {
            return;
        }

        if (
            !is_string($value) ||
            !preg_match(
                '/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/',
                $value,
            )
        ) {
            $errors[$path] = 'The value must be a valid hex color.';
        }
    }

    private function validateSection(
        array &$errors,
        string $path,
        mixed $value,
    ): void {
        if ($this->isEmpty($value)) {
            return;
        }

        if (!is_array($value)) {
            $errors[$path] = 'The section config value must be an object.';
            return;
        }

        $this->allowedKeys($errors, $path, $value, self::SECTION_KEYS);
        $this->enum(
            $errors,
            "$path.presentation",
            Arr::get($value, 'presentation'),
            ['contained', 'open'],
            true,
        );
        $this->boolean(
            $errors,
            "$path.showTitle",
            Arr::get($value, 'showTitle'),
            true,
        );
        $this->string(
            $errors,
            "$path.icon",
            Arr::get($value, 'icon'),
            80,
            true,
        );
        $this->string(
            $errors,
            "$path.anchorLabel",
            Arr::get($value, 'anchorLabel'),
            100,
            true,
        );
        $this->string(
            $errors,
            "$path.actionLabel",
            Arr::get($value, 'actionLabel'),
            100,
            true,
        );
        $this->safeUrl(
            $errors,
            "$path.actionUrl",
            Arr::get($value, 'actionUrl'),
            true,
        );
    }

    private function fontFamily(
        array &$errors,
        string $path,
        mixed $value,
    ): void {
        if ($this->isEmpty($value)) {
            return;
        }

        if (
            !is_string($value) ||
            Str::length($value) > 255 ||
            preg_match('/[{};<>]|(?:url|expression|javascript)\s*\(/i', $value)
        ) {
            $errors[$path] =
                'The font family contains unsupported CSS characters.';
        }
    }

    private function fontConfig(
        array &$errors,
        string $path,
        mixed $value,
    ): void {
        if ($this->isEmpty($value)) {
            return;
        }

        if (!is_array($value)) {
            $errors[$path] = 'The font config value must be an object.';
            return;
        }

        $this->allowedKeys($errors, $path, $value, ['family', 'google']);
        $family = $value['family'] ?? null;
        if (
            !is_string($family) ||
            Str::length($family) > 255 ||
            $family === ''
        ) {
            $errors["$path.family"] = 'The font family is invalid.';
        } elseif (
            preg_match('/[{};<>]|(?:url|expression|javascript)\s*\(/i', $family)
        ) {
            $errors["$path.family"] =
                'The font family contains unsupported CSS characters.';
        }

        if (array_key_exists('google', $value) && !is_bool($value['google'])) {
            $errors["$path.google"] = 'The google font value must be boolean.';
        }
    }

    private function boolean(
        array &$errors,
        string $path,
        mixed $value,
        bool $nullable = false,
    ): void {
        if ($this->isEmpty($value) && $nullable) {
            return;
        }

        if (!is_bool($value)) {
            $errors[$path] = 'The value must be boolean.';
        }
    }

    private function integer(
        array &$errors,
        string $path,
        mixed $value,
        int $min,
        int $max,
        bool $nullable = false,
    ): void {
        if ($this->isEmpty($value) && $nullable) {
            return;
        }

        if (
            !is_int($value) &&
            !(is_string($value) && preg_match('/^\d+$/', $value))
        ) {
            $errors[$path] = 'The value must be an integer.';
            return;
        }

        $value = (int) $value;
        if ($value < $min || $value > $max) {
            $errors[$path] = "The value must be between $min and $max.";
        }
    }

    private function price(array &$errors, string $path, mixed $value): void
    {
        if ($this->isEmpty($value)) {
            return;
        }

        if (!is_numeric($value) || $value < 0 || $value > 99999999.99) {
            $errors[$path] = 'The price must be a valid positive amount.';
        }
    }

    private function rating(array &$errors, string $path, mixed $value): void
    {
        if ($this->isEmpty($value)) {
            return;
        }

        if (!is_numeric($value) || $value < 0 || $value > 5) {
            $errors[$path] = 'The rating must be between 0 and 5.';
        }
    }

    private function currency(array &$errors, string $path, mixed $value): void
    {
        if ($this->isEmpty($value)) {
            return;
        }

        if (!is_string($value) || !preg_match('/^[A-Z]{3}$/', $value)) {
            $errors[$path] = 'The currency must be a valid ISO code.';
        }
    }

    private function isoDate(
        array &$errors,
        string $path,
        mixed $value,
    ): void {
        if ($this->isEmpty($value)) {
            return;
        }

        if (
            !is_string($value) ||
            strlen($value) > 40 ||
            strtotime($value) === false
        ) {
            $errors[$path] = 'Enter a valid date and time.';
        }
    }

    private function timezone(
        array &$errors,
        string $path,
        mixed $value,
    ): void {
        if ($this->isEmpty($value)) {
            return;
        }

        if (
            !is_string($value) ||
            !in_array($value, timezone_identifiers_list(), true)
        ) {
            $errors[$path] = 'Select a valid timezone.';
        }
    }

    private function safeUrlOrText(
        array &$errors,
        string $path,
        mixed $value,
    ): void {
        if ($this->isEmpty($value)) {
            return;
        }

        if (!is_string($value) || Str::length($value) > 1000) {
            $errors[$path] = 'The value is invalid.';
            return;
        }

        $lower = Str::lower(trim($value));
        if (
            str_starts_with($lower, 'javascript:') ||
            str_starts_with($lower, 'data:') ||
            str_contains($lower, '<') ||
            preg_match('/[\x00-\x1F\x7F]/', $value)
        ) {
            $errors[$path] = 'The value is not allowed.';
        }
    }

    private function safeImageUrl(
        array &$errors,
        string $path,
        mixed $value,
    ): void {
        $this->safeUrl($errors, $path, $value, true);
    }

    private function safeUrl(
        array &$errors,
        string $path,
        mixed $value,
        bool $nullable = false,
    ): void {
        if ($this->isEmpty($value) && $nullable) {
            return;
        }

        if (!is_string($value) || Str::length($value) > 1000) {
            $errors[$path] = 'The URL is invalid.';
            return;
        }

        $value = trim($value);
        $lower = Str::lower($value);
        if (
            str_starts_with($lower, 'javascript:') ||
            str_starts_with($lower, 'data:') ||
            str_starts_with($lower, '//') ||
            str_contains($lower, '<') ||
            str_contains($lower, '\\') ||
            preg_match('/[\x00-\x1F\x7F]/', $value)
        ) {
            $errors[$path] = 'The URL is not allowed.';
            return;
        }

        if (preg_match('/^[a-z][a-z0-9+.-]*:/i', $value)) {
            if (
                !filter_var($value, FILTER_VALIDATE_URL) ||
                (!str_starts_with($lower, 'http://') &&
                    !str_starts_with($lower, 'https://'))
            ) {
                $errors[$path] = 'The URL is invalid.';
            }

            return;
        }

        if (
            !str_starts_with($value, '/') &&
            !preg_match('/^[A-Za-z0-9._~\/%:@?&=+#,;-]+$/', $value)
        ) {
            $errors[$path] = 'The URL is invalid.';
        }
    }

    private function isEmpty(mixed $value): bool
    {
        return $value === null || $value === '';
    }
}
