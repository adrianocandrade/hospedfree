<?php

namespace Tests\Unit;

use App\Biolinks\Actions\GetBiolinkEmbedMetadata;
use App\Links\Actions\FetchSafeRemoteHtml;
use App\Links\Actions\GetMetadataFromUrl;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BiolinkEmbedMetadataTest extends TestCase
{
    public function test_it_detects_the_provider_and_keeps_a_semantic_fallback(): void
    {
        $this->app->instance(
            GetMetadataFromUrl::class,
            new class extends GetMetadataFromUrl {
                public function execute(string $url): array
                {
                    return [];
                }
            },
        );

        $metadata = app(GetBiolinkEmbedMetadata::class)->execute(
            'https://www.instagram.com/p/example/',
        );

        $this->assertSame('instagram', $metadata['provider']);
        $this->assertSame('instagram.com', $metadata['domain']);
        $this->assertSame('Instagram', $metadata['name']);
        $this->assertArrayHasKey('description', $metadata);
        $this->assertArrayHasKey('image', $metadata);
    }

    public function test_remote_metadata_blocks_local_and_private_destinations(): void
    {
        $metadata = new class extends GetMetadataFromUrl {
            public function safe(string $url): bool
            {
                return $this->isSafeRemoteUrl($url);
            }
        };

        $this->assertFalse($metadata->safe('http://localhost/secret'));
        $this->assertFalse($metadata->safe('http://127.0.0.1/secret'));
        $this->assertFalse($metadata->safe('http://10.0.0.10/secret'));
        $this->assertFalse($metadata->safe('http://[::1]/secret'));
        $this->assertFalse(
            $metadata->safe('https://user:password@example.com/secret'),
        );
    }

    public function test_tiktok_uses_oembed_without_returning_remote_html(): void
    {
        Http::fake(function (Request $request) {
            if (
                str_starts_with(
                    $request->url(),
                    'https://www.tiktok.com/oembed',
                )
            ) {
                return Http::response([
                    'title' => 'Andrade on the road',
                    'author_name' => 'Andrade Rolê',
                    'thumbnail_url' => 'https://cdn.example.com/tiktok.jpg',
                    'html' => '<script>alert(1)</script>',
                ]);
            }

            return Http::response('', 200, ['Content-Type' => 'text/html']);
        });

        $metadata = new class extends GetMetadataFromUrl {
            protected function isSafeRemoteUrl(string $url): bool
            {
                return true;
            }
        };
        $result = $metadata->execute(
            'https://www.tiktok.com/@andrade/video/1234567890',
        );

        $this->assertSame('Andrade on the road', $result['name']);
        $this->assertSame('Andrade Rolê', $result['description']);
        $this->assertSame(
            'https://cdn.example.com/tiktok.jpg',
            $result['image'],
        );
        $this->assertArrayNotHasKey('html', $result);
        Http::assertSent(
            fn(Request $request) => str_starts_with(
                $request->url(),
                'https://www.tiktok.com/oembed',
            ),
        );
    }

    public function test_open_graph_course_details_take_priority_over_generic_page_metadata(): void
    {
        $this->app->instance(
            FetchSafeRemoteHtml::class,
            new class extends FetchSafeRemoteHtml {
                public function execute(
                    string $url,
                    int $maxBytes = self::DEFAULT_MAX_BYTES,
                ): array {
                    return [
                        'ok' => true,
                        'reason' => 'ok',
                        'final_url' => $url,
                        'content_type' => 'text/html',
                        'body' => <<<'HTML'
                            <html>
                                <head>
                                    <title>Curso | Plataforma</title>
                                    <meta name="description" content="Descrição genérica">
                                    <meta property="og:title" content="Curso de Design de Produtos">
                                    <meta property="og:description" content="Aprenda pesquisa, prototipação e usabilidade.">
                                    <meta property="og:image" content="/images/course-cover.jpg">
                                </head>
                            </html>
                            HTML,
                    ];
                }
            },
        );

        $metadata = new class extends GetMetadataFromUrl {
            protected function isSafeRemoteUrl(string $url): bool
            {
                return true;
            }
        };

        $result = $metadata->execute(
            'https://courses.example.com/design-de-produtos',
        );

        $this->assertSame('Curso de Design de Produtos', $result['name']);
        $this->assertSame(
            'Aprenda pesquisa, prototipação e usabilidade.',
            $result['description'],
        );
        $this->assertSame(
            'https://courses.example.com/images/course-cover.jpg',
            $result['image'],
        );
    }
}
