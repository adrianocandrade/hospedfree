<?php

namespace Tests\Unit;

use App\Biolinks\Actions\GetBiolinkProductImportPreview;
use App\Biolinks\Support\BiolinkProductMetadataParser;
use App\Links\Actions\FetchSafeRemoteHtml;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class BiolinkProductImportPreviewTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_it_preserves_the_submitted_affiliate_url_and_caches_the_snapshot(): void
    {
        $fetcher = new class extends FetchSafeRemoteHtml {
            public int $requests = 0;

            public function inspectUrl(string $url): ?array
            {
                return [
                    'host' => 'example.com',
                    'port' => 443,
                    'ips' => ['93.184.216.34'],
                ];
            }

            public function execute(
                string $url,
                int $maxBytes = self::DEFAULT_MAX_BYTES,
            ): array {
                $this->requests++;

                return [
                    'ok' => true,
                    'reason' => 'ok',
                    'final_url' => 'https://example.com/product',
                    'content_type' => 'text/html',
                    'body' =>
                        '<script type="application/ld+json">' .
                        '{"@type":"Product","name":"Camera",' .
                        '"offers":{"@type":"Offer","price":"99.90","priceCurrency":"BRL"}}' .
                        '</script>',
                ];
            }
        };
        $action = new GetBiolinkProductImportPreview(
            $fetcher,
            new BiolinkProductMetadataParser(),
        );
        $url =
            'https://example.com/product?tag=partner%2F42&utm_source=biolink';

        $first = $action->execute($url);
        $second = $action->execute($url);

        $this->assertSame($url, $first['product']['url']);
        $this->assertSame($first, $second);
        $this->assertSame(1, $fetcher->requests);
    }

    public function test_it_rejects_private_urls_before_requesting_them(): void
    {
        $action = new GetBiolinkProductImportPreview(
            new FetchSafeRemoteHtml(),
            new BiolinkProductMetadataParser(),
        );

        $this->expectException(ValidationException::class);
        $action->execute('http://127.0.0.1/private-product');
    }

    public function test_it_returns_an_editable_manual_fallback_for_a_captcha_page(): void
    {
        $fetcher = new class extends FetchSafeRemoteHtml {
            public function inspectUrl(string $url): ?array
            {
                return [
                    'host' => 'example.com',
                    'port' => 443,
                    'ips' => ['93.184.216.34'],
                ];
            }

            public function execute(
                string $url,
                int $maxBytes = self::DEFAULT_MAX_BYTES,
            ): array {
                return [
                    'ok' => true,
                    'reason' => 'ok',
                    'final_url' => $url,
                    'content_type' => 'text/html',
                    'body' =>
                        '<html><title>Just a moment...</title>' .
                        '<div class="cf-chl-widget">Verify you are human</div></html>',
                ];
            }
        };
        $action = new GetBiolinkProductImportPreview(
            $fetcher,
            new BiolinkProductMetadataParser(),
        );
        $url = 'https://example.com/protected-product?affiliate=42';

        $preview = $action->execute($url);

        $this->assertSame('bot_protected', $preview['warnings'][0]['code']);
        $this->assertSame($url, $preview['product']['url']);
        $this->assertNull($preview['product']['name']);
    }
}
