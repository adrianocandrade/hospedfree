<?php

namespace App\Biolinks\Actions;

use App\Biolinks\Support\BiolinkProductMetadataParser;
use App\Links\Actions\FetchSafeRemoteHtml;
use App\Links\Actions\GetMetadataFromUrl;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class GetBiolinkProductImportPreview
{
    public function __construct(
        private readonly FetchSafeRemoteHtml $fetcher,
        private readonly BiolinkProductMetadataParser $parser,
    ) {}

    public function execute(string $url): array
    {
        $submittedUrl = trim($url);
        $normalizedUrl = GetMetadataFromUrl::normalizeUrl($submittedUrl);

        if ($this->fetcher->inspectUrl($normalizedUrl) === null) {
            throw ValidationException::withMessages([
                'url' => __('The product URL must point to a public website.'),
            ]);
        }

        return Cache::remember(
            'biolink-product-import:' .
                hash('sha256', app()->getLocale() . '|' . $submittedUrl),
            now()->addMinutes(15),
            fn() => $this->retrieve($submittedUrl, $normalizedUrl),
        );
    }

    private function retrieve(
        string $submittedUrl,
        string $normalizedUrl,
    ): array {
        $document = $this->fetcher->execute($normalizedUrl);
        if (!$document['ok']) {
            if ($document['reason'] === 'unsafe') {
                throw ValidationException::withMessages([
                    'url' => __(
                        'The product URL redirected to an unsafe address.',
                    ),
                ]);
            }

            return $this->emptyPreview(
                $submittedUrl,
                $normalizedUrl,
                $document['reason'] === 'blocked'
                    ? 'bot_protected'
                    : 'metadata_unavailable',
            );
        }

        if ($this->looksBotProtected($document['body'] ?? '')) {
            return $this->emptyPreview(
                $submittedUrl,
                $document['final_url'],
                'bot_protected',
            );
        }

        try {
            $parsed = $this->parser->parse(
                $document['body'] ?? '',
                $document['final_url'],
            );
        } catch (\Throwable) {
            return $this->emptyPreview(
                $submittedUrl,
                $document['final_url'],
                'metadata_unavailable',
            );
        }

        $product = [...$parsed['product'], 'url' => $submittedUrl];
        $missingFields = $this->missingFields($product);
        $hasMetadata = collect($product)
            ->except(['url'])
            ->contains(fn(mixed $value) => $value !== null && $value !== '');
        $warnings = [];

        if (!$hasMetadata) {
            $warnings[] = $this->warning('metadata_unavailable');
        } else {
            if ($product['price'] === null) {
                $warnings[] = $this->warning('price_missing');
            }
            if ($product['image'] === null) {
                $warnings[] = $this->warning('image_missing');
            }
            if ($missingFields !== []) {
                $warnings[] = $this->warning('partial_data');
            }
        }

        return [
            'provider' => $parsed['provider'],
            'domain' => $this->domain($document['final_url']),
            'retrieved_at' => now()->toIso8601String(),
            'product' => $product,
            'missing_fields' => $missingFields,
            'warnings' => $warnings,
        ];
    }

    private function emptyPreview(
        string $submittedUrl,
        string $retrievedUrl,
        string $warningCode,
    ): array {
        return [
            'provider' => $this->parser->detectProvider($retrievedUrl),
            'domain' => $this->domain($retrievedUrl),
            'retrieved_at' => now()->toIso8601String(),
            'product' => [
                'name' => null,
                'description' => null,
                'image' => null,
                'price' => null,
                'compare_price' => null,
                'currency' => null,
                'rating' => null,
                'stock_label' => null,
                'url' => $submittedUrl,
            ],
            'missing_fields' => [
                'name',
                'description',
                'image',
                'price',
                'currency',
            ],
            'warnings' => [$this->warning($warningCode)],
        ];
    }

    private function missingFields(array $product): array
    {
        return array_values(
            array_filter(
                ['name', 'description', 'image', 'price', 'currency'],
                fn(string $field) => ($product[$field] ?? null) === null ||
                    $product[$field] === '',
            ),
        );
    }

    private function warning(string $code): array
    {
        return [
            'code' => $code,
            'message' => match ($code) {
                'partial_data' => __(
                    'Some product details were not published by this website.',
                ),
                'price_missing' => __(
                    'The website did not publish a product price.',
                ),
                'image_missing' => __(
                    'The website did not publish a product image.',
                ),
                'bot_protected' => __(
                    'This website blocked the preview request. Continue with manual registration.',
                ),
                default => __(
                    'Product metadata is not available. Continue with manual registration.',
                ),
            },
        ];
    }

    private function domain(string $url): string
    {
        return Str::lower(
            Str::remove(
                'www.',
                rtrim((string) parse_url($url, PHP_URL_HOST), '.'),
            ),
        );
    }

    private function looksBotProtected(string $html): bool
    {
        $html = Str::lower(Str::limit($html, 200000, ''));

        return Str::contains($html, [
            'cf-chl-',
            'g-recaptcha',
            'hcaptcha',
            'captcha-container',
            '<title>just a moment',
            '<title>robot check',
            'verify you are human',
            'complete the security check',
        ]);
    }
}
