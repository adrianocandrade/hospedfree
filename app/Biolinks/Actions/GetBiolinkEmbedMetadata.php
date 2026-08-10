<?php

namespace App\Biolinks\Actions;

use App\Links\Actions\GetMetadataFromUrl;
use Illuminate\Support\Str;

class GetBiolinkEmbedMetadata
{
    public function execute(string $url): array
    {
        $normalizedUrl = GetMetadataFromUrl::normalizeUrl($url);
        $metadata = app(GetMetadataFromUrl::class)->execute($normalizedUrl);
        $host = Str::lower(
            rtrim((string) parse_url($normalizedUrl, PHP_URL_HOST), '.'),
        );
        $displayDomain = Str::of($host)->remove('www.')->toString();
        $provider = $this->providerForHost($displayDomain);

        return [
            'url' => $normalizedUrl,
            'name' =>
                $metadata['name'] ??
                $this->fallbackTitle($provider, $displayDomain),
            'description' => $metadata['description'] ?? null,
            'image' => $metadata['image'] ?? null,
            'provider' => $provider,
            'domain' => $displayDomain,
        ];
    }

    private function providerForHost(string $host): string
    {
        return match (true) {
            $this->matchesHost($host, ['instagram.com']) => 'instagram',
            $this->matchesHost($host, ['tiktok.com']) => 'tiktok',
            $this->matchesHost($host, [
                'youtube.com',
                'youtu.be',
                'youtube-nocookie.com',
            ])
                => 'youtube',
            $this->matchesHost($host, ['facebook.com', 'fb.watch'])
                => 'facebook',
            $this->matchesHost($host, ['x.com', 'twitter.com']) => 'x',
            $this->matchesHost($host, ['linkedin.com']) => 'linkedin',
            $this->matchesHost($host, ['spotify.com', 'spotify.link'])
                => 'spotify',
            $this->matchesHost($host, ['soundcloud.com']) => 'soundcloud',
            default => 'other',
        };
    }

    private function matchesHost(string $host, array $domains): bool
    {
        foreach ($domains as $domain) {
            if ($host === $domain || Str::endsWith($host, ".$domain")) {
                return true;
            }
        }

        return false;
    }

    private function fallbackTitle(string $provider, string $domain): string
    {
        return match ($provider) {
            'instagram' => 'Instagram',
            'tiktok' => 'TikTok',
            'youtube' => 'YouTube',
            'facebook' => 'Facebook',
            'x' => 'X',
            'linkedin' => 'LinkedIn',
            'spotify' => 'Spotify',
            'soundcloud' => 'SoundCloud',
            default => $domain ?: 'Link',
        };
    }
}
