<?php

namespace App\Biolinks\Support;

use Illuminate\Support\Str;

class BiolinkAssetCatalog
{
    private const LEGACY_PATH_ALIASES = [
        '/images/svg/icons/Star.svg' => '/images/svg/icons/New Badge.svg',
    ];

    public const ALLOWED_ROOTS = [
        'images/3d',
        'images/block-styles',
        'images/emoji',
        'images/pattern',
        'images/scribbbles',
        'images/svg',
        'images/wallpapers',
    ];

    private const ALLOWED_EXTENSIONS = [
        'gif',
        'jpeg',
        'jpg',
        'png',
        'svg',
        'webp',
    ];

    /**
     * @param array<int, string>|null $roots
     */
    public function isAllowedPath(mixed $path, array|null $roots = null): bool
    {
        return $this->normalizePath($path, $roots) !== null;
    }

    /**
     * @param array<int, string>|null $roots
     */
    public function normalizePath(mixed $path, array|null $roots = null): string|null
    {
        if (!is_string($path)) {
            return null;
        }

        $path = trim($path);
        if ($path === '' || Str::length($path) > 1000) {
            return null;
        }

        $decodedPath = rawurldecode($path);
        $decodedPath = self::LEGACY_PATH_ALIASES[$decodedPath] ?? $decodedPath;
        $lower = Str::lower($decodedPath);
        if (
            !str_starts_with($decodedPath, '/images/') ||
            str_starts_with($lower, '//') ||
            str_starts_with($lower, 'javascript:') ||
            str_starts_with($lower, 'data:') ||
            str_contains($decodedPath, '\\') ||
            str_contains($decodedPath, '<') ||
            preg_match('/[\x00-\x1F\x7F]/', $decodedPath)
        ) {
            return null;
        }

        $relativePath = preg_replace('#/+#', '/', ltrim($decodedPath, '/'));
        if (!$relativePath || str_contains($relativePath, '..')) {
            return null;
        }

        $allowedRoots = $roots ?: self::ALLOWED_ROOTS;
        $matchesAllowedRoot = collect($allowedRoots)->contains(
            fn(string $root) => str_starts_with($relativePath, trim($root, '/') . '/'),
        );
        if (!$matchesAllowedRoot) {
            return null;
        }

        $extension = Str::lower(pathinfo($relativePath, PATHINFO_EXTENSION));
        if (!in_array($extension, self::ALLOWED_EXTENSIONS, true)) {
            return null;
        }

        $publicImagesRoot = realpath(public_path('images'));
        $assetPath = realpath(public_path($relativePath));
        if (!$publicImagesRoot || !$assetPath) {
            return null;
        }

        if (!str_starts_with($assetPath, $publicImagesRoot . DIRECTORY_SEPARATOR)) {
            return null;
        }

        return '/' . collect(explode('/', $relativePath))
            ->map(fn(string $segment) => rawurlencode($segment))
            ->implode('/');
    }

    /**
     * Validate local /images references inside CSS url(...) values when they
     * point at the controlled biolink asset directories.
     */
    public function validateCssImageReferences(
        array &$errors,
        string $path,
        mixed $value,
    ): void {
        if (!is_string($value) || !str_contains(Str::lower($value), 'url(')) {
            return;
        }

        preg_match_all('/url\(\s*([\'"]?)(.*?)\1\s*\)/i', $value, $matches);

        foreach ($matches[2] ?? [] as $url) {
            $url = trim($url);
            if (!$url || !str_starts_with(rawurldecode($url), '/images/')) {
                continue;
            }

            $relativeUrl = ltrim(rawurldecode($url), '/');
            $isManagedAsset = collect(self::ALLOWED_ROOTS)->contains(
                fn(string $root) => str_starts_with($relativeUrl, "$root/"),
            );

            if ($isManagedAsset && !$this->isAllowedPath($url)) {
                $errors[$path] = 'The background image asset is not allowed.';
                return;
            }
        }
    }

    /**
     * @param array<int, string>|null $roots
     */
    public function validatePath(
        array &$errors,
        string $path,
        mixed $value,
        bool $nullable = false,
        array|null $roots = null,
    ): void {
        if (($value === null || $value === '') && $nullable) {
            return;
        }

        if (!$this->isAllowedPath($value, $roots)) {
            $errors[$path] = 'The selected asset is not allowed.';
        }
    }
}
