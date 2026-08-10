<?php

namespace App\Pwa\Controllers;

use Illuminate\Http\JsonResponse;

class PwaManifestController
{
    public function __invoke(): JsonResponse
    {
        $siteName = (string) (settings('branding.site_name') ?: config('app.name'));
        $description = (string) (settings('branding.site_description') ?: $siteName);
        $baseUrl = rtrim(url('/'), '/') . '/';
        $language = app()->getLocale();
        $direction = in_array(
            strtolower(strtok($language, '_-')),
            ['ar', 'fa', 'he', 'ur'],
            true,
        )
            ? 'rtl'
            : 'ltr';

        return response()
            ->json(
                [
                    'id' => $baseUrl,
                    'name' => $siteName,
                    'short_name' => mb_strimwidth($siteName, 0, 18, ''),
                    'description' => $description,
                    'lang' => $language,
                    'dir' => $direction,
                    'start_url' => $baseUrl,
                    'scope' => $baseUrl,
                    'display' => 'standalone',
                    'orientation' => 'any',
                    'theme_color' => (string) (settings('pwa.theme_color') ?: '#2563eb'),
                    'background_color' => (string) (settings('pwa.background_color') ?: '#ffffff'),
                    'categories' => ['business', 'productivity', 'social'],
                    'icons' => [
                        [
                            'src' => url('favicon/icon-192x192.png'),
                            'sizes' => '192x192',
                            'type' => 'image/png',
                            'purpose' => 'any',
                        ],
                        [
                            'src' => url('favicon/icon-512x512.png'),
                            'sizes' => '512x512',
                            'type' => 'image/png',
                            'purpose' => 'any',
                        ],
                    ],
                ],
                options: JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
            )
            ->header('Content-Type', 'application/manifest+json; charset=utf-8')
            ->header('Cache-Control', 'public, max-age=300');
    }
}
