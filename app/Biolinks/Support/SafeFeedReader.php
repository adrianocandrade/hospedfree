<?php

namespace App\Biolinks\Support;

use DOMDocument;
use DOMElement;
use DOMXPath;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Throwable;

class SafeFeedReader
{
    private const MAX_BYTES = 1_048_576;
    private const MAX_ITEMS = 12;
    private const CACHE_SECONDS = 600;

    /** @return array{title: string, items: array<int, array{title: string, url: string, summary: string, published_at: string|null}>} */
    public function read(string $url): array
    {
        $url = $this->normalizeYoutubeUrl(trim($url));
        $this->assertSafeUrl($url);

        return Cache::remember(
            'biolink-feed:' . hash('sha256', $url),
            self::CACHE_SECONDS,
            fn() => $this->fetchAndParse($url),
        );
    }

    public function assertSafeUrl(string $url): void
    {
        $parts = parse_url($url);
        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = strtolower(rtrim((string) ($parts['host'] ?? ''), '.'));

        if (
            !in_array($scheme, ['http', 'https'], true) ||
            $host === '' ||
            isset($parts['user']) ||
            isset($parts['pass']) ||
            $host === 'localhost' ||
            str_ends_with($host, '.localhost') ||
            str_ends_with($host, '.local')
        ) {
            throw ValidationException::withMessages([
                'feed' => 'The feed URL is not allowed.',
            ]);
        }

        $this->resolveSafeHost($host);
    }

    /** @return array{title: string, items: array<int, array{title: string, url: string, summary: string, published_at: string|null}>} */
    private function fetchAndParse(string $url): array
    {
        $response = $this->request($url);
        $redirects = 0;

        while ($response->redirect() && $redirects < 3) {
            $location = $response->header('Location');
            if (!$location) {
                break;
            }
            $url = $this->absoluteUrl($url, $location);
            $this->assertSafeUrl($url);
            $response = $this->request($url);
            $redirects++;
        }

        if ($response->redirect() || !$response->successful()) {
            throw ValidationException::withMessages([
                'feed' => 'The feed could not be loaded.',
            ]);
        }

        $contentLength = (int) $response->header('Content-Length');
        $body = $response->body();
        if (
            $contentLength > self::MAX_BYTES ||
            strlen($body) > self::MAX_BYTES
        ) {
            throw ValidationException::withMessages([
                'feed' => 'The feed is larger than the allowed limit.',
            ]);
        }

        return $this->parse($body);
    }

    private function request(string $url): Response
    {
        $parts = parse_url($url);
        $host = (string) ($parts['host'] ?? '');
        $port = (int) ($parts['port'] ?? (($parts['scheme'] ?? '') === 'https' ? 443 : 80));
        // Resolve and validate again immediately before pinning the request.
        // This closes the DNS-rebinding gap between validation and download.
        $addresses = $this->resolveSafeHost($host);
        $curlOptions = [];
        if (defined('CURLOPT_RESOLVE')) {
            $curlOptions[CURLOPT_RESOLVE] = array_map(
                static fn(string $address): string => sprintf(
                    '%s:%d:%s',
                    $host,
                    $port,
                    str_contains($address, ':') ? "[$address]" : $address,
                ),
                $addresses,
            );
        }
        if (defined('CURLOPT_MAXFILESIZE')) {
            $curlOptions[CURLOPT_MAXFILESIZE] = self::MAX_BYTES;
        }

        try {
            return Http::accept('application/rss+xml, application/atom+xml, application/xml, text/xml')
                ->withUserAgent(config('app.name') . '/1.0 feed reader')
                ->connectTimeout(4)
                ->timeout(8)
                ->withOptions([
                    'allow_redirects' => false,
                    'curl' => $curlOptions,
                    'on_headers' => static function (ResponseInterface $response): void {
                        if ((int) $response->getHeaderLine('Content-Length') > self::MAX_BYTES) {
                            throw new \RuntimeException('Feed response is too large.');
                        }
                    },
                    'progress' => static function (
                        int $downloadTotal,
                        int $downloadedBytes,
                    ): void {
                        if (
                            $downloadTotal > self::MAX_BYTES ||
                            $downloadedBytes > self::MAX_BYTES
                        ) {
                            throw new \RuntimeException('Feed response is too large.');
                        }
                    },
                ])
                ->get($url);
        } catch (Throwable) {
            throw ValidationException::withMessages([
                'feed' => 'The feed could not be loaded safely.',
            ]);
        }
    }

    /** @return array{title: string, items: array<int, array{title: string, url: string, summary: string, published_at: string|null}>} */
    public function parse(string $xml): array
    {
        $previous = libxml_use_internal_errors(true);
        $document = new DOMDocument();
        $loaded = $document->loadXML($xml, LIBXML_NONET | LIBXML_NOCDATA);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        if (!$loaded) {
            throw ValidationException::withMessages([
                'feed' => 'The response is not a valid RSS or Atom feed.',
            ]);
        }

        $xpath = new DOMXPath($document);
        $isAtom = strtolower((string) $document->documentElement?->localName) === 'feed';
        $nodes = $xpath->query($isAtom ? '/*[local-name()="feed"]/*[local-name()="entry"]' : '//*[local-name()="channel"]/*[local-name()="item"]');
        $titleNode = $xpath->query($isAtom ? '/*[local-name()="feed"]/*[local-name()="title"]' : '//*[local-name()="channel"]/*[local-name()="title"]')?->item(0);
        $items = [];

        if ($nodes) {
            foreach ($nodes as $node) {
                if (!$node instanceof DOMElement || count($items) >= self::MAX_ITEMS) {
                    break;
                }
                $title = $this->childText($xpath, $node, 'title');
                $summary = $this->childText($xpath, $node, $isAtom ? 'summary' : 'description');
                if ($summary === '' && $isAtom) {
                    $summary = $this->childText($xpath, $node, 'content');
                }
                $published = $this->childText($xpath, $node, $isAtom ? 'published' : 'pubDate');
                if ($published === '' && $isAtom) {
                    $published = $this->childText($xpath, $node, 'updated');
                }
                $link = $isAtom
                    ? $this->atomLink($xpath, $node)
                    : $this->childText($xpath, $node, 'link');

                if ($title === '' || !$this->isSafePublicLink($link)) {
                    continue;
                }

                $items[] = [
                    'title' => $this->cleanText($title, 180),
                    'url' => $link,
                    'summary' => $this->cleanText($summary, 320),
                    'published_at' => $this->normalizeDate($published),
                ];
            }
        }

        return [
            'title' => $this->cleanText((string) ($titleNode?->textContent ?? ''), 180),
            'items' => $items,
        ];
    }

    private function childText(DOMXPath $xpath, DOMElement $node, string $name): string
    {
        return trim((string) ($xpath->query('./*[local-name()="' . $name . '"]', $node)?->item(0)?->textContent ?? ''));
    }

    private function atomLink(DOMXPath $xpath, DOMElement $node): string
    {
        $links = $xpath->query('./*[local-name()="link"]', $node);
        if (!$links) {
            return '';
        }
        foreach ($links as $link) {
            if (
                $link instanceof DOMElement &&
                in_array($link->getAttribute('rel'), ['', 'alternate'], true)
            ) {
                return trim($link->getAttribute('href'));
            }
        }
        return '';
    }

    private function cleanText(string $value, int $limit): string
    {
        $value = preg_replace(
            '#<(script|style)\b[^>]*>.*?</\1>#is',
            ' ',
            $value,
        ) ?? '';
        $value = html_entity_decode(strip_tags($value), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $value = preg_replace('/\s+/u', ' ', $value) ?? '';
        return mb_substr(trim($value), 0, $limit);
    }

    private function normalizeDate(string $value): ?string
    {
        $timestamp = strtotime($value);
        return $timestamp === false ? null : gmdate(DATE_ATOM, $timestamp);
    }

    private function isSafePublicLink(string $value): bool
    {
        if (!filter_var($value, FILTER_VALIDATE_URL)) {
            return false;
        }
        $parts = parse_url($value);
        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = strtolower(rtrim((string) ($parts['host'] ?? ''), '.'));

        if (
            !in_array($scheme, ['http', 'https'], true) ||
            $host === '' ||
            isset($parts['user']) ||
            isset($parts['pass']) ||
            $host === 'localhost' ||
            str_ends_with($host, '.localhost') ||
            str_ends_with($host, '.local')
        ) {
            return false;
        }

        return !filter_var($host, FILTER_VALIDATE_IP) || $this->isPublicAddress($host);
    }

    /** @return list<string> */
    private function resolveHost(string $host): array
    {
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return [$host];
        }

        try {
            $records = @dns_get_record($host, DNS_A | DNS_AAAA);
        } catch (\Throwable) {
            $records = [];
        }
        $addresses = collect($records ?: [])
            ->map(fn(array $record) => $record['ip'] ?? $record['ipv6'] ?? null)
            ->filter(fn(mixed $address) => is_string($address))
            ->unique()
            ->values()
            ->all();

        if (!$addresses) {
            throw ValidationException::withMessages([
                'feed' => 'The feed host could not be resolved.',
            ]);
        }

        return $addresses;
    }

    /** @return list<string> */
    private function resolveSafeHost(string $host): array
    {
        $addresses = $this->resolveHost($host);
        foreach ($addresses as $address) {
            if (!$this->isPublicAddress($address)) {
                throw ValidationException::withMessages([
                    'feed' => 'The feed host resolves to a private or reserved network.',
                ]);
            }
        }

        return $addresses;
    }

    private function isPublicAddress(string $address): bool
    {
        return filter_var(
            $address,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE,
        ) !== false;
    }

    private function normalizeYoutubeUrl(string $url): string
    {
        $parts = parse_url($url);
        $host = strtolower((string) ($parts['host'] ?? ''));
        $path = (string) ($parts['path'] ?? '');
        if (!in_array($host, ['youtube.com', 'www.youtube.com'], true)) {
            return $url;
        }

        if (preg_match('#^/channel/([A-Za-z0-9_-]+)#', $path, $matches)) {
            return 'https://www.youtube.com/feeds/videos.xml?channel_id=' . rawurlencode($matches[1]);
        }

        parse_str((string) ($parts['query'] ?? ''), $query);
        if ($path === '/playlist' && isset($query['list'])) {
            return 'https://www.youtube.com/feeds/videos.xml?playlist_id=' . rawurlencode((string) $query['list']);
        }

        return $url;
    }

    private function absoluteUrl(string $base, string $location): string
    {
        if (preg_match('#^https?://#i', $location)) {
            return $location;
        }
        $parts = parse_url($base);
        $origin = ($parts['scheme'] ?? 'https') . '://' . ($parts['host'] ?? '');
        if (isset($parts['port'])) {
            $origin .= ':' . $parts['port'];
        }
        if (str_starts_with($location, '/')) {
            return $origin . $location;
        }
        $directory = trim(dirname((string) ($parts['path'] ?? '/')), '/\\.');
        return $origin . ($directory !== '' ? "/$directory" : '') . '/' . ltrim($location, '/');
    }
}
