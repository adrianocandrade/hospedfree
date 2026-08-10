<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    private const PREVIOUS_LENGTH = 100;

    private const NEW_LENGTH = 160;

    public function up(): void
    {
        if (
            !Schema::hasTable('biolinks') ||
            !Schema::hasColumn('biolinks', 'name')
        ) {
            return;
        }

        Schema::table('biolinks', function (Blueprint $table): void {
            $table->string('name', self::NEW_LENGTH)->change();
        });
    }

    public function down(): void
    {
        if (
            !Schema::hasTable('biolinks') ||
            !Schema::hasColumn('biolinks', 'name')
        ) {
            return;
        }

        $hasLongNames = false;
        DB::table('biolinks')
            ->select(['id', 'name'])
            ->orderBy('id')
            ->chunkById(500, function ($biolinks) use (&$hasLongNames): bool {
                $hasLongNames = $biolinks->contains(
                    fn(object $biolink): bool => mb_strlen(
                        (string) $biolink->name,
                    ) > self::PREVIOUS_LENGTH,
                );

                return !$hasLongNames;
            });

        if ($hasLongNames) {
            throw new RuntimeException(
                'The biolinks.name column cannot be reduced to 100 characters while longer names exist.',
            );
        }

        Schema::table('biolinks', function (Blueprint $table): void {
            $table->string('name', self::PREVIOUS_LENGTH)->change();
        });
    }
};
