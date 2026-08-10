<?php

namespace App\Biolinks\Support;

use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Symfony\Component\DomCrawler\Crawler;

class BiolinkProductMetadataParser
{
    private const MAX_JSON_LD_NODES = 250;

    /**
     * @return array{
     *   provider: string,
     *   product: array{
     *     name: string|null,
     *     description: string|null,
     *     image: string|null,
     *     price: float|null,
     *     compare_price: float|null,
     *     currency: string|null,
     *     rating: float|null,
     *     stock_label: string|null
     *   }
     * }
     */
    public function parse(string $html, string $finalUrl): array
    {
        $crawler = new Crawler($html);
        $nodes = $this->jsonLdNodes($crawler);
        $productNode = $this->bestProductNode($nodes);
        $offer = $this->bestOffer($productNode, $nodes);

        $price = $this->priceFromOffer($offer);
        $comparePrice = $this->comparePrice($productNode, $offer, $price);
        $rating = $this->rating($productNode);

        $name = $this->cleanText(
            $this->scalar($productNode['name'] ?? null) ??
                ($this->meta($crawler, [
                    'meta[property="product:title"]',
                    'meta[property="og:title"]',
                    'meta[name="twitter:title"]',
                ]) ??
                    $this->firstText($crawler, 'title')),
            160,
        );
        $description = $this->cleanText(
            $this->scalar($productNode['description'] ?? null) ??
                $this->meta($crawler, [
                    'meta[property="product:description"]',
                    'meta[property="og:description"]',
                    'meta[name="description"]',
                    'meta[name="twitter:description"]',
                ]),
            2000,
        );
        $image = $this->image(
            $productNode['image'] ?? null,
            $crawler,
            $finalUrl,
        );
        $currency =
            $this->currency($offer) ?? $this->currencyFromMeta($crawler);
        $price ??= $this->number(
            $this->meta($crawler, [
                'meta[property="product:price:amount"]',
                'meta[property="og:price:amount"]',
                'meta[itemprop="price"]',
            ]),
        );
        $comparePrice ??= $this->comparePriceFromMeta($crawler, $price);

        return [
            'provider' => $this->detectProvider($finalUrl, $html),
            'product' => [
                'name' => $name,
                'description' => $description,
                'image' => $image,
                'price' => $price,
                'compare_price' => $comparePrice,
                'currency' => $currency,
                'rating' => $rating,
                'stock_label' => $this->stockLabel(
                    $this->scalar($offer['availability'] ?? null) ??
                        $this->meta($crawler, [
                            'meta[property="product:availability"]',
                            'meta[itemprop="availability"]',
                        ]),
                ),
            ],
        ];
    }

    public function detectProvider(string $url, string $html = ''): string
    {
        $host = Str::lower(rtrim((string) parse_url($url, PHP_URL_HOST), '.'));
        $host = Str::remove('www.', $host);

        if (
            $this->hostMatches($host, [
                'mercadolivre.com.br',
                'mercadolibre.com',
                'mercadolibre.com.ar',
                'mercadolibre.com.mx',
                'meli.la',
            ])
        ) {
            return 'mercado_livre';
        }
        if (
            $this->hostMatches($host, [
                'shopee.com.br',
                'shopee.com',
                'shope.ee',
            ])
        ) {
            return 'shopee';
        }
        if (
            $this->hostMatches($host, [
                'amazon.com.br',
                'amazon.com',
                'amzn.to',
                'amzn.eu',
            ])
        ) {
            return 'amazon';
        }
        if (
            $this->hostMatches($host, [
                'aliexpress.com',
                'aliexpress.us',
                's.click.aliexpress.com',
            ])
        ) {
            return 'aliexpress';
        }
        if (
            $this->hostMatches($host, [
                'magazineluiza.com.br',
                'magalu.com',
                'maga.lu',
            ])
        ) {
            return 'magalu';
        }
        if ($this->hostMatches($host, ['shein.com', 'shein.com.br'])) {
            return 'shein';
        }
        if (
            $this->hostMatches($host, [
                'shop.tiktok.com',
                'tiktokshop.com',
                'seller-br.tiktok.com',
            ])
        ) {
            return 'tiktok_shop';
        }
        if ($this->hostMatches($host, ['temu.com'])) {
            return 'temu';
        }

        $html = Str::lower($html);
        if (
            str_contains($html, 'cdn.shopify.com') ||
            str_contains($html, 'shopify-section') ||
            str_contains($html, 'shopify.theme')
        ) {
            return 'shopify';
        }
        if (
            str_contains($html, 'woocommerce') ||
            str_contains($html, 'wp-content/plugins/woocommerce')
        ) {
            return 'woocommerce';
        }

        return 'generic';
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function jsonLdNodes(Crawler $crawler): array
    {
        $nodes = [];
        $crawler
            ->filter('script[type="application/ld+json"]')
            ->each(function (Crawler $script) use (&$nodes): void {
                if (count($nodes) >= self::MAX_JSON_LD_NODES) {
                    return;
                }

                $raw = trim($script->text('', false));
                if ($raw === '') {
                    return;
                }

                $decoded = json_decode(
                    html_entity_decode($raw, ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                    true,
                );
                if (!is_array($decoded)) {
                    return;
                }

                $this->collectNodes($decoded, $nodes);
            });

        return array_slice($nodes, 0, self::MAX_JSON_LD_NODES);
    }

    /**
     * @param array<mixed> $value
     * @param list<array<string, mixed>> $nodes
     */
    private function collectNodes(array $value, array &$nodes): void
    {
        if (count($nodes) >= self::MAX_JSON_LD_NODES) {
            return;
        }

        if (!array_is_list($value)) {
            $nodes[] = $value;
        }

        foreach ($value as $child) {
            if (is_array($child)) {
                $this->collectNodes($child, $nodes);
            }
        }
    }

    /**
     * @param list<array<string, mixed>> $nodes
     * @return array<string, mixed>
     */
    private function bestProductNode(array $nodes): array
    {
        $products = array_values(
            array_filter(
                $nodes,
                fn(array $node) => $this->hasType($node, [
                    'Product',
                    'ProductGroup',
                ]),
            ),
        );
        if ($products === []) {
            return [];
        }

        usort(
            $products,
            fn(array $left, array $right) => $this->productScore($right) <=>
                $this->productScore($left),
        );
        $product = $products[0];

        if ($this->hasType($product, ['ProductGroup'])) {
            $variant = Arr::first(
                $this->objectList($product['hasVariant'] ?? []),
                fn(mixed $item) => is_array($item),
            );
            if (is_array($variant)) {
                $product = array_replace_recursive($product, $variant);
            }
        }

        return $product;
    }

    /**
     * @param array<string, mixed> $node
     */
    private function productScore(array $node): int
    {
        return (isset($node['name']) ? 2 : 0) +
            (isset($node['offers']) ? 4 : 0) +
            (isset($node['hasVariant']) ? 5 : 0) +
            (isset($node['image']) ? 2 : 0) +
            (isset($node['description']) ? 1 : 0) +
            (isset($node['aggregateRating']) ? 1 : 0);
    }

    /**
     * @param array<string, mixed> $product
     * @return array<string, mixed>
     */
    private function bestOffer(array $product, array $nodes): array
    {
        $offers = $this->objectList($product['offers'] ?? []);
        $offers = array_map(function (array $offer) use ($nodes): array {
            $reference = $this->scalar($offer['@id'] ?? null);
            if (!$reference) {
                return $offer;
            }

            return Arr::first(
                $nodes,
                fn(array $node) => ($node['@id'] ?? null) === $reference,
            ) ?? $offer;
        }, $offers);
        foreach ($offers as $offer) {
            if (
                is_array($offer) &&
                $this->number($offer['price'] ?? null) !== null
            ) {
                return $offer;
            }
        }
        foreach ($offers as $offer) {
            if (
                is_array($offer) &&
                $this->number($offer['lowPrice'] ?? null) !== null
            ) {
                return $offer;
            }
        }

        return is_array($offers[0] ?? null) ? $offers[0] : [];
    }

    /**
     * @param array<string, mixed> $offer
     */
    private function priceFromOffer(array $offer): ?float
    {
        $price = $this->number($offer['price'] ?? null);
        if ($price !== null) {
            return $price;
        }

        $specifications = $this->objectList($offer['priceSpecification'] ?? []);
        foreach ($specifications as $specification) {
            if (!is_array($specification)) {
                continue;
            }
            $price = $this->number($specification['price'] ?? null);
            $priceType = Str::lower(
                $this->scalar($specification['priceType'] ?? null) ?? '',
            );
            if (
                $price !== null &&
                !Str::contains($priceType, [
                    'list',
                    'regular',
                    'original',
                    'strikethrough',
                ])
            ) {
                return $price;
            }
        }

        return $this->number($offer['lowPrice'] ?? null);
    }

    /**
     * @param array<string, mixed> $product
     * @param array<string, mixed> $offer
     */
    private function comparePrice(
        array $product,
        array $offer,
        ?float $price,
    ): ?float {
        if ($price === null) {
            return null;
        }

        $values = [];
        foreach (
            [
                'comparePrice',
                'compareAtPrice',
                'listPrice',
                'regularPrice',
                'originalPrice',
                'wasPrice',
            ]
            as $key
        ) {
            $values[] = $this->number($offer[$key] ?? null);
            $values[] = $this->number($product[$key] ?? null);
        }

        foreach (
            $this->objectList($offer['priceSpecification'] ?? [])
            as $specification
        ) {
            if (!is_array($specification)) {
                continue;
            }
            $priceType = Str::lower(
                $this->scalar($specification['priceType'] ?? null) ?? '',
            );
            if (
                Str::contains($priceType, [
                    'list',
                    'regular',
                    'original',
                    'strikethrough',
                ])
            ) {
                $values[] = $this->number($specification['price'] ?? null);
            }
        }

        $values = array_values(
            array_filter(
                $values,
                fn(?float $value) => $value !== null && $value > $price,
            ),
        );

        return $values === [] ? null : min($values);
    }

    private function comparePriceFromMeta(
        Crawler $crawler,
        ?float $price,
    ): ?float {
        if ($price === null) {
            return null;
        }

        $comparePrice = $this->number(
            $this->meta($crawler, [
                'meta[property="product:original_price:amount"]',
                'meta[property="product:price:original"]',
                'meta[property="product:price:regular"]',
                'meta[itemprop="originalPrice"]',
            ]),
        );

        return $comparePrice !== null && $comparePrice > $price
            ? $comparePrice
            : null;
    }

    /**
     * @param array<string, mixed> $product
     */
    private function rating(array $product): ?float
    {
        $aggregate = $product['aggregateRating'] ?? null;
        if (!is_array($aggregate)) {
            return null;
        }

        $value = $this->number($aggregate['ratingValue'] ?? null);
        $best = $this->number($aggregate['bestRating'] ?? null) ?? 5.0;
        if ($value === null || $best <= 0) {
            return null;
        }

        return round(max(0, min(5, ($value / $best) * 5)), 1);
    }

    /**
     * @param array<string, mixed> $offer
     */
    private function currency(array $offer): ?string
    {
        $currency = $this->scalar($offer['priceCurrency'] ?? null);
        if (!$currency) {
            foreach (
                $this->objectList($offer['priceSpecification'] ?? [])
                as $specification
            ) {
                if (is_array($specification)) {
                    $currency = $this->scalar(
                        $specification['priceCurrency'] ?? null,
                    );
                    if ($currency) {
                        break;
                    }
                }
            }
        }

        $currency = Str::upper(trim((string) $currency));

        return preg_match('/^[A-Z]{3}$/', $currency) ? $currency : null;
    }

    private function currencyFromMeta(Crawler $crawler): ?string
    {
        $currency = Str::upper(
            (string) $this->meta($crawler, [
                'meta[property="product:price:currency"]',
                'meta[property="og:price:currency"]',
                'meta[itemprop="priceCurrency"]',
            ]),
        );

        return preg_match('/^[A-Z]{3}$/', $currency) ? $currency : null;
    }

    private function stockLabel(?string $availability): ?string
    {
        if (!$availability) {
            return null;
        }

        $key = Str::lower(Str::afterLast($availability, '/'));

        return match ($key) {
            'instock' => __('In stock'),
            'outofstock' => __('Out of stock'),
            'soldout' => __('Sold out'),
            'preorder' => __('Pre-order'),
            'backorder' => __('Backorder'),
            'limitedavailability' => __('Limited availability'),
            'onlineonly' => __('Available online'),
            'discontinued' => __('Discontinued'),
            default => $this->cleanText($availability, 80),
        };
    }

    private function image(
        mixed $value,
        Crawler $crawler,
        string $baseUrl,
    ): ?string {
        $candidates = [];
        $this->collectImageCandidates($value, $candidates);
        foreach (
            [
                'meta[property="product:image"]',
                'meta[property="og:image:secure_url"]',
                'meta[property="og:image"]',
                'meta[name="twitter:image"]',
            ]
            as $selector
        ) {
            $candidate = $this->meta($crawler, [$selector]);
            if ($candidate) {
                $candidates[] = $candidate;
            }
        }

        foreach ($candidates as $candidate) {
            $url = $this->absoluteUrl($candidate, $baseUrl);
            if ($url && $this->isSafeImageUrl($url)) {
                return $url;
            }
        }

        return null;
    }

    /**
     * @param list<string> $candidates
     */
    private function collectImageCandidates(
        mixed $value,
        array &$candidates,
    ): void {
        if (is_string($value)) {
            $candidates[] = $value;

            return;
        }
        if (!is_array($value)) {
            return;
        }
        if (isset($value['url']) || isset($value['contentUrl'])) {
            $this->collectImageCandidates(
                $value['url'] ?? $value['contentUrl'],
                $candidates,
            );

            return;
        }
        foreach ($value as $item) {
            $this->collectImageCandidates($item, $candidates);
        }
    }

    private function meta(Crawler $crawler, array $selectors): ?string
    {
        foreach ($selectors as $selector) {
            if (!$crawler->filter($selector)->count()) {
                continue;
            }
            $value = trim(
                (string) $crawler->filter($selector)->first()->attr('content'),
            );
            if ($value !== '') {
                return $value;
            }
        }

        return null;
    }

    private function firstText(Crawler $crawler, string $selector): ?string
    {
        return $crawler->filter($selector)->count()
            ? trim($crawler->filter($selector)->first()->text(''))
            : null;
    }

    private function scalar(mixed $value): ?string
    {
        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }

        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }

    private function number(mixed $value): ?float
    {
        if (is_array($value)) {
            $value = $value['value'] ?? null;
        }
        if (is_int($value) || is_float($value)) {
            return is_finite((float) $value) && $value >= 0
                ? round((float) $value, 2)
                : null;
        }
        if (!is_string($value)) {
            return null;
        }

        $value = trim(preg_replace('/[^\d,.\-]/u', '', $value) ?? '');
        if ($value === '') {
            return null;
        }
        if (str_contains($value, ',') && str_contains($value, '.')) {
            $lastComma = strrpos($value, ',');
            $lastDot = strrpos($value, '.');
            $value =
                $lastComma > $lastDot
                    ? str_replace(['.', ','], ['', '.'], $value)
                    : str_replace(',', '', $value);
        } elseif (str_contains($value, ',')) {
            $value = str_replace(',', '.', $value);
        }

        if (!is_numeric($value)) {
            return null;
        }
        $number = (float) $value;

        return is_finite($number) && $number >= 0 ? round($number, 2) : null;
    }

    private function cleanText(?string $value, int $limit): ?string
    {
        if (!$value) {
            return null;
        }

        $value = html_entity_decode(
            strip_tags($value),
            ENT_QUOTES | ENT_HTML5,
            'UTF-8',
        );
        $value = trim(preg_replace('/\s+/u', ' ', $value) ?? '');

        return $value === '' ? null : Str::limit($value, $limit, '');
    }

    private function absoluteUrl(string $value, string $baseUrl): ?string
    {
        $value = trim($value);
        if ($value === '' || Str::length($value) > 2048) {
            return null;
        }
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
            $value = Str::startsWith($value, '/')
                ? $origin . $value
                : $origin .
                    '/' .
                    ltrim(
                        rtrim(dirname((string) ($base['path'] ?? '/')), '/') .
                            '/' .
                            $value,
                        '/',
                    );
        }

        return filter_var($value, FILTER_VALIDATE_URL) ? $value : null;
    }

    private function isSafeImageUrl(string $url): bool
    {
        $parts = parse_url($url);
        if (
            !is_array($parts) ||
            !in_array(
                Str::lower((string) ($parts['scheme'] ?? '')),
                ['http', 'https'],
                true,
            ) ||
            empty($parts['host']) ||
            isset($parts['user']) ||
            isset($parts['pass'])
        ) {
            return false;
        }

        $host = Str::lower(rtrim((string) $parts['host'], '.'));
        if (
            $host === 'localhost' ||
            Str::endsWith($host, [
                '.localhost',
                '.local',
                '.internal',
                '.test',
                '.invalid',
            ])
        ) {
            return false;
        }

        return !filter_var($host, FILTER_VALIDATE_IP) ||
            filter_var(
                $host,
                FILTER_VALIDATE_IP,
                FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE,
            ) !== false;
    }

    /**
     * @param array<string, mixed> $node
     * @param list<string> $types
     */
    private function hasType(array $node, array $types): bool
    {
        $nodeTypes = array_map(
            fn(mixed $type) => Str::lower((string) $type),
            Arr::wrap($node['@type'] ?? []),
        );

        return collect($types)->contains(
            fn(string $type) => in_array(Str::lower($type), $nodeTypes, true),
        );
    }

    /**
     * @param list<string> $domains
     */
    private function hostMatches(string $host, array $domains): bool
    {
        foreach ($domains as $domain) {
            if ($host === $domain || Str::endsWith($host, ".$domain")) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function objectList(mixed $value): array
    {
        if (!is_array($value)) {
            return [];
        }

        return array_is_list($value)
            ? array_values(array_filter($value, 'is_array'))
            : [$value];
    }
}
