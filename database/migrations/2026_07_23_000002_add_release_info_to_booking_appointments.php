<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('booking_appointments', 'release_info_after_booking')) {
            Schema::table('booking_appointments', function (Blueprint $table) {
                $table->boolean('release_info_after_booking')->default(true)->after('payment_instructions');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('booking_appointments', 'release_info_after_booking')) {
            Schema::table('booking_appointments', function (Blueprint $table) {
                $table->dropColumn('release_info_after_booking');
            });
        }
    }
};
