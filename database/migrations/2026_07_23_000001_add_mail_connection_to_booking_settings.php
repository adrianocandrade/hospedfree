<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('booking_settings', 'mail_connection_id')) {
            Schema::table('booking_settings', function (Blueprint $table) {
                $table->unsignedBigInteger('mail_connection_id')->nullable()->after('biolink_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('booking_settings', 'mail_connection_id')) {
            Schema::table('booking_settings', function (Blueprint $table) {
                $table->dropColumn('mail_connection_id');
            });
        }
    }
};
