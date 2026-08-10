<?php

namespace Tests\Unit;

use App\Biolinks\Support\SafeFeedReader;
use Illuminate\Validation\ValidationException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class SafeFeedReaderTest extends TestCase
{
    #[DataProvider('unsafeUrls')]
    public function test_private_and_ambiguous_feed_urls_are_rejected(string $url): void
    {
        $this->expectException(ValidationException::class);
        app(SafeFeedReader::class)->assertSafeUrl($url);
    }

    public static function unsafeUrls(): array
    {
        return [
            ['http://127.0.0.1/feed.xml'],
            ['http://10.0.0.1/feed.xml'],
            ['http://[::1]/feed.xml'],
            ['http://localhost/feed.xml'],
            ['http://service.local/feed.xml'],
            ['http://user:password@example.com/feed.xml'],
            ['file:///etc/passwd'],
        ];
    }

    public function test_rss_is_sanitized_and_limited(): void
    {
        $items = collect(range(1, 14))
            ->map(fn(int $index) => <<<XML
                <item>
                  <title>Item {$index}</title>
                  <link>https://example.com/posts/{$index}</link>
                  <description><![CDATA[<strong>Summary {$index}</strong><script>alert(1)</script>]]></description>
                  <pubDate>Fri, 07 Aug 2026 12:00:00 GMT</pubDate>
                </item>
                XML)
            ->implode('');

        $result = app(SafeFeedReader::class)->parse(
            "<?xml version=\"1.0\"?><rss version=\"2.0\"><channel><title>News</title>{$items}<item><title>Unsafe</title><link>http://127.0.0.1/private</link></item></channel></rss>",
        );

        $this->assertSame('News', $result['title']);
        $this->assertCount(12, $result['items']);
        $this->assertSame('Summary 1', $result['items'][0]['summary']);
        $this->assertSame(
            '2026-08-07T12:00:00+00:00',
            $result['items'][0]['published_at'],
        );
    }

    public function test_atom_entries_and_alternate_links_are_supported(): void
    {
        $xml = <<<'XML'
            <?xml version="1.0" encoding="UTF-8"?>
            <feed xmlns="http://www.w3.org/2005/Atom">
              <title>Channel</title>
              <entry>
                <title>Entry</title>
                <link rel="alternate" href="https://example.com/entry" />
                <summary>Useful summary</summary>
                <updated>2026-08-07T10:00:00Z</updated>
              </entry>
            </feed>
            XML;

        $result = app(SafeFeedReader::class)->parse($xml);

        $this->assertSame('Channel', $result['title']);
        $this->assertSame('Entry', $result['items'][0]['title']);
        $this->assertSame('https://example.com/entry', $result['items'][0]['url']);
    }
}
