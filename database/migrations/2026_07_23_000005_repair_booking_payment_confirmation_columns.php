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

            if (!Schema::hasColumn($tableName, 'payment_confirmation_url')) {
                Schema::table($tableName, function (Blueprint $table): void {
                    $table->string('payment_confirmation_url', 2048)->nullable();
                });
            }

            if (!Schema::hasColumn($tableName, 'payment_confirmation_instructions')) {
                Schema::table($tableName, function (Blueprint $table): void {
                    $table->text('payment_confirmation_instructions')->nullable();
                });
            }
        }
    }

    public function down(): void
    {
        // This migration repairs an installation and must never remove columns
        // owned by the original schema migrations during rollback.
    }
};
