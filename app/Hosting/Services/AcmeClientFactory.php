<?php

namespace App\Hosting\Services;

use Afosto\Acme\Client;
use Illuminate\Support\Facades\File;
use League\Flysystem\Filesystem;
use League\Flysystem\Local\LocalFilesystemAdapter;

class AcmeClientFactory
{
    public function make(): Client
    {
        $directoryUrl = (string) config('hospedfree.acme.directory_url');
        $this->assertSafeDirectoryUrl($directoryUrl);

        $storagePath = storage_path('app/private/hospedfree/acme');
        File::ensureDirectoryExists($storagePath, 0700, true);

        return new HardenedAcmeClient([
            'username' => (string) config('hospedfree.acme.email'),
            'fs' => new Filesystem(new LocalFilesystemAdapter($storagePath)),
            'basePath' => 'accounts',
            'directory_url' => $directoryUrl,
            'mode' => str_contains($directoryUrl, 'acme-staging-')
                ? Client::MODE_STAGING
                : Client::MODE_LIVE,
            'key_length' => 4096,
        ]);
    }

    private function assertSafeDirectoryUrl(string $url): void
    {
        $parts = parse_url($url);
        $host = strtolower((string) ($parts['host'] ?? ''));
        $allowedHosts = array_map(
            static fn(string $item) => strtolower(trim($item)),
            config('hospedfree.acme.allowed_directory_hosts', []),
        );

        if (
            !filter_var($url, FILTER_VALIDATE_URL) ||
            ($parts['scheme'] ?? null) !== 'https' ||
            isset($parts['user']) ||
            isset($parts['pass']) ||
            !in_array($host, $allowedHosts, true)
        ) {
            throw new \LogicException('The configured ACME directory is not allowed.');
        }

        if (!filter_var(config('hospedfree.acme.email'), FILTER_VALIDATE_EMAIL)) {
            throw new \LogicException('The ACME account e-mail is not configured.');
        }
    }
}
