<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    private const SERIES = [
        'summer' => [
            'legacy' => ['summer_2026' => 2026],
            'label' => 'biolink.badges.summer.label',
            'description' => 'biolink.badges.summer.description',
            'icon' => '/images/svg/icons/Sun.svg',
            'color' => '#facc15',
            'starts_at' => '2026-06-01 00:00:00',
            'claim_until' => '2026-08-31 23:59:59',
            'edition_year' => 2026,
            'reference' => 'Summer',
        ],
        'easter' => [
            'legacy' => ['easter_2025' => 2025, 'easter_2026' => 2026],
            'label' => 'biolink.badges.easter.label',
            'description' => 'biolink.badges.easter.description',
            'icon' => '/images/svg/icons/Sun.svg',
            'color' => '#a78bfa',
            'starts_at' => '2026-03-29 00:00:00',
            'claim_until' => '2026-04-12 23:59:59',
            'edition_year' => 2026,
            'reference' => 'Easter',
        ],
        'christmas' => [
            'legacy' => [
                'christmas_2024' => 2024,
                'christmas_2025' => 2025,
            ],
            'label' => 'biolink.badges.christmas.label',
            'description' => 'biolink.badges.christmas.description',
            'icon' => '/images/svg/icons/New Badge.svg',
            'color' => '#14b8a6',
            'starts_at' => '2025-12-01 00:00:00',
            'claim_until' => '2026-01-06 23:59:59',
            'edition_year' => 2025,
            'reference' => 'Christmas',
        ],
    ];

    public function up(): void
    {
        if (!Schema::hasTable('biolink_badge_definitions')) {
            return;
        }

        $this->addDefinitionColumns();
        $this->addGrantColumns();
        $this->seedStableSeries();
        $this->classifyDefinitions();
        $this->backfillGrantCollectionFields();
        $this->migrateRecurringSeries();
        $this->migrateAppearanceItemsToStableKeys();
    }

    public function down(): void
    {
        if (!Schema::hasTable('biolink_badge_definitions')) {
            return;
        }

        $this->restoreLegacySeriesGrants();
        $this->restoreLegacyAppearanceKeys();

        foreach (self::SERIES as $stableKey => $series) {
            $stableId = DB::table('biolink_badge_definitions')
                ->where('key', $stableKey)
                ->value('id');

            if ($stableId && Schema::hasTable('biolink_badge_grants')) {
                DB::table('biolink_badge_grants')
                    ->where('badge_id', $stableId)
                    ->delete();
            }

            DB::table('biolink_badge_definitions')
                ->where('key', $stableKey)
                ->delete();

            DB::table('biolink_badge_definitions')
                ->whereIn('key', array_keys($series['legacy']))
                ->update(['is_active' => true, 'updated_at' => now()]);
        }

        $this->dropGrantColumns();
        $this->dropDefinitionColumns();
    }

    private function addDefinitionColumns(): void
    {
        Schema::table('biolink_badge_definitions', function (Blueprint $table) {
            if (!Schema::hasColumn('biolink_badge_definitions', 'category')) {
                $table->string('category', 40)->default('community')->index();
            }
            if (!Schema::hasColumn('biolink_badge_definitions', 'access_type')) {
                $table->string('access_type', 20)->default('award')->index();
            }
            if (!Schema::hasColumn('biolink_badge_definitions', 'reference')) {
                $table->string('reference', 120)->nullable();
            }
            if (!Schema::hasColumn('biolink_badge_definitions', 'repeat_yearly')) {
                $table->boolean('repeat_yearly')->default(false)->index();
            }
            if (!Schema::hasColumn('biolink_badge_definitions', 'show_year')) {
                $table->boolean('show_year')->default(false);
            }
            if (!Schema::hasColumn('biolink_badge_definitions', 'action_url')) {
                $table->text('action_url')->nullable();
            }
        });
    }

    private function addGrantColumns(): void
    {
        if (!Schema::hasTable('biolink_badge_grants')) {
            return;
        }

        Schema::table('biolink_badge_grants', function (Blueprint $table) {
            if (!Schema::hasColumn('biolink_badge_grants', 'first_unlocked_at')) {
                $table->timestamp('first_unlocked_at')->nullable();
            }
            if (!Schema::hasColumn('biolink_badge_grants', 'last_unlocked_at')) {
                $table->timestamp('last_unlocked_at')->nullable()->index();
            }
            if (!Schema::hasColumn('biolink_badge_grants', 'times_claimed')) {
                $table->unsignedSmallInteger('times_claimed')->default(1);
            }
            if (!Schema::hasColumn('biolink_badge_grants', 'edition_years')) {
                $table->json('edition_years')->nullable();
            }
        });
    }

    private function seedStableSeries(): void
    {
        foreach (self::SERIES as $key => $series) {
            DB::table('biolink_badge_definitions')->updateOrInsert(
                ['key' => $key],
                [
                    'kind' => 'event',
                    'category' => 'seasonal',
                    'access_type' => 'free',
                    'reference' => $series['reference'],
                    'label_key' => $series['label'],
                    'description_key' => $series['description'],
                    'icon' => $series['icon'],
                    'color' => $series['color'],
                    'required_feature' => null,
                    'grant_mode' => 'claim',
                    'repeat_yearly' => true,
                    'show_year' => true,
                    'action_url' => null,
                    'starts_at' => $series['starts_at'],
                    'claim_until' => $series['claim_until'],
                    'is_active' => true,
                    'metadata' => json_encode([
                        'edition_year' => $series['edition_year'],
                        'series_version' => 1,
                    ]),
                    'updated_at' => now(),
                    'created_at' => now(),
                ],
            );
        }
    }

    private function classifyDefinitions(): void
    {
        $classifications = [
            'staff' => ['membership', 'award'],
            'helper' => ['community', 'award'],
            'premium' => ['membership', 'premium'],
            'verified' => ['trust', 'automatic'],
            'donor' => ['community', 'award'],
            'gifter' => ['community', 'award'],
            'image_host' => ['product', 'award'],
            'domain_legend' => ['product', 'award'],
            'og' => ['achievement', 'award'],
            'server_booster' => ['community', 'award'],
            'hone_gg' => ['partner', 'award'],
            'bug_hunter' => ['achievement', 'award'],
            'the_million' => ['achievement', 'award'],
            'winner' => ['achievement', 'award'],
            'second_place' => ['achievement', 'award'],
            'third_place' => ['achievement', 'award'],
        ];

        foreach ($classifications as $key => [$category, $accessType]) {
            DB::table('biolink_badge_definitions')
                ->where('key', $key)
                ->update([
                    'category' => $category,
                    'access_type' => $accessType,
                    'updated_at' => now(),
                ]);
        }

        DB::table('biolink_badge_definitions')
            ->whereIn('key', ['winner', 'second_place', 'third_place'])
            ->update([
                'repeat_yearly' => true,
                'show_year' => true,
                'updated_at' => now(),
            ]);

        $legacyKeys = collect(self::SERIES)
            ->flatMap(fn(array $series) => array_keys($series['legacy']))
            ->all();

        DB::table('biolink_badge_definitions')
            ->whereIn('key', $legacyKeys)
            ->update(['is_active' => false, 'updated_at' => now()]);
    }

    private function backfillGrantCollectionFields(): void
    {
        if (!Schema::hasTable('biolink_badge_grants')) {
            return;
        }

        $definitionKeys = DB::table('biolink_badge_definitions')
            ->pluck('key', 'id');

        DB::table('biolink_badge_grants')
            ->orderBy('id')
            ->get()
            ->each(function (object $grant) use ($definitionKeys) {
                $key = (string) ($definitionKeys[$grant->badge_id] ?? '');
                $year = $this->yearFromKey($key);
                $unlockedAt =
                    $grant->granted_at ?? $grant->created_at ?? now();

                DB::table('biolink_badge_grants')
                    ->where('id', $grant->id)
                    ->update([
                        'first_unlocked_at' =>
                            $grant->first_unlocked_at ?? $unlockedAt,
                        'last_unlocked_at' =>
                            $grant->last_unlocked_at ?? $unlockedAt,
                        'times_claimed' => max(
                            1,
                            (int) ($grant->times_claimed ?? 1),
                        ),
                        'edition_years' =>
                            $grant->edition_years ??
                            ($year ? json_encode([$year]) : null),
                    ]);
            });
    }

    private function migrateRecurringSeries(): void
    {
        if (!Schema::hasTable('biolink_badge_grants')) {
            return;
        }

        foreach (self::SERIES as $stableKey => $series) {
            $stableId = DB::table('biolink_badge_definitions')
                ->where('key', $stableKey)
                ->value('id');
            if (!$stableId) {
                continue;
            }

            foreach ($series['legacy'] as $legacyKey => $year) {
                $legacyId = DB::table('biolink_badge_definitions')
                    ->where('key', $legacyKey)
                    ->value('id');
                if (!$legacyId) {
                    continue;
                }

                foreach (
                    DB::table('biolink_badge_grants')
                        ->where('badge_id', $legacyId)
                        ->get() as $legacyGrant
                ) {
                    $existing = DB::table('biolink_badge_grants')
                        ->where('badge_id', $stableId)
                        ->where('user_id', $legacyGrant->user_id)
                        ->first();
                    $years = $this->decodeYears($existing?->edition_years);
                    $years[] = (int) $year;
                    $years = array_values(array_unique($years));
                    sort($years);
                    $first = $this->earliestDate([
                        $existing?->first_unlocked_at,
                        $legacyGrant->first_unlocked_at,
                        $legacyGrant->granted_at,
                    ]);
                    $last = $this->latestDate([
                        $existing?->last_unlocked_at,
                        $legacyGrant->last_unlocked_at,
                        $legacyGrant->granted_at,
                    ]);

                    DB::table('biolink_badge_grants')->updateOrInsert(
                        [
                            'badge_id' => $stableId,
                            'user_id' => $legacyGrant->user_id,
                        ],
                        [
                            'source' => $legacyGrant->source,
                            'granted_by' => $legacyGrant->granted_by,
                            'granted_at' => $last,
                            'first_unlocked_at' => $first,
                            'last_unlocked_at' => $last,
                            'times_claimed' => count($years),
                            'edition_years' => json_encode($years),
                            'revoked_at' => $legacyGrant->revoked_at,
                            'metadata' => $legacyGrant->metadata,
                            'updated_at' => now(),
                            'created_at' =>
                                $existing?->created_at ??
                                $legacyGrant->created_at ??
                                now(),
                        ],
                    );

                    DB::table('biolink_badge_grants')
                        ->where('id', $legacyGrant->id)
                        ->delete();
                }
            }
        }
    }

    private function migrateAppearanceItemsToStableKeys(): void
    {
        if (!Schema::hasTable('biolink_appearances')) {
            return;
        }

        $lookup = [];
        foreach (self::SERIES as $stableKey => $series) {
            foreach ($series['legacy'] as $legacyKey => $year) {
                $lookup[$legacyKey] = [$stableKey, $year];
            }
        }

        foreach (
            DB::table('biolink_appearances')
                ->select(['id', 'config'])
                ->orderBy('id')
                ->get() as $appearance
        ) {
            $config = $this->decodeConfig($appearance->config);
            $items = $config['badgeConfig']['items'] ?? null;
            if (!is_array($items)) {
                continue;
            }

            $changed = false;
            $normalized = [];
            $stableIndexes = [];

            foreach ($items as $item) {
                if (
                    !is_array($item) ||
                    ($item['type'] ?? null) !== 'system' ||
                    !isset($lookup[$item['id'] ?? ''])
                ) {
                    $normalized[] = $item;
                    continue;
                }

                [$stableKey, $year] = $lookup[$item['id']];
                $item['id'] = $stableKey;
                $item['editionYear'] = $year;
                $changed = true;

                if (isset($stableIndexes[$stableKey])) {
                    $index = $stableIndexes[$stableKey];
                    $existingYear =
                        (int) ($normalized[$index]['editionYear'] ?? 0);
                    if ($year > $existingYear) {
                        $normalized[$index] = $item;
                    }
                    continue;
                }

                $stableIndexes[$stableKey] = count($normalized);
                $normalized[] = $item;
            }

            if ($changed) {
                $config['badgeConfig']['items'] = array_values($normalized);
                DB::table('biolink_appearances')
                    ->where('id', $appearance->id)
                    ->update([
                        'config' => json_encode(
                            $config,
                            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
                        ),
                        'updated_at' => now(),
                    ]);
            }
        }
    }

    private function restoreLegacySeriesGrants(): void
    {
        if (
            !Schema::hasTable('biolink_badge_grants') ||
            !Schema::hasColumn('biolink_badge_grants', 'edition_years')
        ) {
            return;
        }

        foreach (self::SERIES as $stableKey => $series) {
            $stable = DB::table('biolink_badge_definitions')
                ->where('key', $stableKey)
                ->first();
            if (!$stable) {
                continue;
            }

            $legacyByYear = array_flip($series['legacy']);
            foreach (
                DB::table('biolink_badge_grants')
                    ->where('badge_id', $stable->id)
                    ->get() as $grant
            ) {
                $years = $this->decodeYears($grant->edition_years);
                if (!$years) {
                    $years = [(int) $series['edition_year']];
                }

                foreach ($years as $year) {
                    $legacyKey =
                        $legacyByYear[$year] ?? "{$stableKey}_{$year}";
                    $legacyId = $this->ensureLegacyDefinition(
                        $legacyKey,
                        $stable,
                    );

                    DB::table('biolink_badge_grants')->updateOrInsert(
                        [
                            'badge_id' => $legacyId,
                            'user_id' => $grant->user_id,
                        ],
                        [
                            'source' => $grant->source,
                            'granted_by' => $grant->granted_by,
                            'granted_at' =>
                                $grant->last_unlocked_at ??
                                $grant->granted_at,
                            'first_unlocked_at' =>
                                $grant->first_unlocked_at ??
                                $grant->granted_at,
                            'last_unlocked_at' =>
                                $grant->last_unlocked_at ??
                                $grant->granted_at,
                            'times_claimed' => 1,
                            'edition_years' => json_encode([$year]),
                            'revoked_at' => $grant->revoked_at,
                            'metadata' => $grant->metadata,
                            'updated_at' => now(),
                            'created_at' => $grant->created_at ?? now(),
                        ],
                    );
                }
            }
        }
    }

    private function restoreLegacyAppearanceKeys(): void
    {
        if (!Schema::hasTable('biolink_appearances')) {
            return;
        }

        $defaults = collect(self::SERIES)
            ->mapWithKeys(
                fn(array $series, string $key) => [
                    $key => $series['edition_year'],
                ],
            )
            ->all();

        foreach (
            DB::table('biolink_appearances')
                ->select(['id', 'config'])
                ->orderBy('id')
                ->get() as $appearance
        ) {
            $config = $this->decodeConfig($appearance->config);
            $items = $config['badgeConfig']['items'] ?? null;
            if (!is_array($items)) {
                continue;
            }

            $changed = false;
            foreach ($items as &$item) {
                $key = is_array($item) ? ($item['id'] ?? null) : null;
                if (!is_string($key) || !isset($defaults[$key])) {
                    continue;
                }

                $year = (int) ($item['editionYear'] ?? $defaults[$key]);
                $item['id'] = "{$key}_{$year}";
                unset($item['editionYear']);
                $changed = true;
            }
            unset($item);

            if ($changed) {
                $config['badgeConfig']['items'] = $items;
                DB::table('biolink_appearances')
                    ->where('id', $appearance->id)
                    ->update([
                        'config' => json_encode(
                            $config,
                            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
                        ),
                        'updated_at' => now(),
                    ]);
            }
        }
    }

    private function ensureLegacyDefinition(
        string $key,
        object $stable,
    ): int {
        DB::table('biolink_badge_definitions')->updateOrInsert(
            ['key' => $key],
            [
                'kind' => 'event',
                'category' => $stable->category,
                'access_type' => $stable->access_type,
                'reference' => $stable->reference,
                'label_key' => $stable->label_key,
                'description_key' => $stable->description_key,
                'icon' => $stable->icon,
                'color' => $stable->color,
                'required_feature' => $stable->required_feature,
                'grant_mode' => 'claim',
                'repeat_yearly' => false,
                'show_year' => true,
                'action_url' => $stable->action_url,
                'starts_at' => null,
                'claim_until' => null,
                'is_active' => true,
                'metadata' => null,
                'updated_at' => now(),
                'created_at' => now(),
            ],
        );

        return (int) DB::table('biolink_badge_definitions')
            ->where('key', $key)
            ->value('id');
    }

    private function dropGrantColumns(): void
    {
        if (!Schema::hasTable('biolink_badge_grants')) {
            return;
        }

        Schema::table('biolink_badge_grants', function (Blueprint $table) {
            $columns = collect([
                'first_unlocked_at',
                'last_unlocked_at',
                'times_claimed',
                'edition_years',
            ])->filter(
                fn(string $column) => Schema::hasColumn(
                    'biolink_badge_grants',
                    $column,
                ),
            )->all();

            if ($columns) {
                $table->dropColumn($columns);
            }
        });
    }

    private function dropDefinitionColumns(): void
    {
        Schema::table('biolink_badge_definitions', function (Blueprint $table) {
            $columns = collect([
                'category',
                'access_type',
                'reference',
                'repeat_yearly',
                'show_year',
                'action_url',
            ])->filter(
                fn(string $column) => Schema::hasColumn(
                    'biolink_badge_definitions',
                    $column,
                ),
            )->all();

            if ($columns) {
                $table->dropColumn($columns);
            }
        });
    }

    /** @return list<int> */
    private function decodeYears(mixed $value): array
    {
        $years = is_string($value) ? json_decode($value, true) : $value;

        return collect(is_array($years) ? $years : [])
            ->filter(fn(mixed $year) => is_numeric($year))
            ->map(fn(mixed $year) => (int) $year)
            ->unique()
            ->sort()
            ->values()
            ->all();
    }

    private function decodeConfig(mixed $value): array
    {
        if (is_string($value)) {
            $value = json_decode($value, true);
        } elseif (is_object($value)) {
            $value = json_decode(json_encode($value), true);
        }

        return is_array($value) ? $value : [];
    }

    private function yearFromKey(string $key): int|null
    {
        return preg_match('/_(20\d{2})$/', $key, $matches)
            ? (int) $matches[1]
            : null;
    }

    private function earliestDate(array $values): mixed
    {
        return collect($values)->filter()->sort()->first() ?? now();
    }

    private function latestDate(array $values): mixed
    {
        return collect($values)->filter()->sortDesc()->first() ?? now();
    }
};
