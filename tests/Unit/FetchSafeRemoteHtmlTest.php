<?php

namespace Tests\Unit;

use App\Links\Actions\FetchSafeRemoteHtml;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FetchSafeRemoteHtmlTest extends TestCase
{
    public function test_it_blocks_local_private_and_credentialed_urls(): void
    {
        $fetcher = new FetchSafeRemoteHtml();

        $this->assertNull($fetcher->inspectUrl('http://localhost/secret'));
        $this->assertNull($fetcher->inspectUrl('http://127.0.0.1/secret'));
        $this->assertNull($fetcher->inspectUrl('http://10.0.0.1/secret'));
        $this->assertNull(
            $fetcher->inspectUrl('https://user:password@example.com/secret'),
        );
    }

    public function test_it_blocks_a_hostname_that_resolves_to_a_private_ip(): void
    {
        $fetcher = new class extends FetchSafeRemoteHtml {
            protected function resolveHostRecords(string $host): array
            {
                return [['ip' => '10.0.0.12']];
            }
        };

        $this->assertNull(
            $fetcher->inspectUrl('https://internal.example.com/product'),
        );
    }

    public function test_it_does_not_follow_an_unsafe_redirect(): void
    {
        Http::fake(function (Request $request) {
            if ($request->url() === 'https://example.com/product') {
                return Http::response('', 302, [
                    'Location' => 'http://127.0.0.1/private',
                ]);
            }

            return Http::response('should not be requested');
        });

        $result = (new FetchSafeRemoteHtml())->execute(
            'https://example.com/product',
        );

        $this->assertFalse($result['ok']);
        $this->assertSame('unsafe', $result['reason']);
        Http::assertSentCount(1);
    }

    public function test_it_rejects_non_html_and_oversized_responses(): void
    {
        Http::fake([
            'https://example.com/file.json' => Http::response('{}', 200, [
                'Content-Type' => 'application/json',
            ]),
            'https://example.com/large' => Http::response('content', 200, [
                'Content-Type' => 'text/html',
                'Content-Length' =>
                    (string) (FetchSafeRemoteHtml::DEFAULT_MAX_BYTES + 1),
            ]),
        ]);

        $fetcher = new FetchSafeRemoteHtml();

        $this->assertSame(
            'not_html',
            $fetcher->execute('https://example.com/file.json')['reason'],
        );
        $this->assertSame(
            'too_large',
            $fetcher->execute('https://example.com/large')['reason'],
        );
    }
}
