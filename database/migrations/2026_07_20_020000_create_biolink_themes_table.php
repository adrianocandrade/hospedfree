<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('biolink_themes')) {
            Schema::create('biolink_themes', function (Blueprint $table) {
                $table->id();
                $table->string('name', 80);
                $table->string('slug', 80)->unique();
                $table->string('category', 20)->index();
                $table->longText('config');
                $table->unsignedInteger('sort_order')->default(0)->index();
                $table->boolean('is_published')->default(true)->index();
                $table->boolean('is_system')->default(false)->index();
                $table->integer('created_by')->nullable()->index();
                $table->timestamps();
            });
        }

        $this->seedSystemThemes();
    }

    public function down(): void
    {
        Schema::dropIfExists('biolink_themes');
    }

    private function seedSystemThemes(): void
    {
        $now = now();

        foreach ($this->themes() as $theme) {
            DB::table('biolink_themes')->updateOrInsert(
                ['slug' => $theme['slug']],
                [
                    'name' => $theme['name'],
                    'category' => $theme['category'],
                    'config' => json_encode($this->themeConfig($theme)),
                    'sort_order' => $theme['sort_order'],
                    'is_published' => true,
                    'is_system' => true,
                    'created_by' => null,
                    'updated_at' => $now,
                    'created_at' => $now,
                ],
            );
        }
    }

    private function themeConfig(array $theme): array
    {
        return [
            'theme' => [
                'slug' => $theme['slug'],
                'category' => $theme['category'],
                'locked' => $theme['category'] === 'curated',
                'modified' => false,
            ],
            'bgConfig' => $theme['bgConfig'],
            'btnConfig' => $theme['btnConfig'],
            'fontConfig' => [
                'family' => 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
            ],
            'headerConfig' => [
                'layout' => $theme['headerLayout'],
                'titleStyle' => 'text',
                'alternativeFont' => false,
                'titleColor' => $theme['titleColor'],
                'bannerBackgroundType' => 'gradient',
                'bannerGradientFrom' => $theme['bannerGradientFrom'] ?? $theme['titleColor'],
                'bannerGradientTo' => $theme['bannerGradientTo'] ?? ($theme['bgConfig']['backgroundColor'] ?? '#111111'),
            ],
        ];
    }

    private function themes(): array
    {
        return [
            [
                'name' => 'Agate',
                'slug' => 'agate',
                'category' => 'customizable',
                'sort_order' => 10,
                'titleColor' => '#E7FF31',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#0F7A5C',
                    'backgroundImage' => 'linear-gradient(135deg, #0F7A5C 0%, #0EAF80 48%, #A6FF00 100%)',
                    'color' => '#081311',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'radius' => 'rounded-full',
                    'shadow' => 'none',
                    'color' => '#A6FF00',
                    'textColor' => '#081311',
                ],
            ],
            [
                'name' => 'Air',
                'slug' => 'air',
                'category' => 'customizable',
                'sort_order' => 20,
                'titleColor' => '#121212',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'color',
                    'backgroundColor' => '#EEF1F6',
                    'color' => '#121212',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'radius' => 'rounded-lg',
                    'shadow' => 'soft',
                    'color' => '#FFFFFF',
                    'textColor' => '#121212',
                ],
            ],
            [
                'name' => 'Astral',
                'slug' => 'astral',
                'category' => 'customizable',
                'sort_order' => 30,
                'titleColor' => '#F7F2E8',
                'headerLayout' => 'hero',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#1E211C',
                    'backgroundImage' => 'radial-gradient(circle at 52% 22%, #A7B7B0 0%, #2A2C26 30%, #171813 70%)',
                    'color' => '#F7F2E8',
                ],
                'btnConfig' => [
                    'variant' => 'glass',
                    'radius' => 'rounded-full',
                    'shadow' => 'soft',
                    'color' => '#F7F2E8',
                    'textColor' => '#F7F2E8',
                ],
            ],
            [
                'name' => 'Aura',
                'slug' => 'aura',
                'category' => 'customizable',
                'sort_order' => 40,
                'titleColor' => '#2A2822',
                'headerLayout' => 'banner',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#E7E3D8',
                    'backgroundImage' => 'linear-gradient(135deg, #F7F4E9 0%, #CFCEC0 100%)',
                    'color' => '#2A2822',
                    'noise' => true,
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'radius' => 'rounded-full',
                    'shadow' => 'none',
                    'color' => '#D7D2C3',
                    'textColor' => '#2A2822',
                ],
            ],
            [
                'name' => 'Bliss',
                'slug' => 'bliss',
                'category' => 'customizable',
                'sort_order' => 50,
                'titleColor' => '#202020',
                'headerLayout' => 'cutout',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#DDE5E3',
                    'backgroundImage' => 'linear-gradient(145deg, #F7F7F4 0%, #BCC8C6 100%)',
                    'color' => '#202020',
                    'imageEffect' => 'mono',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'radius' => 'rounded-lg',
                    'shadow' => 'soft',
                    'color' => '#F1F3EF',
                    'textColor' => '#202020',
                ],
            ],
            [
                'name' => 'Blocks',
                'slug' => 'blocks',
                'category' => 'customizable',
                'sort_order' => 60,
                'titleColor' => '#FFFFFF',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'color',
                    'backgroundColor' => '#7C2BEF',
                    'color' => '#FFFFFF',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'radius' => 'rounded-none',
                    'shadow' => 'hard',
                    'color' => '#D954CF',
                    'textColor' => '#111111',
                ],
            ],
            [
                'name' => 'Bloom',
                'slug' => 'bloom',
                'category' => 'customizable',
                'sort_order' => 70,
                'titleColor' => '#FFFFFF',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#BC366F',
                    'backgroundImage' => 'linear-gradient(135deg, #BC366F 0%, #312C9A 100%)',
                    'color' => '#FFFFFF',
                ],
                'btnConfig' => [
                    'variant' => 'outline',
                    'radius' => 'rounded-full',
                    'shadow' => 'none',
                    'color' => '#FFFFFF',
                    'textColor' => '#FFFFFF',
                ],
            ],
            [
                'name' => 'Breeze',
                'slug' => 'breeze',
                'category' => 'customizable',
                'sort_order' => 80,
                'titleColor' => '#321020',
                'headerLayout' => 'shape',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#F0A0D0',
                    'backgroundImage' => 'linear-gradient(135deg, #F0A0D0 0%, #E66AB8 100%)',
                    'color' => '#321020',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'radius' => 'rounded-lg',
                    'shadow' => 'none',
                    'color' => '#F7D3EB',
                    'textColor' => '#321020',
                ],
            ],
            [
                'name' => 'Encore',
                'slug' => 'encore',
                'category' => 'customizable',
                'sort_order' => 90,
                'titleColor' => '#D8947E',
                'headerLayout' => 'hero',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#061116',
                    'backgroundImage' => 'radial-gradient(circle at 75% 10%, #D46041 0%, #13262C 28%, #061116 75%)',
                    'color' => '#EFD8CE',
                ],
                'btnConfig' => [
                    'variant' => 'outline',
                    'radius' => 'rounded-sm',
                    'shadow' => 'none',
                    'color' => '#D8947E',
                    'textColor' => '#EFD8CE',
                ],
            ],
            [
                'name' => 'Grid',
                'slug' => 'grid',
                'category' => 'customizable',
                'sort_order' => 100,
                'titleColor' => '#111111',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'pattern',
                    'backgroundColor' => '#DDEF77',
                    'backgroundImage' => 'linear-gradient(var(--bg-pattern-front) calc(var(--bg-pattern-size) * 0.2), transparent calc(var(--bg-pattern-size) * 0.2)), linear-gradient(90deg, var(--bg-pattern-front) calc(var(--bg-pattern-size) * 0.2), transparent calc(var(--bg-pattern-size) * 0.2)), linear-gradient(var(--bg-pattern-front) calc(var(--bg-pattern-size) * 0.1), transparent calc(var(--bg-pattern-size) * 0.1)), linear-gradient(90deg, var(--bg-pattern-front) calc(var(--bg-pattern-size) * 0.1), var(--bg-pattern-back) calc(var(--bg-pattern-size) * 0.1))',
                    'backgroundPosition' => 'calc(var(--bg-pattern-size) * -0.2) calc(var(--bg-pattern-size) * -0.2), calc(var(--bg-pattern-size) * -0.2) calc(var(--bg-pattern-size) * -0.2), calc(var(--bg-pattern-size) * -0.1) calc(var(--bg-pattern-size) * -0.1), calc(var(--bg-pattern-size) * -0.1) calc(var(--bg-pattern-size) * -0.1)',
                    'backgroundSize' => 'calc(var(--bg-pattern-size) * 5) calc(var(--bg-pattern-size) * 5), calc(var(--bg-pattern-size) * 5) calc(var(--bg-pattern-size) * 5), var(--bg-pattern-size) var(--bg-pattern-size), var(--bg-pattern-size) var(--bg-pattern-size)',
                    'patternFrontColor' => '#B5C945',
                    'patternSize' => 22,
                    'color' => '#111111',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'radius' => 'rounded-full',
                    'shadow' => 'hard',
                    'color' => '#FFFFFF',
                    'textColor' => '#111111',
                ],
            ],
            [
                'name' => 'Groove',
                'slug' => 'groove',
                'category' => 'customizable',
                'sort_order' => 110,
                'titleColor' => '#FFFFFF',
                'headerLayout' => 'banner',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#2547D0',
                    'backgroundImage' => 'linear-gradient(135deg, #2547D0 0%, #FF5B45 50%, #14131C 100%)',
                    'color' => '#FFFFFF',
                ],
                'btnConfig' => [
                    'variant' => 'glass',
                    'radius' => 'rounded-lg',
                    'shadow' => 'soft',
                    'color' => '#FFFFFF',
                    'textColor' => '#FFFFFF',
                ],
            ],
            [
                'name' => 'Haven',
                'slug' => 'haven',
                'category' => 'customizable',
                'sort_order' => 120,
                'titleColor' => '#28322A',
                'headerLayout' => 'cutout',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#B8AE9A',
                    'backgroundImage' => 'linear-gradient(135deg, #C8BFAE 0%, #817967 100%)',
                    'color' => '#28322A',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'radius' => 'rounded-full',
                    'shadow' => 'none',
                    'color' => '#ECE8DA',
                    'textColor' => '#28322A',
                ],
            ],
            [
                'name' => 'Lake',
                'slug' => 'lake',
                'category' => 'customizable',
                'sort_order' => 130,
                'titleColor' => '#F7F8FF',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#171A24',
                    'backgroundImage' => 'radial-gradient(circle at 50% 30%, #30364D 0%, #171A24 60%, #0A0C12 100%)',
                    'color' => '#F7F8FF',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'radius' => 'rounded-lg',
                    'shadow' => 'soft',
                    'color' => '#060910',
                    'textColor' => '#F7F8FF',
                ],
            ],
            [
                'name' => 'Mineral',
                'slug' => 'mineral',
                'category' => 'customizable',
                'sort_order' => 140,
                'titleColor' => '#181818',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'color',
                    'backgroundColor' => '#F9EBDD',
                    'color' => '#181818',
                ],
                'btnConfig' => [
                    'variant' => 'outline',
                    'radius' => 'rounded-lg',
                    'shadow' => 'none',
                    'color' => '#C8B8AA',
                    'textColor' => '#181818',
                ],
            ],
            [
                'name' => 'Nourish',
                'slug' => 'nourish',
                'category' => 'customizable',
                'sort_order' => 150,
                'titleColor' => '#D7E36D',
                'headerLayout' => 'shape',
                'bgConfig' => [
                    'activeType' => 'color',
                    'backgroundColor' => '#607236',
                    'color' => '#F9F5D7',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'radius' => 'rounded-full',
                    'shadow' => 'none',
                    'color' => '#D7E36D',
                    'textColor' => '#28300E',
                ],
            ],
            [
                'name' => 'Rise',
                'slug' => 'rise',
                'category' => 'customizable',
                'sort_order' => 160,
                'titleColor' => '#FFFFFF',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#D14A52',
                    'backgroundImage' => 'radial-gradient(circle at 35% 28%, #6EC5A5 0%, #E8C954 35%, #D14A52 72%, #4B3D85 100%)',
                    'color' => '#FFFFFF',
                ],
                'btnConfig' => [
                    'variant' => 'outline',
                    'radius' => 'rounded-lg',
                    'shadow' => 'none',
                    'color' => '#FFFFFF',
                    'textColor' => '#FFFFFF',
                ],
            ],
            [
                'name' => 'Pulse',
                'slug' => 'pulse',
                'category' => 'customizable',
                'sort_order' => 170,
                'titleColor' => '#EAF5FF',
                'headerLayout' => 'hero',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#102E71',
                    'backgroundImage' => 'linear-gradient(135deg, #102E71 0%, #1759D3 50%, #5B8FF0 100%)',
                    'color' => '#EAF5FF',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'radius' => 'rounded-lg',
                    'shadow' => 'soft',
                    'color' => '#5B8FF0',
                    'textColor' => '#FFFFFF',
                ],
            ],
            [
                'name' => 'Twilight',
                'slug' => 'twilight',
                'category' => 'customizable',
                'sort_order' => 180,
                'titleColor' => '#F2B7ED',
                'headerLayout' => 'banner',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#25324C',
                    'backgroundImage' => 'radial-gradient(circle at 50% 70%, #AC65CB 0%, #25324C 60%, #111827 100%)',
                    'color' => '#F8E8FF',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'radius' => 'rounded-full',
                    'shadow' => 'none',
                    'color' => '#F2B7ED',
                    'textColor' => '#25324C',
                ],
            ],
            [
                'name' => 'Vox',
                'slug' => 'vox',
                'category' => 'customizable',
                'sort_order' => 190,
                'titleColor' => '#FFF3EF',
                'headerLayout' => 'cutout',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#7A0704',
                    'backgroundImage' => 'radial-gradient(circle at 70% 10%, #FF2D1D 0%, #7A0704 55%, #2A0202 100%)',
                    'color' => '#FFF3EF',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'radius' => 'rounded-lg',
                    'shadow' => 'strong',
                    'color' => '#B52922',
                    'textColor' => '#FFF3EF',
                ],
            ],
            [
                'name' => 'Paper Bloom',
                'slug' => 'paper-bloom',
                'category' => 'curated',
                'sort_order' => 300,
                'titleColor' => '#191516',
                'headerLayout' => 'shape',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#F9DDE6',
                    'backgroundImage' => 'linear-gradient(135deg, #F9DDE6 0%, #F6AFCB 50%, #FFF6E8 100%)',
                    'color' => '#191516',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'radius' => 'rounded-sm',
                    'shadow' => 'soft',
                    'color' => '#FF9FC1',
                    'textColor' => '#191516',
                ],
            ],
            [
                'name' => 'Ocean Pulse',
                'slug' => 'ocean-pulse',
                'category' => 'curated',
                'sort_order' => 310,
                'titleColor' => '#FFFFFF',
                'headerLayout' => 'hero',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#071B2C',
                    'backgroundImage' => 'radial-gradient(circle at 40% 0%, #78C8E8 0%, #123B5A 35%, #071B2C 100%)',
                    'color' => '#FFFFFF',
                ],
                'btnConfig' => [
                    'variant' => 'outline',
                    'radius' => 'rounded-full',
                    'shadow' => 'none',
                    'color' => '#FFFFFF',
                    'textColor' => '#FFFFFF',
                ],
            ],
            [
                'name' => 'Garden Cut',
                'slug' => 'garden-cut',
                'category' => 'curated',
                'sort_order' => 320,
                'titleColor' => '#FFFFFF',
                'headerLayout' => 'cutout',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#132D24',
                    'backgroundImage' => 'linear-gradient(135deg, #132D24 0%, #365D34 45%, #0F1A14 100%)',
                    'color' => '#FFFFFF',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'radius' => 'rounded-lg',
                    'shadow' => 'soft',
                    'color' => '#D8DDF2',
                    'textColor' => '#132D24',
                ],
            ],
            [
                'name' => 'Studio Pop',
                'slug' => 'studio-pop',
                'category' => 'curated',
                'sort_order' => 330,
                'titleColor' => '#172027',
                'headerLayout' => 'banner',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#BDEFF5',
                    'backgroundImage' => 'linear-gradient(135deg, #BDEFF5 0%, #F8FFF7 48%, #FFE15A 100%)',
                    'color' => '#172027',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'radius' => 'rounded-lg',
                    'shadow' => 'none',
                    'color' => '#FFFFFF',
                    'textColor' => '#172027',
                ],
            ],
            [
                'name' => 'Gallery Wall',
                'slug' => 'gallery-wall',
                'category' => 'curated',
                'sort_order' => 340,
                'titleColor' => '#1F1518',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#FFF0F5',
                    'backgroundImage' => 'linear-gradient(135deg, #FFF0F5 0%, #FFD1DF 100%)',
                    'color' => '#1F1518',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'radius' => 'rounded-none',
                    'shadow' => 'hard',
                    'color' => '#FFA1C2',
                    'textColor' => '#1F1518',
                ],
            ],
            [
                'name' => 'Cosmic Quiet',
                'slug' => 'cosmic-quiet',
                'category' => 'curated',
                'sort_order' => 350,
                'titleColor' => '#E9E7FF',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#211D47',
                    'backgroundImage' => 'radial-gradient(circle at 30% 20%, #5360B3 0%, #211D47 55%, #121127 100%)',
                    'color' => '#E9E7FF',
                    'noise' => true,
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'radius' => 'rounded-lg',
                    'shadow' => 'soft',
                    'color' => '#181A35',
                    'textColor' => '#E9E7FF',
                ],
            ],
        ];
    }
};
