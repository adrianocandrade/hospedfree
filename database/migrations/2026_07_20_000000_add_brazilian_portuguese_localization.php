<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    private const LEGACY_PORTUGUESE_LOCALE = 'pt';
    private const PORTUGUESE_BRAZIL_LOCALE = 'pt-BR';
    private const PORTUGUESE_PORTUGAL_LOCALE = 'pt-PT';

    public function up(): void
    {
        if (Schema::hasTable('localizations')) {
            $this->renamePortuguesePortugalLocalization();
            $this->upsertLocalization(
                self::PORTUGUESE_BRAZIL_LOCALE,
                'Português (Brasil)',
            );
        }

        if (
            Schema::hasTable('users') &&
            Schema::hasColumn('users', 'language')
        ) {
            DB::table('users')
                ->where('language', self::LEGACY_PORTUGUESE_LOCALE)
                ->update(['language' => self::PORTUGUESE_PORTUGAL_LOCALE]);
        }

        if (
            Schema::hasTable('settings') &&
            Schema::hasColumn('settings', 'name') &&
            Schema::hasColumn('settings', 'value')
        ) {
            DB::table('settings')
                ->where('name', 'locale.default')
                ->where('value', self::LEGACY_PORTUGUESE_LOCALE)
                ->update(['value' => self::PORTUGUESE_PORTUGAL_LOCALE]);
        }
    }

    public function down(): void
    {
        if (
            Schema::hasTable('localizations') &&
            Schema::hasColumn('localizations', 'language')
        ) {
            DB::table('localizations')
                ->where('language', self::PORTUGUESE_BRAZIL_LOCALE)
                ->delete();

            if (
                !DB::table('localizations')
                    ->where('language', self::LEGACY_PORTUGUESE_LOCALE)
                    ->exists()
            ) {
                $values = $this->localizationValues(
                    self::LEGACY_PORTUGUESE_LOCALE,
                    'Português',
                );

                DB::table('localizations')
                    ->where('language', self::PORTUGUESE_PORTUGAL_LOCALE)
                    ->update($values);
            }
        }

        if (
            Schema::hasTable('users') &&
            Schema::hasColumn('users', 'language')
        ) {
            DB::table('users')
                ->where('language', self::PORTUGUESE_PORTUGAL_LOCALE)
                ->update(['language' => self::LEGACY_PORTUGUESE_LOCALE]);
        }

        if (
            Schema::hasTable('settings') &&
            Schema::hasColumn('settings', 'name') &&
            Schema::hasColumn('settings', 'value')
        ) {
            DB::table('settings')
                ->where('name', 'locale.default')
                ->where('value', self::PORTUGUESE_PORTUGAL_LOCALE)
                ->update(['value' => self::LEGACY_PORTUGUESE_LOCALE]);
        }
    }

    private function renamePortuguesePortugalLocalization(): void
    {
        if (!Schema::hasColumn('localizations', 'language')) {
            return;
        }

        $values = $this->localizationValues(
            self::PORTUGUESE_PORTUGAL_LOCALE,
            'Português (Portugal)',
        );

        $ptPortugalExists = DB::table('localizations')
            ->where('language', self::PORTUGUESE_PORTUGAL_LOCALE)
            ->exists();

        if ($ptPortugalExists) {
            DB::table('localizations')
                ->where('language', self::PORTUGUESE_PORTUGAL_LOCALE)
                ->update($values);
            return;
        }

        $legacyPortuguese = DB::table('localizations')
            ->where('language', self::LEGACY_PORTUGUESE_LOCALE)
            ->orWhere('name', 'Português')
            ->first();

        if ($legacyPortuguese) {
            DB::table('localizations')
                ->where('id', $legacyPortuguese->id)
                ->update($values);
            return;
        }

        DB::table('localizations')->insert(
            $this->localizationValues(
                self::PORTUGUESE_PORTUGAL_LOCALE,
                'Português (Portugal)',
                includeCreatedAt: true,
            ),
        );
    }

    private function upsertLocalization(string $language, string $name): void
    {
        if (!Schema::hasColumn('localizations', 'language')) {
            return;
        }

        $query = DB::table('localizations')->where('language', $language);

        if ($query->exists()) {
            $query->update($this->localizationValues($language, $name));
            return;
        }

        DB::table('localizations')->insert(
            $this->localizationValues($language, $name, includeCreatedAt: true),
        );
    }

    private function localizationValues(
        string $language,
        string $name,
        bool $includeCreatedAt = false,
    ): array {
        $values = [
            'name' => $name,
            'language' => $language,
            'updated_at' => now(),
        ];

        if (Schema::hasColumn('localizations', 'direction')) {
            $values['direction'] = 'ltr';
        }

        if ($includeCreatedAt) {
            $values['created_at'] = now();
        }

        return $values;
    }
};
