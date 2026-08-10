<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    private const FROM_VERSION = 'complete-models-v2';

    private const TO_VERSION = 'complete-models-v3';

    public function up(): void
    {
        $this->replaceBackgrounds(
            self::FROM_VERSION,
            self::TO_VERSION,
            'current',
        );
    }

    public function down(): void
    {
        $this->replaceBackgrounds(
            self::TO_VERSION,
            self::FROM_VERSION,
            'previous',
        );
    }

    private function replaceBackgrounds(
        string $expectedVersion,
        string $nextVersion,
        string $backgroundKey,
    ): void {
        if (
            !Schema::hasTable('biolink_themes') ||
            !Schema::hasColumn('biolink_themes', 'metadata')
        ) {
            return;
        }

        foreach ($this->models() as $model) {
            $theme = DB::table('biolink_themes')
                ->where('slug', $model['slug'])
                ->first(['id', 'config', 'metadata']);
            if (!$theme) {
                continue;
            }

            $metadata = json_decode($theme->metadata ?? '[]', true) ?: [];
            if (($metadata['seedVersion'] ?? null) !== $expectedVersion) {
                continue;
            }

            $config = json_decode($theme->config ?? '[]', true) ?: [];
            $config['bgConfig'] = $model[$backgroundKey];
            $metadata['seedVersion'] = $nextVersion;

            DB::table('biolink_themes')
                ->where('id', $theme->id)
                ->update([
                    'config' => json_encode($config, JSON_THROW_ON_ERROR),
                    'metadata' => json_encode($metadata, JSON_THROW_ON_ERROR),
                    'updated_at' => now(),
                ]);
        }
    }

    private function models(): array
    {
        return [
            $this->model(
                slug: 'model-aventura-conteudo',
                wallpaper: 'mesh-gradient-1.webp',
                background: '#030914',
                text: '#edf7ff',
                tint: 12,
                previousGradient: 'linear-gradient(180deg, #0a192c 0%, #030914 46%, #030914 100%)',
            ),
            $this->model(
                slug: 'model-criadora-comunidade',
                wallpaper: 'mesh-gradient-10.webp',
                background: '#fff9f7',
                text: '#281c38',
                tint: 88,
                previousGradient: 'linear-gradient(180deg, #ffffff 0%, #fff9f7 46%, #fff9f7 100%)',
            ),
            $this->model(
                slug: 'model-restaurante-delivery',
                wallpaper: 'mesh-gradient-22.webp',
                background: '#090604',
                text: '#fff4df',
                tint: 10,
                previousGradient: 'linear-gradient(180deg, #1d1009 0%, #090604 46%, #090604 100%)',
            ),
            $this->model(
                slug: 'model-barbearia-premium',
                wallpaper: 'mesh-gradient-24.webp',
                background: '#070706',
                text: '#fff7e5',
                tint: 8,
                previousGradient: 'linear-gradient(180deg, #14130f 0%, #070706 46%, #070706 100%)',
                imageEffect: 'mono',
            ),
            $this->model(
                slug: 'model-salao-beleza',
                wallpaper: 'mesh-gradient-16.webp',
                background: '#fff8fa',
                text: '#3e202d',
                tint: 90,
                previousGradient: 'linear-gradient(180deg, #fffdfd 0%, #fff8fa 46%, #fff8fa 100%)',
            ),
        ];
    }

    private function model(
        string $slug,
        string $wallpaper,
        string $background,
        string $text,
        int $tint,
        string $previousGradient,
        string|null $imageEffect = null,
    ): array {
        return [
            'slug' => $slug,
            'current' => array_filter(
                [
                    'activeType' => 'image',
                    'backgroundColor' => $background,
                    'backgroundImage' => sprintf(
                        'url("/images/wallpapers/gradients/%s")',
                        $wallpaper,
                    ),
                    'backgroundAttachment' => 'scroll',
                    'backgroundSize' => 'cover',
                    'backgroundRepeat' => 'no-repeat',
                    'backgroundPosition' => 'center center',
                    'color' => $text,
                    'tint' => $tint,
                    'noise' => true,
                    'imageEffect' => $imageEffect,
                ],
                fn(mixed $value) => $value !== null,
            ),
            'previous' => [
                'activeType' => 'gradient',
                'backgroundColor' => $background,
                'backgroundImage' => $previousGradient,
                'color' => $text,
            ],
        ];
    }
};
