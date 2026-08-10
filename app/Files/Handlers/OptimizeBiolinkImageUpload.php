<?php

namespace App\Files\Handlers;

use Common\Files\FileEntry;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;
use Throwable;

class OptimizeBiolinkImageUpload
{
    private const MAX_DIMENSION = 2560;
    private const MAX_PIXELS = 40_000_000;

    public function handle(FileEntry $entry, array $data = []): FileEntry
    {
        if (!extension_loaded('gd') || $entry->type !== 'image') {
            return $entry;
        }

        try {
            $disk = $entry->getDisk();
            $path = $entry->getStoragePath();
            $contents = $disk->get($path);
            $optimized = $this->optimizeContents($contents);
            if (!$optimized) {
                return $entry;
            }

            $disk->put($path, $optimized['contents'], [
                'mimetype' => $optimized['mime'],
                'visibility' => 'public',
            ]);

            $entry->forceFill([
                'file_size' => strlen($optimized['contents']),
                'mime' => $optimized['mime'],
            ])->save();

            return $entry->refresh();
        } catch (Throwable $exception) {
            report($exception);

            // Optimization is a best-effort enhancement. A valid original
            // upload must remain usable if the local encoder is unavailable.
            return $entry;
        }
    }

    /** @return array{contents: string, mime: string}|null */
    public function optimizeContents(string $contents): ?array
    {
        if (!extension_loaded('gd')) {
            return null;
        }

        $mime = (new \finfo(FILEINFO_MIME_TYPE))->buffer($contents);
        if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
            return null;
        }

        $dimensions = @getimagesizefromstring($contents);
        if (
            !$dimensions ||
            $dimensions[0] * $dimensions[1] > self::MAX_PIXELS
        ) {
            return null;
        }

        $this->raiseMemoryLimit();
        $image = (new ImageManager(new Driver()))->read($contents);
        $image->scaleDown(
            width: self::MAX_DIMENSION,
            height: self::MAX_DIMENSION,
        );

        $encoded = match ($mime) {
            'image/jpeg' => $image->toJpeg(82),
            'image/webp' => $image->toWebp(82),
            default => $image->toPng(),
        };
        $result = (string) $encoded;

        // Re-encoding small PNGs can increase their size. Keep the original
        // whenever local optimization would make the upload heavier.
        if (strlen($result) >= strlen($contents)) {
            return null;
        }

        return ['contents' => $result, 'mime' => $mime];
    }

    private function raiseMemoryLimit(): void
    {
        $current = (int) ini_get('memory_limit');
        if ($current > 0 && $current < 512) {
            @ini_set('memory_limit', '512M');
        }
    }
}
