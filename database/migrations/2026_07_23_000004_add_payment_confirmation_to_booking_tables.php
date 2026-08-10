<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        foreach (['booking_services', 'booking_appointments'] as $tableName) {
            if (!Schema::hasTable($tableName)) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (!Schema::hasColumn($tableName, 'payment_confirmation_url')) {
                    $table->string('payment_confirmation_url', 2048)->nullable()->after('payment_instructions');
                }
                if (!Schema::hasColumn($tableName, 'payment_confirmation_instructions')) {
                    $table->text('payment_confirmation_instructions')->nullable()->after('payment_confirmation_url');
                }
            });
        }
    }

    public function down(): void
    {
        foreach (['booking_services', 'booking_appointments'] as $tableName) {
            if (!Schema::hasTable($tableName)) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                $columns = [];
                if (Schema::hasColumn($tableName, 'payment_confirmation_instructions')) {
                    $columns[] = 'payment_confirmation_instructions';
                }
                if (Schema::hasColumn($tableName, 'payment_confirmation_url')) {
                    $columns[] = 'payment_confirmation_url';
                }
                if ($columns !== []) {
                    $table->dropColumn($columns);
                }
            });
        }
    }
};
