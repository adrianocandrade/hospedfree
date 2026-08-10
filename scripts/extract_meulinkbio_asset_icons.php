<?php

declare(strict_types=1);

/**
 * Build the MeuLinkBio icon library.
 *
 * The high-resolution v2 PNG files are the editable sources and backups. This
 * script converts them to WebP without resizing or deleting the PNG files. The
 * existing v3 WebP library is only indexed and is never recut or overwritten.
 *
 * Usage: php scripts/extract_meulinkbio_asset_icons.php
 */

const WEBP_QUALITY = 92;

$projectRoot = dirname(__DIR__);
$outputRoot = $projectRoot . '/public/images/icons/meulinkbio';
$v2Directory = $outputRoot . '/v2';
$v3Directory = $outputRoot . '/v3';

$v2ExpectedNames = [
    'link',
    'profile-phone',
    'apps-phone',
    'qr-code',
    'shopping-cart',
    'shopping-bag',
    'package',
    'storefront',
    'discount-tag',
    'discount-ticket',
    'growth-chart',
    'analytics-dashboard',
    'cursor-click',
    'trend-line',
    'target',
    'audience',
    'chat',
    'whatsapp',
    'email',
    'newsletter',
    'calendar',
    'notification',
    'share',
    'megaphone',
    'rocket',
    'trophy',
    'medal',
    'star',
    'shield-check',
    'lock',
    'verified',
    'paint-brush',
    'palette',
    'magic-wand',
    'webpage',
    'menu',
    'image',
    'video',
    'music',
    'microphone',
    'podcast',
    'location',
    'world',
    'domain',
    'integration-puzzle',
    'plugin',
    'cloud-sync',
    'network',
    'payment-card',
    'coins',
    'gift',
    'crown',
];

$v2Aliases = [
    'cursor' => 'cursor-click',
    'text' => 'menu',
];

// Duplicate of lock.png kept as a source backup, but not published twice.
$v2IgnoredPngs = ['Prancheta2'];

if (!extension_loaded('gd') || !function_exists('imagewebp')) {
    fwrite(STDERR, "The PHP GD extension with WebP support is required.\n");
    exit(1);
}

$manifest = [];
$stats = [
    'v2PngBytes' => 0,
    'v2WebpBytes' => 0,
];

convertV2PngDirectory(
    $v2Directory,
    $v2ExpectedNames,
    $v2Aliases,
    $v2IgnoredPngs,
    $manifest,
    $stats,
);
indexExistingWebpDirectory($v3Directory, 'v3', $manifest);

ksort($manifest);
file_put_contents(
    $outputRoot . '/manifest.json',
    json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) .
        PHP_EOL,
);

$variantCounts = [];
foreach ($manifest as $variants) {
    foreach (array_keys($variants) as $variant) {
        $variantCounts[$variant] = ($variantCounts[$variant] ?? 0) + 1;
    }
}

$savedBytes = $stats['v2PngBytes'] - $stats['v2WebpBytes'];
$savedPercent =
    $stats['v2PngBytes'] > 0 ? ($savedBytes / $stats['v2PngBytes']) * 100 : 0;

echo sprintf(
    "Built %d unique icons (%s).\n",
    count($manifest),
    implode(
        ', ',
        array_map(
            static fn(
                string $variant,
                int $count,
            ): string => "{$variant}: {$count}",
            array_keys($variantCounts),
            array_values($variantCounts),
        ),
    ),
);
echo sprintf(
    "v2 WebP: %s from %s of PNG sources (saved %s, %.1f%%). PNG backups kept.\n",
    formatBytes($stats['v2WebpBytes']),
    formatBytes($stats['v2PngBytes']),
    formatBytes($savedBytes),
    $savedPercent,
);

/**
 * @param array<int, string> $expectedNames
 * @param array<string, string> $aliases
 * @param array<int, string> $ignoredPngs
 * @param array<string, array<string, array{path: string, width: int, height: int}>> $manifest
 * @param array{v2PngBytes: int, v2WebpBytes: int} $stats
 */
function convertV2PngDirectory(
    string $directory,
    array $expectedNames,
    array $aliases,
    array $ignoredPngs,
    array &$manifest,
    array &$stats,
): void {
    if (!is_dir($directory)) {
        fwrite(STDERR, "v2 PNG directory not found: {$directory}\n");
        exit(1);
    }

    $pngPaths = glob($directory . '/*.png') ?: [];
    natcasesort($pngPaths);
    $generatedNames = [];

    foreach ($pngPaths as $sourcePath) {
        $sourceName = pathinfo($sourcePath, PATHINFO_FILENAME);

        if (in_array($sourceName, $ignoredPngs, true)) {
            continue;
        }

        $assetName = $aliases[$sourceName] ?? $sourceName;
        if (!in_array($assetName, $expectedNames, true)) {
            fwrite(STDERR, "Unexpected v2 PNG source: {$sourceName}.png\n");
            exit(1);
        }

        if (isset($generatedNames[$assetName])) {
            fwrite(STDERR, "Duplicate v2 asset name: {$assetName}\n");
            exit(1);
        }

        $source = imagecreatefrompng($sourcePath);
        if ($source === false) {
            fwrite(STDERR, "Could not read PNG source: {$sourcePath}\n");
            exit(1);
        }

        $width = imagesx($source);
        $height = imagesy($source);
        $sanitizedSource = sanitizeTransparentPixels($source);
        imagedestroy($source);

        if ($sourceName === 'cursor') {
            // Remove a small detached blue pixel cluster while keeping cursor.png untouched.
            clearTransparentRegion($sanitizedSource, 0, 0, 95, 90);
        }

        $destinationPath = $directory . '/' . $assetName . '.webp';
        if (!imagewebp($sanitizedSource, $destinationPath, WEBP_QUALITY)) {
            fwrite(STDERR, "Could not write WebP icon: {$destinationPath}\n");
            exit(1);
        }
        imagedestroy($sanitizedSource);

        validateConvertedWebp($destinationPath, $width, $height);

        $generatedNames[$assetName] = true;
        $stats['v2PngBytes'] += (int) filesize($sourcePath);
        $stats['v2WebpBytes'] += (int) filesize($destinationPath);
        $manifest[$assetName]['v2'] = [
            'path' => '/images/icons/meulinkbio/v2/' . $assetName . '.webp',
            'width' => $width,
            'height' => $height,
        ];
    }

    $missingNames = array_values(
        array_diff($expectedNames, array_keys($generatedNames)),
    );
    if ($missingNames !== []) {
        fwrite(
            STDERR,
            'Missing v2 PNG sources: ' . implode(', ', $missingNames) . "\n",
        );
        exit(1);
    }
}

/**
 * @param array<string, array<string, array{path: string, width: int, height: int}>> $manifest
 */
function indexExistingWebpDirectory(
    string $directory,
    string $variant,
    array &$manifest,
): void {
    if (!is_dir($directory)) {
        fwrite(STDERR, "WebP directory not found: {$directory}\n");
        exit(1);
    }

    $webpPaths = glob($directory . '/*.webp') ?: [];
    if ($webpPaths === []) {
        fwrite(STDERR, "No WebP files found in: {$directory}\n");
        exit(1);
    }

    foreach ($webpPaths as $path) {
        $dimensions = getimagesize($path);
        if ($dimensions === false) {
            fwrite(STDERR, "Could not read WebP dimensions: {$path}\n");
            exit(1);
        }

        $name = pathinfo($path, PATHINFO_FILENAME);
        $manifest[$name][$variant] = [
            'path' =>
                '/images/icons/meulinkbio/' . $variant . '/' . $name . '.webp',
            'width' => $dimensions[0],
            'height' => $dimensions[1],
        ];
    }
}

function createTransparentCanvas(int $width, int $height): GdImage
{
    $image = imagecreatetruecolor($width, $height);
    imagealphablending($image, false);
    imagesavealpha($image, true);
    $transparent = imagecolorallocatealpha($image, 0, 0, 0, 127);
    imagefill($image, 0, 0, $transparent);

    return $image;
}

function sanitizeTransparentPixels(GdImage $source): GdImage
{
    $width = imagesx($source);
    $height = imagesy($source);
    $image = createTransparentCanvas($width, $height);
    imagecopy($image, $source, 0, 0, 0, 0, $width, $height);
    $transparent = imagecolorallocatealpha($image, 0, 0, 0, 127);

    for ($y = 0; $y < $height; $y++) {
        for ($x = 0; $x < $width; $x++) {
            $rgba = imagecolorat($image, $x, $y);
            $alpha = ($rgba >> 24) & 0x7f;

            if ($alpha === 127) {
                imagesetpixel($image, $x, $y, $transparent);
            }
        }
    }

    return $image;
}

function clearTransparentRegion(
    GdImage $image,
    int $left,
    int $top,
    int $right,
    int $bottom,
): void {
    $transparent = imagecolorallocatealpha($image, 0, 0, 0, 127);
    imagefilledrectangle($image, $left, $top, $right, $bottom, $transparent);
}

function validateConvertedWebp(
    string $path,
    int $expectedWidth,
    int $expectedHeight,
): void {
    $image = imagecreatefromwebp($path);
    if ($image === false) {
        fwrite(STDERR, "Could not validate WebP icon: {$path}\n");
        exit(1);
    }

    $topLeftAlpha = (imagecolorat($image, 0, 0) >> 24) & 0x7f;
    $valid =
        imagesx($image) === $expectedWidth &&
        imagesy($image) === $expectedHeight &&
        $topLeftAlpha === 127;
    imagedestroy($image);

    if (!$valid) {
        fwrite(
            STDERR,
            "WebP dimensions or transparency are invalid: {$path}\n",
        );
        exit(1);
    }
}

function formatBytes(int $bytes): string
{
    if ($bytes >= 1024 * 1024) {
        return number_format($bytes / (1024 * 1024), 2) . ' MB';
    }

    if ($bytes >= 1024) {
        return number_format($bytes / 1024, 1) . ' KB';
    }

    return $bytes . ' B';
}
