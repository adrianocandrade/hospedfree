<?php

namespace App\Hosting\Services;

use Illuminate\Validation\ValidationException;

final class HostingFilePath
{
    public function normalize(string $path, bool $allowRoot = true): string
    {
        if (
            str_contains($path, "\0") ||
            preg_match('/[\x00-\x1F\x7F]/u', $path) ||
            strlen($path) > 1024
        ) {
            $this->invalid();
        }

        $path = trim(str_replace('\\', '/', $path), '/');

        if ($path === '') {
            if ($allowRoot) {
                return '';
            }

            $this->invalid();
        }

        $segments = explode('/', $path);

        foreach ($segments as $segment) {
            if (
                $segment === '' ||
                $segment === '.' ||
                $segment === '..' ||
                strlen($segment) > 255
            ) {
                $this->invalid();
            }
        }

        return implode('/', $segments);
    }

    public function name(string $name): string
    {
        $normalized = $this->normalize($name, false);

        if (str_contains($normalized, '/')) {
            $this->invalid('name');
        }

        return $normalized;
    }

    public function join(string $directory, string $name): string
    {
        $directory = $this->normalize($directory);
        $name = $this->name($name);

        return $directory === '' ? $name : "{$directory}/{$name}";
    }

    private function invalid(string $field = 'path'): never
    {
        throw ValidationException::withMessages([
            $field => __('The file path is invalid.'),
        ]);
    }
}
