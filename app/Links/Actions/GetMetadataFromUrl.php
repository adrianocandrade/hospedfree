<?php

namespace App\Links\Actions;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Symfony\Component\DomCrawler\Crawler;

class GetMetadataFromUrl
{
    public function execute(string $url): array
    {
        $normalizedUrl = self::normalizeUrl($url);
        if (!$this->isSafeRemoteUrl($normalizedUrl)) {
            return [];
        }

        $parsed = parse_url($normalizedUrl);
        $default = [
            'name' => $parsed['host'] ?? null,
            'description' => null,
            'image' => null,
        ];

        $oEmbedMetadata = $this->getOEmbedMetadata($normalizedUrl);
        $htmlMetadata = $this->getHtmlMetadata($normalizedUrl, $default);

        if (!$oEmbedMetadata && !$htmlMetadata) {
            return [];
        }

        $image =
            $oEmbedMetadata['image'] ??
            ($htmlMetadata['image'] ?? $default['image']);

        return [
            'name' => $this->limitNullableString(
                $oEmbedMetadata['name'] ??
                    ($htmlMetadata['name'] ?? $default['name']),
                100,
            ),
            'description' => $this->limitNullableString(
                $oEmbedMetadata['description'] ??
                    ($htmlMetadata['description'] ?? $default['description']),
                190,
            ),
            'image' => $this->absoluteHttpUrl($image, $normalizedUrl),
        ];
    }

    private function getHtmlMetadata(
        string $normalizedUrl,
        array $default,
    ): ?array {
        $document = app(FetchSafeRemoteHtml::class)->execute($normalizedUrl);
        $content = $document['ok'] ? $document['body'] : null;
        if (!$content) {
            return null;
        }

        $crawler = new Crawler($content);
        $title =
            head(
                $crawler
                    ->filter('meta[property="og:title"]')
                    ->extract(['content']),
            ) ?:
            head(
                $crawler
                    ->filter('meta[name="twitter:title"]')
                    ->extract(['content']),
            ) ?:
            head($crawler->filter('title')->extract(['_text']));
        $description =
            head(
                $crawler
                    ->filter('meta[property="og:description"]')
                    ->extract(['content']),
            ) ?:
            head(
                $crawler
                    ->filter('meta[name="twitter:description"]')
                    ->extract(['content']),
            ) ?:
            head(
                $crawler
                    ->filter('meta[name="description"]')
                    ->extract(['content']),
            );
        $image = $this->getImageFromMetaTags($crawler);

        return [
            'name' => Str::limit($title ? trim($title) : $default['name'], 100),
            'description' => $description
                ? Str::limit(trim($description), 190)
                : null,
            'image' => $image ?: null,
        ];
    }

    private function getOEmbedMetadata(string $normalizedUrl): ?array
    {
        $request = $this->oEmbedRequest($normalizedUrl);
        if (!$request) {
            return null;
        }

        try {
            $response = Http::timeout(5)
                ->acceptJson()
                ->withUserAgent($this->getUserAgent())
                ->get($request['endpoint'], $request['params']);
        } catch (\Exception) {
            return null;
        }

        if (!$response->successful()) {
            return null;
        }

        $data = $response->json();
        if (!is_array($data)) {
            return null;
        }

        $title = $this->stringFromArray($data, 'title');
        $description =
            $this->stringFromArray($data, 'description') ?:
            $this->stringFromArray($data, 'author_name');
        $thumbnail = $this->stringFromArray($data, 'thumbnail_url');

        if (!$title && !$description && !$thumbnail) {
            return null;
        }

        return [
            'name' => $this->limitNullableString($title, 100),
            'description' => $this->limitNullableString($description, 190),
            'image' => $thumbnail,
        ];
    }

    private function oEmbedRequest(string $normalizedUrl): ?array
    {
        $host = Str::lower((string) parse_url($normalizedUrl, PHP_URL_HOST));
        $host = Str::of($host)->remove('www.')->toString();

        if (in_array($host, ['open.spotify.com', 'spotify.link'], true)) {
            return [
                'endpoint' =>
                    $host === 'spotify.link'
                        ? 'https://spotify.link/oembed'
                        : 'https://open.spotify.com/oembed',
                'params' => ['url' => $normalizedUrl],
            ];
        }

        if (
            $host === 'soundcloud.com' ||
            Str::endsWith($host, '.soundcloud.com')
        ) {
            return [
                'endpoint' => 'https://soundcloud.com/oembed',
                'params' => ['format' => 'json', 'url' => $normalizedUrl],
            ];
        }

        if (
            in_array(
                $host,
                ['youtube.com', 'youtu.be', 'music.youtube.com'],
                true,
            ) ||
            Str::endsWith($host, '.youtube.com')
        ) {
            return [
                'endpoint' => 'https://www.youtube.com/oembed',
                'params' => ['format' => 'json', 'url' => $normalizedUrl],
            ];
        }

        if ($host === 'tiktok.com' || Str::endsWith($host, '.tiktok.com')) {
            return [
                'endpoint' => 'https://www.tiktok.com/oembed',
                'params' => ['url' => $normalizedUrl],
            ];
        }

        return null;
    }

    public static function normalizeUrl(string $url): string
    {
        // make sure there are no more than 2 slashes in the URL
        $url = preg_replace('/\/{3,}/', '//', $url);
        $url = trim($url, '/');

        $scheme = parse_url($url, PHP_URL_SCHEME);
        $url = !$scheme ? "https://$url" : $url;

        $parsedUrl = parse_url($url);
        if (!is_array($parsedUrl) || empty($parsedUrl['host'])) {
            return $url;
        }

        if (!mb_check_encoding((string) $parsedUrl['host'], 'ASCII')) {
            $asciiHost = idn_to_ascii(
                $parsedUrl['host'],
                0,
                INTL_IDNA_VARIANT_UTS46,
            );
            if ($asciiHost) {
                $url = str_replace($parsedUrl['host'], $asciiHost, $url);
            }
        }

        return $url;
    }

    protected function shouldDownloadUrlContent(string $url): bool
    {
        return app(FetchSafeRemoteHtml::class)->inspectUrl($url) !== null;
    }

    protected function getImageFromMetaTags(Crawler $crawler): ?string
    {
        $tags = [
            [
                'tagName' => 'meta[property="og:image"]',
                'attributeName' => 'content',
            ],
            [
                'tagName' => 'meta[property="og:image:secure_url"]',
                'attributeName' => 'content',
            ],
            [
                'tagName' => 'meta[name="twitter:image"]',
                'attributeName' => 'content',
            ],
            [
                'tagName' => 'meta[name="twitter:image:src"]',
                'attributeName' => 'content',
            ],
            [
                'tagName' => 'link[rel="apple-touch-icon"]',
                'attributeName' => 'href',
            ],
            [
                'tagName' => 'link[rel="apple-touch-icon-precomposed"]',
                'attributeName' => 'href',
            ],
            ['tagName' => 'link[rel="mask-icon"]', 'attributeName' => 'href'],
            ['tagName' => 'link[rel="fluid-icon"]', 'attributeName' => 'href'],
            ['tagName' => 'link[rel="icon"]', 'attributeName' => 'href'],
            [
                'tagName' => 'link[rel="shortcut icon"]',
                'attributeName' => 'href',
            ],
        ];
        $image = null;

        foreach ($tags as $tag) {
            $image = head(
                $crawler
                    ->filter($tag['tagName'])
                    ->extract([$tag['attributeName']]),
            );
            if ($image) {
                break;
            }
        }

        if (is_string($image) && strlen($image) < 1000) {
            return $image;
        }

        return null;
    }

    private function stringFromArray(array $data, string $key): ?string
    {
        $value = Arr::get($data, $key);

        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value !== '' ? $value : null;
    }

    private function limitNullableString(?string $value, int $limit): ?string
    {
        return $value ? Str::limit(trim($value), $limit) : null;
    }

    protected function getUserAgent(): string
    {
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36';
    }

    protected function isSafeRemoteUrl(string $url): bool
    {
        return app(FetchSafeRemoteHtml::class)->inspectUrl($url) !== null;
    }

    private function absoluteHttpUrl(mixed $value, string $baseUrl): ?string
    {
        if (!is_string($value) || $value === '') {
            return null;
        }

        $value = trim($value);
        if (Str::startsWith($value, '//')) {
            $value = 'https:' . $value;
        } elseif (!preg_match('/^https?:\/\//i', $value)) {
            $base = parse_url($baseUrl);
            if (!is_array($base) || empty($base['host'])) {
                return null;
            }

            $origin =
                ($base['scheme'] ?? 'https') .
                '://' .
                $base['host'] .
                (isset($base['port']) ? ':' . $base['port'] : '');

            if (Str::startsWith($value, '/')) {
                $value = $origin . $value;
            } else {
                $path = (string) ($base['path'] ?? '/');
                $directory = rtrim(str_replace('\\', '/', dirname($path)), '/');
                $value =
                    $origin .
                    ($directory === '' || $directory === '.'
                        ? '/'
                        : $directory . '/') .
                    $value;
            }
        }

        if (
            Str::length($value) > 1000 ||
            !filter_var($value, FILTER_VALIDATE_URL)
        ) {
            return null;
        }

        return $value;
    }
}
