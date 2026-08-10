<?php

namespace Common\Settings\Mail;

final class MailBranding
{
    /**
     * @return array{url: string, path: string|null}|null
     */
    public function logo(): ?array
    {
        $configuredLogo = trim(
            (string) settings('branding.logo_dark'),
        );
        if ($configuredLogo === '') {
            return null;
        }

        $parsedLogo = parse_url($configuredLogo);
        if ($parsedLogo === false) {
            return null;
        }

        $isAbsoluteUrl = isset($parsedLogo['scheme'], $parsedLogo['host']);
        if (
            $isAbsoluteUrl &&
            !in_array(
                strtolower((string) $parsedLogo['scheme']),
                ['http', 'https'],
                true,
            )
        ) {
            return null;
        }

        $relativePath = ltrim(
            str_replace('\\', '/', (string) ($parsedLogo['path'] ?? '')),
            '/',
        );
        $url = $isAbsoluteUrl ? $configuredLogo : asset($relativePath);
        $appHost = parse_url((string) config('app.url'), PHP_URL_HOST);
        $isLocal =
            !$isAbsoluteUrl ||
            strcasecmp(
                (string) $parsedLogo['host'],
                (string) $appHost,
            ) === 0;

        return [
            'url' => $url,
            'path' => $isLocal ? $this->resolvePublicImage($relativePath) : null,
        ];
    }

    public function siteName(): string
    {
        return (string) settings(
            'branding.site_name',
            config('app.name'),
        );
    }

    private function resolvePublicImage(string $relativePath): ?string
    {
        if ($relativePath === '') {
            return null;
        }

        $publicRoot = realpath(public_path());
        $resolvedPath = realpath(public_path($relativePath));
        if (!$publicRoot || !$resolvedPath || !is_file($resolvedPath)) {
            return null;
        }

        $normalizedRoot = rtrim(
            str_replace('\\', '/', $publicRoot),
            '/',
        ) . '/';
        $normalizedPath = str_replace('\\', '/', $resolvedPath);
        if (
            !str_starts_with(
                strtolower($normalizedPath),
                strtolower($normalizedRoot),
            )
        ) {
            return null;
        }

        $mimeType = mime_content_type($resolvedPath);

        return in_array(
            $mimeType,
            [
                'image/png',
                'image/jpeg',
                'image/webp',
                'image/gif',
                'image/svg+xml',
            ],
            true,
        )
            ? $resolvedPath
            : null;
    }
}
