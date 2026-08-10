<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('biolink_widgets')) {
            return;
        }

        Schema::table('biolink_widgets', function (Blueprint $table): void {
            if (!Schema::hasColumn('biolink_widgets', 'clicks_count')) {
                $table->unsignedBigInteger('clicks_count')->default(0)->index();
            }

            if (!Schema::hasColumn('biolink_widgets', 'clicked_at')) {
                $table->timestamp('clicked_at')->nullable()->index();
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('biolink_widgets')) {
            return;
        }

        Schema::table('biolink_widgets', function (Blueprint $table): void {
            if (Schema::hasColumn('biolink_widgets', 'clicked_at')) {
                $table->dropColumn('clicked_at');
            }

            if (Schema::hasColumn('biolink_widgets', 'clicks_count')) {
                $table->dropColumn('clicks_count');
            }
        });
    }
};
