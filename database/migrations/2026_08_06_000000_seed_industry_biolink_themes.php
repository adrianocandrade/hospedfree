<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (
            !Schema::hasTable('biolink_themes') ||
            !Schema::hasColumn('biolink_themes', 'metadata')
        ) {
            return;
        }

        // 1. Improve existing themes with metadata and richer configs
        $this->improveExistingThemes();

        // 2. Seed new industry/seasonal themes
        $this->seedNewThemes();
    }

    public function down(): void
    {
        if (!Schema::hasTable('biolink_themes')) {
            return;
        }

        // Remove only the themes we added
        $slugs = array_column($this->newThemes(), 'slug');
        DB::table('biolink_themes')->whereIn('slug', $slugs)->delete();

        // Remove metadata from existing themes (set to null)
        $existingSlugs = array_keys($this->existingThemeMetadata());
        DB::table('biolink_themes')
            ->whereIn('slug', $existingSlugs)
            ->update(['metadata' => null]);
    }

    // ─── Improve existing themes ────────────────────────────────
    private function improveExistingThemes(): void
    {
        foreach ($this->existingThemeMetadata() as $slug => $meta) {
            $theme = DB::table('biolink_themes')
                ->where('slug', $slug)
                ->first();

            if (!$theme) {
                continue;
            }

            $config = json_decode($theme->config, true) ?? [];

            // Merge additional config keys (boxConfig, effectsConfig, fontConfig)
            if (isset($meta['_configPatch'])) {
                $config = array_merge($config, $meta['_configPatch']);
                unset($meta['_configPatch']);
            }

            DB::table('biolink_themes')
                ->where('slug', $slug)
                ->update([
                    'metadata' => json_encode($meta),
                    'config' => json_encode($config),
                    'updated_at' => now(),
                ]);
        }
    }

    /**
     * Map of slug => metadata + optional _configPatch for existing themes.
     */
    private function existingThemeMetadata(): array
    {
        return [
            'agate' => [
                'tags' => ['verde', 'neon', 'vibrante'],
                'industry' => 'creative',
                'access' => 'free',
                '_configPatch' => [
                    'fontConfig' => ['family' => 'Inter', 'google' => true],
                    'boxConfig' => [
                        'variant' => 'glass',
                        'cornerWidth' => 12,
                        'borderWidth' => 0,
                    ],
                ],
            ],
            'air' => [
                'tags' => ['claro', 'minimalista', 'limpo'],
                'industry' => 'business',
                'access' => 'free',
                '_configPatch' => [
                    'fontConfig' => ['family' => 'Inter', 'google' => true],
                ],
            ],
            'astral' => [
                'tags' => ['escuro', 'elegante', 'minimalista'],
                'industry' => 'creative',
                'access' => 'free',
                '_configPatch' => [
                    'fontConfig' => ['family' => 'Outfit', 'google' => true],
                    'effectsConfig' => [
                        'particlePreset' => 'stars',
                        'particleDensity' => 30,
                        'effectColor' => '#F7F2E8',
                    ],
                ],
            ],
            'aura' => [
                'tags' => ['claro', 'neutro', 'elegante'],
                'industry' => 'beauty',
                'access' => 'free',
                '_configPatch' => [
                    'fontConfig' => ['family' => 'Cormorant Garamond', 'google' => true],
                ],
            ],
            'bliss' => [
                'tags' => ['claro', 'suave', 'sereno'],
                'industry' => 'wellness',
                'access' => 'free',
                '_configPatch' => [
                    'fontConfig' => ['family' => 'DM Sans', 'google' => true],
                ],
            ],
            'blocks' => [
                'tags' => ['roxo', 'ousado', 'geométrico'],
                'industry' => 'creative',
                'access' => 'free',
                '_configPatch' => [
                    'fontConfig' => ['family' => 'Space Grotesk', 'google' => true],
                ],
            ],
            'bloom' => [
                'tags' => ['gradiente', 'roxo', 'pink'],
                'industry' => 'beauty',
                'access' => 'free',
                '_configPatch' => [
                    'fontConfig' => ['family' => 'Poppins', 'google' => true],
                ],
            ],
            'breeze' => [
                'tags' => ['rosa', 'feminino', 'suave'],
                'industry' => 'beauty',
                'access' => 'free',
                '_configPatch' => [
                    'fontConfig' => ['family' => 'Nunito', 'google' => true],
                ],
            ],
            'encore' => [
                'tags' => ['escuro', 'terra', 'sofisticado'],
                'industry' => 'music',
                'access' => 'free',
                '_configPatch' => [
                    'fontConfig' => ['family' => 'Playfair Display', 'google' => true],
                ],
            ],
            'grid' => [
                'tags' => ['padrão', 'geométrico', 'vibrante'],
                'industry' => 'creative',
                'access' => 'free',
            ],
            'groove' => [
                'tags' => ['gradiente', 'vibrante', 'glass'],
                'industry' => 'music',
                'access' => 'free',
                '_configPatch' => [
                    'fontConfig' => ['family' => 'Outfit', 'google' => true],
                    'boxConfig' => [
                        'variant' => 'glass',
                        'cornerWidth' => 14,
                        'borderWidth' => 1,
                    ],
                ],
            ],
            'haven' => [
                'tags' => ['neutro', 'terra', 'acolhedor'],
                'industry' => 'fashion-style',
                'access' => 'free',
                '_configPatch' => [
                    'fontConfig' => ['family' => 'DM Serif Display', 'google' => true],
                ],
            ],
            'lake' => [
                'tags' => ['escuro', 'azul', 'profundo'],
                'industry' => 'business',
                'access' => 'free',
                '_configPatch' => [
                    'fontConfig' => ['family' => 'Inter', 'google' => true],
                ],
            ],
            'mineral' => [
                'tags' => ['neutro', 'bege', 'elegante'],
                'industry' => 'business',
                'access' => 'free',
                '_configPatch' => [
                    'fontConfig' => ['family' => 'Lora', 'google' => true],
                ],
            ],
            'nourish' => [
                'tags' => ['verde', 'orgânico', 'natural'],
                'industry' => 'wellness',
                'access' => 'free',
                '_configPatch' => [
                    'fontConfig' => ['family' => 'Nunito', 'google' => true],
                ],
            ],
            'rise' => [
                'tags' => ['gradiente', 'vibrante', 'colorido'],
                'industry' => 'creative',
                'access' => 'free',
                '_configPatch' => [
                    'fontConfig' => ['family' => 'Poppins', 'google' => true],
                ],
            ],
            'pulse' => [
                'tags' => ['azul', 'gradiente', 'moderno'],
                'industry' => 'business',
                'access' => 'free',
                '_configPatch' => [
                    'fontConfig' => ['family' => 'Inter', 'google' => true],
                ],
            ],
            'twilight' => [
                'tags' => ['roxo', 'escuro', 'misterioso'],
                'industry' => 'creative',
                'access' => 'free',
                '_configPatch' => [
                    'fontConfig' => ['family' => 'Outfit', 'google' => true],
                    'effectsConfig' => [
                        'particlePreset' => 'firefly',
                        'particleDensity' => 25,
                        'effectColor' => '#F2B7ED',
                    ],
                ],
            ],
            'vox' => [
                'tags' => ['vermelho', 'escuro', 'ousado'],
                'industry' => 'music',
                'access' => 'free',
                '_configPatch' => [
                    'fontConfig' => ['family' => 'Space Grotesk', 'google' => true],
                ],
            ],
            // Curated themes
            'paper-bloom' => [
                'tags' => ['rosa', 'floral', 'delicado'],
                'industry' => 'beauty',
                'access' => 'free',
            ],
            'ocean-pulse' => [
                'tags' => ['oceano', 'azul', 'escuro'],
                'industry' => 'travel',
                'access' => 'free',
            ],
            'garden-cut' => [
                'tags' => ['verde', 'jardim', 'natureza'],
                'industry' => 'wellness',
                'access' => 'free',
            ],
            'studio-pop' => [
                'tags' => ['claro', 'pop', 'divertido'],
                'industry' => 'creative',
                'access' => 'free',
            ],
            'gallery-wall' => [
                'tags' => ['rosa', 'arte', 'galeria'],
                'industry' => 'creative',
                'access' => 'free',
            ],
            'cosmic-quiet' => [
                'tags' => ['roxo', 'cósmico', 'escuro'],
                'industry' => 'creative',
                'access' => 'free',
            ],
        ];
    }

    // ─── New themes ─────────────────────────────────────────────
    private function seedNewThemes(): void
    {
        $now = now();

        foreach ($this->newThemes() as $theme) {
            $metadata = $theme['metadata'] ?? [];
            unset($theme['metadata']);

            DB::table('biolink_themes')->updateOrInsert(
                ['slug' => $theme['slug']],
                [
                    'name' => $theme['name'],
                    'category' => $theme['category'],
                    'config' => json_encode($this->buildConfig($theme)),
                    'sort_order' => $theme['sort_order'],
                    'is_published' => true,
                    'is_system' => true,
                    'created_by' => null,
                    'metadata' => json_encode($metadata),
                    'updated_at' => $now,
                    'created_at' => $now,
                ],
            );
        }
    }

    private function buildConfig(array $theme): array
    {
        $config = [
            'theme' => [
                'slug' => $theme['slug'],
                'category' => $theme['category'],
                'locked' => $theme['category'] === 'curated',
                'modified' => false,
            ],
            'bgConfig' => $theme['bgConfig'],
            'btnConfig' => $theme['btnConfig'],
            'headerConfig' => [
                'layout' => $theme['headerLayout'] ?? 'classic',
                'titleStyle' => 'text',
                'alternativeFont' => false,
                'titleColor' => $theme['titleColor'],
                'bannerBackgroundType' => 'gradient',
                'bannerGradientFrom' => $theme['bannerGradientFrom'] ?? $theme['titleColor'],
                'bannerGradientTo' => $theme['bannerGradientTo'] ?? ($theme['bgConfig']['backgroundColor'] ?? '#111111'),
            ],
        ];

        if (isset($theme['fontConfig'])) {
            $config['fontConfig'] = $theme['fontConfig'];
        }
        if (isset($theme['boxConfig'])) {
            $config['boxConfig'] = $theme['boxConfig'];
        }
        if (isset($theme['effectsConfig'])) {
            $config['effectsConfig'] = $theme['effectsConfig'];
        }

        return $config;
    }

    private function newThemes(): array
    {
        return [
            // ──── MODA & ESTILO ─────────────────────────────────
            [
                'name' => 'Boutique Lumi',
                'slug' => 'boutique-lumi',
                'category' => 'customizable',
                'sort_order' => 200,
                'titleColor' => '#6B4E37',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#F5E6D3',
                    'backgroundImage' => 'linear-gradient(160deg, #F5E6D3 0%, #E8D5BF 50%, #F0E0CB 100%)',
                    'color' => '#6B4E37',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'shadow' => 'soft',
                    'color' => '#FFFFFF',
                    'textColor' => '#6B4E37',
                    'cornerWidth' => 50,
                    'borderWidth' => 0,
                ],
                'fontConfig' => ['family' => 'Cormorant Garamond', 'google' => true],
                'boxConfig' => [
                    'variant' => 'solid',
                    'color' => '#FFFFFF',
                    'textColor' => '#6B4E37',
                    'cornerWidth' => 16,
                    'borderWidth' => 0,
                    'shadow' => 'soft',
                ],
                'metadata' => [
                    'tags' => ['moda', 'boutique', 'bege', 'elegante'],
                    'industry' => 'fashion-style',
                    'access' => 'free',
                ],
            ],
            [
                'name' => 'Noir Luxe',
                'slug' => 'noir-luxe',
                'category' => 'customizable',
                'sort_order' => 210,
                'titleColor' => '#FFFFFF',
                'headerLayout' => 'hero',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#0A0A0A',
                    'backgroundImage' => 'radial-gradient(circle at 50% 20%, #1A1A1A 0%, #0A0A0A 70%)',
                    'color' => '#E8E8E8',
                ],
                'btnConfig' => [
                    'variant' => 'outline',
                    'shadow' => 'none',
                    'color' => '#FFFFFF',
                    'textColor' => '#FFFFFF',
                    'cornerWidth' => 2,
                    'borderWidth' => 1,
                ],
                'fontConfig' => ['family' => 'Playfair Display', 'google' => true],
                'metadata' => [
                    'tags' => ['luxo', 'escuro', 'joias', 'elegante', 'preto'],
                    'industry' => 'fashion-style',
                    'access' => 'free',
                ],
            ],

            // ──── BELEZA ────────────────────────────────────────
            [
                'name' => 'Rosa Glamour',
                'slug' => 'rosa-glamour',
                'category' => 'customizable',
                'sort_order' => 220,
                'titleColor' => '#FFFFFF',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#E88BC5',
                    'backgroundImage' => 'linear-gradient(160deg, #F5A0D0 0%, #C77DFF 50%, #7B2FF7 100%)',
                    'color' => '#FFFFFF',
                ],
                'btnConfig' => [
                    'variant' => 'glass',
                    'shadow' => 'soft',
                    'color' => '#FFFFFF',
                    'textColor' => '#FFFFFF',
                    'cornerWidth' => 50,
                    'borderWidth' => 1,
                ],
                'fontConfig' => ['family' => 'Poppins', 'google' => true],
                'boxConfig' => [
                    'variant' => 'glass',
                    'cornerWidth' => 16,
                    'borderWidth' => 1,
                ],
                'metadata' => [
                    'tags' => ['rosa', 'glamour', 'gradiente', 'beleza'],
                    'industry' => 'beauty',
                    'access' => 'free',
                ],
            ],
            [
                'name' => 'Zen Spa',
                'slug' => 'zen-spa',
                'category' => 'customizable',
                'sort_order' => 230,
                'titleColor' => '#2D4A3E',
                'headerLayout' => 'shape',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#D4E4D1',
                    'backgroundImage' => 'linear-gradient(145deg, #D4E4D1 0%, #E8F0E5 50%, #C8DBC4 100%)',
                    'color' => '#2D4A3E',
                ],
                'btnConfig' => [
                    'variant' => 'outline',
                    'shadow' => 'none',
                    'color' => '#2D4A3E',
                    'textColor' => '#2D4A3E',
                    'cornerWidth' => 50,
                    'borderWidth' => 1,
                ],
                'fontConfig' => ['family' => 'DM Sans', 'google' => true],
                'metadata' => [
                    'tags' => ['spa', 'zen', 'verde', 'natural', 'saúde'],
                    'industry' => 'wellness',
                    'access' => 'free',
                ],
            ],

            // ──── RESTAURANTE & FOOD ────────────────────────────
            [
                'name' => 'Coffee Break',
                'slug' => 'coffee-break',
                'category' => 'customizable',
                'sort_order' => 240,
                'titleColor' => '#F5E6D3',
                'headerLayout' => 'banner',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#3B2315',
                    'backgroundImage' => 'radial-gradient(circle at 50% 30%, #5C3A24 0%, #3B2315 60%, #2A1810 100%)',
                    'color' => '#F5E6D3',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'shadow' => 'soft',
                    'color' => '#D4A574',
                    'textColor' => '#2A1810',
                    'cornerWidth' => 8,
                    'borderWidth' => 0,
                ],
                'fontConfig' => ['family' => 'DM Serif Display', 'google' => true],
                'boxConfig' => [
                    'variant' => 'solid',
                    'color' => '#4A2D1A',
                    'textColor' => '#F5E6D3',
                    'cornerWidth' => 12,
                    'borderWidth' => 0,
                ],
                'metadata' => [
                    'tags' => ['café', 'restaurante', 'marrom', 'food'],
                    'industry' => 'restaurant-food',
                    'access' => 'free',
                ],
            ],
            [
                'name' => 'Fresh Farm',
                'slug' => 'fresh-farm',
                'category' => 'customizable',
                'sort_order' => 250,
                'titleColor' => '#FFFFFF',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'color',
                    'backgroundColor' => '#8BC34A',
                    'color' => '#FFFFFF',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'shadow' => 'none',
                    'color' => '#FFFFFF',
                    'textColor' => '#558B2F',
                    'cornerWidth' => 4,
                    'borderWidth' => 0,
                ],
                'fontConfig' => ['family' => 'Nunito', 'google' => true],
                'metadata' => [
                    'tags' => ['verde', 'farm', 'natural', 'alimentos'],
                    'industry' => 'restaurant-food',
                    'access' => 'free',
                ],
            ],

            // ──── MÚSICA ────────────────────────────────────────
            [
                'name' => 'DJ Stage',
                'slug' => 'dj-stage',
                'category' => 'customizable',
                'sort_order' => 260,
                'titleColor' => '#E0AAFF',
                'headerLayout' => 'hero',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#10002B',
                    'backgroundImage' => 'radial-gradient(circle at 50% 0%, #5A189A 0%, #10002B 65%)',
                    'color' => '#E0AAFF',
                ],
                'btnConfig' => [
                    'variant' => 'glass',
                    'shadow' => 'none',
                    'color' => '#E0AAFF',
                    'textColor' => '#E0AAFF',
                    'cornerWidth' => 12,
                    'borderWidth' => 1,
                ],
                'fontConfig' => ['family' => 'Space Grotesk', 'google' => true],
                'effectsConfig' => [
                    'particlePreset' => 'ambient',
                    'particleDensity' => 20,
                    'effectColor' => '#9D4EDD',
                    'effectSecondaryColor' => '#E0AAFF',
                ],
                'metadata' => [
                    'tags' => ['dj', 'música', 'neon', 'roxo', 'festa'],
                    'industry' => 'music',
                    'access' => 'pro',
                ],
            ],
            [
                'name' => 'Street Vibes',
                'slug' => 'street-vibes',
                'category' => 'customizable',
                'sort_order' => 270,
                'titleColor' => '#F5F5F5',
                'headerLayout' => 'cutout',
                'bgConfig' => [
                    'activeType' => 'color',
                    'backgroundColor' => '#212121',
                    'color' => '#F5F5F5',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'shadow' => 'hard',
                    'color' => '#FF6D00',
                    'textColor' => '#000000',
                    'shadowColor' => '#BF360C',
                    'cornerWidth' => 0,
                    'borderWidth' => 0,
                ],
                'fontConfig' => ['family' => 'Space Grotesk', 'google' => true],
                'metadata' => [
                    'tags' => ['street', 'urbano', 'escuro', 'hip-hop'],
                    'industry' => 'music',
                    'access' => 'free',
                ],
            ],

            // ──── NEGÓCIOS & TECNOLOGIA ─────────────────────────
            [
                'name' => 'Corporate Blue',
                'slug' => 'corporate-blue',
                'category' => 'customizable',
                'sort_order' => 280,
                'titleColor' => '#FFFFFF',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#1A237E',
                    'backgroundImage' => 'linear-gradient(135deg, #1A237E 0%, #283593 50%, #3949AB 100%)',
                    'color' => '#E8EAF6',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'shadow' => 'soft',
                    'color' => '#FFFFFF',
                    'textColor' => '#1A237E',
                    'cornerWidth' => 8,
                    'borderWidth' => 0,
                ],
                'fontConfig' => ['family' => 'Inter', 'google' => true],
                'metadata' => [
                    'tags' => ['corporativo', 'azul', 'profissional'],
                    'industry' => 'business',
                    'access' => 'free',
                ],
            ],
            [
                'name' => 'Minimalist White',
                'slug' => 'minimalist-white',
                'category' => 'customizable',
                'sort_order' => 285,
                'titleColor' => '#1A1A1A',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'color',
                    'backgroundColor' => '#FFFFFF',
                    'color' => '#1A1A1A',
                ],
                'btnConfig' => [
                    'variant' => 'outline',
                    'shadow' => 'none',
                    'color' => '#D1D5DB',
                    'textColor' => '#1A1A1A',
                    'cornerWidth' => 8,
                    'borderWidth' => 1,
                ],
                'fontConfig' => ['family' => 'Inter', 'google' => true],
                'metadata' => [
                    'tags' => ['minimalista', 'branco', 'limpo', 'simples'],
                    'industry' => 'business',
                    'access' => 'free',
                ],
            ],
            [
                'name' => 'Tech Dark',
                'slug' => 'tech-dark',
                'category' => 'customizable',
                'sort_order' => 290,
                'titleColor' => '#60A5FA',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#0F172A',
                    'backgroundImage' => 'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)',
                    'color' => '#E2E8F0',
                ],
                'btnConfig' => [
                    'variant' => 'glass',
                    'shadow' => 'soft',
                    'color' => '#60A5FA',
                    'textColor' => '#E2E8F0',
                    'cornerWidth' => 10,
                    'borderWidth' => 1,
                ],
                'fontConfig' => ['family' => 'JetBrains Mono', 'google' => true],
                'boxConfig' => [
                    'variant' => 'glass',
                    'cornerWidth' => 12,
                    'borderWidth' => 1,
                ],
                'metadata' => [
                    'tags' => ['tecnologia', 'escuro', 'azul', 'dev'],
                    'industry' => 'business',
                    'access' => 'pro',
                ],
            ],

            // ──── SAÚDE & FITNESS ───────────────────────────────
            [
                'name' => 'Fitness Pro',
                'slug' => 'fitness-pro',
                'category' => 'customizable',
                'sort_order' => 300,
                'titleColor' => '#FF6D00',
                'headerLayout' => 'hero',
                'bgConfig' => [
                    'activeType' => 'color',
                    'backgroundColor' => '#121212',
                    'color' => '#EEEEEE',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'shadow' => 'none',
                    'color' => '#FF6D00',
                    'textColor' => '#000000',
                    'cornerWidth' => 50,
                    'borderWidth' => 0,
                ],
                'fontConfig' => ['family' => 'Oswald', 'google' => true],
                'metadata' => [
                    'tags' => ['fitness', 'academia', 'laranja', 'esporte'],
                    'industry' => 'wellness',
                    'access' => 'free',
                ],
            ],

            // ──── VIAGEM & TURISMO ──────────────────────────────
            [
                'name' => 'Ocean Calm',
                'slug' => 'ocean-calm',
                'category' => 'customizable',
                'sort_order' => 310,
                'titleColor' => '#FFFFFF',
                'headerLayout' => 'banner',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#006064',
                    'backgroundImage' => 'linear-gradient(160deg, #00838F 0%, #006064 40%, #004D40 100%)',
                    'color' => '#E0F7FA',
                ],
                'btnConfig' => [
                    'variant' => 'outline',
                    'shadow' => 'none',
                    'color' => '#E0F7FA',
                    'textColor' => '#E0F7FA',
                    'cornerWidth' => 50,
                    'borderWidth' => 1,
                ],
                'fontConfig' => ['family' => 'Lora', 'google' => true],
                'metadata' => [
                    'tags' => ['oceano', 'viagem', 'turquesa', 'praia'],
                    'industry' => 'travel',
                    'access' => 'free',
                ],
            ],

            // ──── CRIATIVO ──────────────────────────────────────
            [
                'name' => 'Neon Party',
                'slug' => 'neon-party',
                'category' => 'customizable',
                'sort_order' => 320,
                'titleColor' => '#39FF14',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'color',
                    'backgroundColor' => '#0D0D0D',
                    'color' => '#39FF14',
                ],
                'btnConfig' => [
                    'variant' => 'outline',
                    'shadow' => 'none',
                    'color' => '#39FF14',
                    'textColor' => '#39FF14',
                    'shadowColor' => '#39FF14',
                    'cornerWidth' => 4,
                    'borderWidth' => 2,
                ],
                'fontConfig' => ['family' => 'Orbitron', 'google' => true],
                'effectsConfig' => [
                    'glow' => [
                        'enabled' => true,
                        'preset' => 'medium',
                        'source' => 'custom',
                        'customColor' => '#39FF14',
                        'buttons' => true,
                        'socialIcons' => true,
                    ],
                ],
                'metadata' => [
                    'tags' => ['neon', 'festa', 'verde', 'cyberpunk'],
                    'industry' => 'creative',
                    'access' => 'pro',
                ],
            ],
            [
                'name' => 'Coral Sunset',
                'slug' => 'coral-sunset',
                'category' => 'customizable',
                'sort_order' => 325,
                'titleColor' => '#FFFFFF',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#FF6B6B',
                    'backgroundImage' => 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FFA07A 100%)',
                    'color' => '#FFFFFF',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'shadow' => 'soft',
                    'color' => '#FFFFFF',
                    'textColor' => '#C62828',
                    'cornerWidth' => 50,
                    'borderWidth' => 0,
                ],
                'fontConfig' => ['family' => 'Nunito', 'google' => true],
                'metadata' => [
                    'tags' => ['coral', 'laranja', 'pôr do sol', 'quente'],
                    'industry' => 'creative',
                    'access' => 'free',
                ],
            ],
            [
                'name' => 'Pastel Dreams',
                'slug' => 'pastel-dreams',
                'category' => 'customizable',
                'sort_order' => 330,
                'titleColor' => '#5C4D7D',
                'headerLayout' => 'shape',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#E8DEF8',
                    'backgroundImage' => 'linear-gradient(145deg, #E8DEF8 0%, #D0BCFF 50%, #F3E5F5 100%)',
                    'color' => '#5C4D7D',
                ],
                'btnConfig' => [
                    'variant' => 'outline',
                    'shadow' => 'none',
                    'color' => '#7E57C2',
                    'textColor' => '#5C4D7D',
                    'cornerWidth' => 50,
                    'borderWidth' => 1,
                ],
                'fontConfig' => ['family' => 'Quicksand', 'google' => true],
                'metadata' => [
                    'tags' => ['pastel', 'lilás', 'suave', 'sonho'],
                    'industry' => 'creative',
                    'access' => 'free',
                ],
            ],
            [
                'name' => 'Creative Splash',
                'slug' => 'creative-splash',
                'category' => 'customizable',
                'sort_order' => 335,
                'titleColor' => '#FFFFFF',
                'headerLayout' => 'cutout',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#7928CA',
                    'backgroundImage' => 'linear-gradient(135deg, #7928CA 0%, #FF0080 50%, #FF4D00 100%)',
                    'color' => '#FFFFFF',
                ],
                'btnConfig' => [
                    'variant' => 'glass',
                    'shadow' => 'soft',
                    'color' => '#FFFFFF',
                    'textColor' => '#FFFFFF',
                    'cornerWidth' => 14,
                    'borderWidth' => 1,
                ],
                'fontConfig' => ['family' => 'Outfit', 'google' => true],
                'boxConfig' => [
                    'variant' => 'glass',
                    'cornerWidth' => 16,
                    'borderWidth' => 1,
                ],
                'metadata' => [
                    'tags' => ['criativo', 'gradiente', 'vibrante', 'ousado'],
                    'industry' => 'creative',
                    'access' => 'pro',
                ],
            ],
            [
                'name' => 'Vintage Retro',
                'slug' => 'vintage-retro',
                'category' => 'customizable',
                'sort_order' => 338,
                'titleColor' => '#5D4037',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#EFEBE9',
                    'backgroundImage' => 'linear-gradient(145deg, #EFEBE9 0%, #D7CCC8 100%)',
                    'color' => '#5D4037',
                    'noise' => true,
                ],
                'btnConfig' => [
                    'variant' => 'dashed',
                    'shadow' => 'none',
                    'color' => '#8D6E63',
                    'textColor' => '#5D4037',
                    'cornerWidth' => 4,
                    'borderWidth' => 2,
                ],
                'fontConfig' => ['family' => 'Lora', 'google' => true],
                'metadata' => [
                    'tags' => ['vintage', 'retro', 'bege', 'rústico'],
                    'industry' => 'creative',
                    'access' => 'free',
                ],
            ],

            // ──── LOJA / STORE ──────────────────────────────────
            [
                'name' => 'Storefront',
                'slug' => 'storefront',
                'category' => 'customizable',
                'sort_order' => 340,
                'titleColor' => '#1B1B1B',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'color',
                    'backgroundColor' => '#F8F9FA',
                    'color' => '#1B1B1B',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'shadow' => 'soft',
                    'color' => '#1B1B1B',
                    'textColor' => '#FFFFFF',
                    'cornerWidth' => 8,
                    'borderWidth' => 0,
                ],
                'fontConfig' => ['family' => 'DM Sans', 'google' => true],
                'boxConfig' => [
                    'variant' => 'solid',
                    'color' => '#FFFFFF',
                    'textColor' => '#1B1B1B',
                    'cornerWidth' => 12,
                    'borderWidth' => 0,
                    'shadow' => 'soft',
                ],
                'metadata' => [
                    'tags' => ['loja', 'ecommerce', 'limpo', 'produtos'],
                    'industry' => 'store',
                    'access' => 'free',
                ],
            ],

            // ──── JOGOS ─────────────────────────────────────────
            [
                'name' => 'Gamer Zone',
                'slug' => 'gamer-zone',
                'category' => 'customizable',
                'sort_order' => 345,
                'titleColor' => '#00E676',
                'headerLayout' => 'hero',
                'bgConfig' => [
                    'activeType' => 'color',
                    'backgroundColor' => '#0A0A0A',
                    'color' => '#00E676',
                ],
                'btnConfig' => [
                    'variant' => 'cut-corner',
                    'shadow' => 'none',
                    'color' => '#00E676',
                    'textColor' => '#000000',
                    'cornerWidth' => 0,
                    'borderWidth' => 0,
                ],
                'fontConfig' => ['family' => 'Orbitron', 'google' => true],
                'effectsConfig' => [
                    'particlePreset' => 'matrix',
                    'particleDensity' => 15,
                    'effectColor' => '#00E676',
                ],
                'metadata' => [
                    'tags' => ['gamer', 'jogos', 'neon', 'verde'],
                    'industry' => 'creative',
                    'access' => 'pro',
                ],
            ],

            // ──── EVENTOS ───────────────────────────────────────
            [
                'name' => 'Wedding Bliss',
                'slug' => 'wedding-bliss',
                'category' => 'customizable',
                'sort_order' => 350,
                'titleColor' => '#5D4037',
                'headerLayout' => 'shape',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#FFF8E1',
                    'backgroundImage' => 'linear-gradient(145deg, #FFF8E1 0%, #FFECB3 100%)',
                    'color' => '#5D4037',
                ],
                'btnConfig' => [
                    'variant' => 'outline',
                    'shadow' => 'none',
                    'color' => '#C8A951',
                    'textColor' => '#5D4037',
                    'cornerWidth' => 50,
                    'borderWidth' => 1,
                ],
                'fontConfig' => ['family' => 'Cormorant Garamond', 'google' => true],
                'metadata' => [
                    'tags' => ['casamento', 'dourado', 'evento', 'elegante'],
                    'industry' => 'creative',
                    'access' => 'free',
                ],
            ],
            [
                'name' => 'Pet Love',
                'slug' => 'pet-love',
                'category' => 'customizable',
                'sort_order' => 355,
                'titleColor' => '#2E7D32',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#E8F5E9',
                    'backgroundImage' => 'linear-gradient(145deg, #E8F5E9 0%, #C8E6C9 100%)',
                    'color' => '#2E7D32',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'shadow' => 'soft',
                    'color' => '#FFFFFF',
                    'textColor' => '#2E7D32',
                    'cornerWidth' => 50,
                    'borderWidth' => 0,
                ],
                'fontConfig' => ['family' => 'Nunito', 'google' => true],
                'metadata' => [
                    'tags' => ['pet', 'animal', 'verde', 'fofo'],
                    'industry' => 'store',
                    'access' => 'free',
                ],
            ],

            // ──── SAZONAIS ──────────────────────────────────────
            [
                'name' => 'Natal Alegre',
                'slug' => 'natal-alegre',
                'category' => 'curated',
                'sort_order' => 400,
                'titleColor' => '#FFFFFF',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#B71C1C',
                    'backgroundImage' => 'radial-gradient(circle at 50% 30%, #D32F2F 0%, #B71C1C 50%, #7F0000 100%)',
                    'color' => '#FFFFFF',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'shadow' => 'soft',
                    'color' => '#FFFFFF',
                    'textColor' => '#B71C1C',
                    'cornerWidth' => 50,
                    'borderWidth' => 0,
                ],
                'fontConfig' => ['family' => 'Nunito', 'google' => true],
                'effectsConfig' => [
                    'particlePreset' => 'snow',
                    'particleDensity' => 40,
                    'effectColor' => '#FFFFFF',
                ],
                'metadata' => [
                    'tags' => ['natal', 'vermelho', 'neve', 'festivo'],
                    'industry' => 'seasonal',
                    'access' => 'free',
                ],
            ],
            [
                'name' => 'Natal Elegante',
                'slug' => 'natal-elegante',
                'category' => 'curated',
                'sort_order' => 410,
                'titleColor' => '#FFD700',
                'headerLayout' => 'hero',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#1B4332',
                    'backgroundImage' => 'radial-gradient(circle at 40% 20%, #2D6A4F 0%, #1B4332 50%, #0B2118 100%)',
                    'color' => '#D4EDDA',
                ],
                'btnConfig' => [
                    'variant' => 'outline',
                    'shadow' => 'none',
                    'color' => '#FFD700',
                    'textColor' => '#FFD700',
                    'cornerWidth' => 4,
                    'borderWidth' => 1,
                ],
                'fontConfig' => ['family' => 'Playfair Display', 'google' => true],
                'effectsConfig' => [
                    'particlePreset' => 'snow',
                    'particleDensity' => 25,
                    'effectColor' => '#FFD700',
                ],
                'metadata' => [
                    'tags' => ['natal', 'verde', 'dourado', 'elegante'],
                    'industry' => 'seasonal',
                    'access' => 'pro',
                ],
            ],
            [
                'name' => 'Black Friday',
                'slug' => 'black-friday',
                'category' => 'curated',
                'sort_order' => 420,
                'titleColor' => '#FFC107',
                'headerLayout' => 'banner',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#1A1A1A',
                    'backgroundImage' => 'linear-gradient(145deg, #1A1A1A 0%, #2D2D2D 50%, #0D0D0D 100%)',
                    'color' => '#FAFAFA',
                ],
                'btnConfig' => [
                    'variant' => 'outline',
                    'shadow' => 'none',
                    'color' => '#FFC107',
                    'textColor' => '#FFC107',
                    'cornerWidth' => 50,
                    'borderWidth' => 2,
                ],
                'fontConfig' => ['family' => 'Oswald', 'google' => true],
                'metadata' => [
                    'tags' => ['black friday', 'preto', 'amarelo', 'promoção'],
                    'industry' => 'seasonal',
                    'access' => 'free',
                ],
            ],
            [
                'name' => 'Black Friday Red',
                'slug' => 'black-friday-red',
                'category' => 'curated',
                'sort_order' => 425,
                'titleColor' => '#FF1744',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'color',
                    'backgroundColor' => '#0A0A0A',
                    'color' => '#FAFAFA',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'shadow' => 'none',
                    'color' => '#FF1744',
                    'textColor' => '#FFFFFF',
                    'cornerWidth' => 50,
                    'borderWidth' => 0,
                ],
                'fontConfig' => ['family' => 'Space Grotesk', 'google' => true],
                'boxConfig' => [
                    'variant' => 'outline',
                    'color' => '#FF1744',
                    'textColor' => '#FAFAFA',
                    'cornerWidth' => 12,
                    'borderWidth' => 1,
                ],
                'metadata' => [
                    'tags' => ['black friday', 'preto', 'vermelho', 'oferta'],
                    'industry' => 'seasonal',
                    'access' => 'free',
                ],
            ],
            [
                'name' => 'Halloween Night',
                'slug' => 'halloween-night',
                'category' => 'curated',
                'sort_order' => 430,
                'titleColor' => '#FF6F00',
                'headerLayout' => 'shape',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#FFF3E0',
                    'backgroundImage' => 'linear-gradient(160deg, #FFF3E0 0%, #FFE0B2 100%)',
                    'color' => '#3E2723',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'shadow' => 'hard',
                    'color' => '#FF6F00',
                    'textColor' => '#FFFFFF',
                    'shadowColor' => '#E65100',
                    'cornerWidth' => 8,
                    'borderWidth' => 0,
                ],
                'fontConfig' => ['family' => 'Creepster', 'google' => true],
                'metadata' => [
                    'tags' => ['halloween', 'laranja', 'terror', 'festa'],
                    'industry' => 'seasonal',
                    'access' => 'free',
                ],
            ],
            [
                'name' => 'Outono Dourado',
                'slug' => 'outono-dourado',
                'category' => 'curated',
                'sort_order' => 435,
                'titleColor' => '#5D4037',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#FBE9E7',
                    'backgroundImage' => 'linear-gradient(145deg, #FBE9E7 0%, #FFCCBC 100%)',
                    'color' => '#5D4037',
                ],
                'btnConfig' => [
                    'variant' => 'outline',
                    'shadow' => 'none',
                    'color' => '#A1887F',
                    'textColor' => '#5D4037',
                    'cornerWidth' => 50,
                    'borderWidth' => 2,
                ],
                'fontConfig' => ['family' => 'Lora', 'google' => true],
                'metadata' => [
                    'tags' => ['outono', 'dourado', 'folhas', 'quente'],
                    'industry' => 'seasonal',
                    'access' => 'free',
                ],
            ],
            [
                'name' => 'São João Festa',
                'slug' => 'sao-joao-festa',
                'category' => 'curated',
                'sort_order' => 440,
                'titleColor' => '#FFEB3B',
                'headerLayout' => 'banner',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#4A148C',
                    'backgroundImage' => 'linear-gradient(135deg, #4A148C 0%, #7B1FA2 50%, #311B92 100%)',
                    'color' => '#FFF9C4',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'shadow' => 'hard',
                    'color' => '#FFEB3B',
                    'textColor' => '#4A148C',
                    'shadowColor' => '#F9A825',
                    'cornerWidth' => 8,
                    'borderWidth' => 0,
                ],
                'fontConfig' => ['family' => 'Nunito', 'google' => true],
                'effectsConfig' => [
                    'particlePreset' => 'fire',
                    'particleDensity' => 15,
                    'effectColor' => '#FF9800',
                    'effectSecondaryColor' => '#FFEB3B',
                ],
                'metadata' => [
                    'tags' => ['são joão', 'festa', 'junina', 'fogueira'],
                    'industry' => 'seasonal',
                    'access' => 'pro',
                ],
            ],
            [
                'name' => 'Dia das Mães',
                'slug' => 'dia-das-maes',
                'category' => 'curated',
                'sort_order' => 445,
                'titleColor' => '#AD1457',
                'headerLayout' => 'shape',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#FCE4EC',
                    'backgroundImage' => 'linear-gradient(145deg, #FCE4EC 0%, #F8BBD0 100%)',
                    'color' => '#AD1457',
                ],
                'btnConfig' => [
                    'variant' => 'solid',
                    'shadow' => 'soft',
                    'color' => '#EC407A',
                    'textColor' => '#FFFFFF',
                    'cornerWidth' => 50,
                    'borderWidth' => 0,
                ],
                'fontConfig' => ['family' => 'Dancing Script', 'google' => true],
                'metadata' => [
                    'tags' => ['mães', 'rosa', 'amor', 'floral'],
                    'industry' => 'seasonal',
                    'access' => 'free',
                ],
            ],
            [
                'name' => 'Primavera',
                'slug' => 'primavera',
                'category' => 'curated',
                'sort_order' => 450,
                'titleColor' => '#2E7D32',
                'headerLayout' => 'classic',
                'bgConfig' => [
                    'activeType' => 'gradient',
                    'backgroundColor' => '#E8F5E9',
                    'backgroundImage' => 'linear-gradient(135deg, #E8F5E9 0%, #F3E5F5 50%, #FFF3E0 100%)',
                    'color' => '#2E7D32',
                ],
                'btnConfig' => [
                    'variant' => 'glass',
                    'shadow' => 'none',
                    'color' => '#66BB6A',
                    'textColor' => '#2E7D32',
                    'cornerWidth' => 50,
                    'borderWidth' => 1,
                ],
                'fontConfig' => ['family' => 'Quicksand', 'google' => true],
                'metadata' => [
                    'tags' => ['primavera', 'flores', 'verde', 'pastel'],
                    'industry' => 'seasonal',
                    'access' => 'free',
                ],
            ],
        ];
    }
};
