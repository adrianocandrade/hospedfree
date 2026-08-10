<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('biolink_link')) {
            return;
        }

        Schema::table('biolink_link', function (Blueprint $table) {
            if (!Schema::hasColumn('biolink_link', 'thumbnail_type')) {
                $table->string('thumbnail_type', 20)->nullable()->after('active');
            }

            if (!Schema::hasColumn('biolink_link', 'thumbnail_asset')) {
                $table->string('thumbnail_asset', 1000)->nullable()->after('thumbnail_type');
            }

            if (!Schema::hasColumn('biolink_link', 'style')) {
                $table->json('style')->nullable()->after('thumbnail_asset');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('biolink_link')) {
            return;
        }

        Schema::table('biolink_link', function (Blueprint $table) {
            foreach (['style', 'thumbnail_asset', 'thumbnail_type'] as $column) {
                if (Schema::hasColumn('biolink_link', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
