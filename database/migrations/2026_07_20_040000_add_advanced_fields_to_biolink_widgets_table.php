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

        Schema::table('biolink_widgets', function (Blueprint $table) {
            if (!Schema::hasColumn('biolink_widgets', 'password')) {
                $table->string('password', 100)->nullable()->after('config');
            }

            if (!Schema::hasColumn('biolink_widgets', 'utm')) {
                $table->text('utm')->nullable()->after('password');
            }

            if (!Schema::hasColumn('biolink_widgets', 'activates_at')) {
                $table->timestamp('activates_at')->nullable()->index('bw_activates_at_idx')->after('utm');
            }

            if (!Schema::hasColumn('biolink_widgets', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->index('bw_expires_at_idx')->after('activates_at');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('biolink_widgets')) {
            return;
        }

        Schema::table('biolink_widgets', function (Blueprint $table) {
            foreach (['expires_at', 'activates_at', 'utm', 'password'] as $column) {
                if (Schema::hasColumn('biolink_widgets', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
