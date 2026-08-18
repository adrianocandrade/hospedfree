<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('support_tickets', function (Blueprint $table): void {
            $table->string('type', 30)->default('ticket')->after('subject')->index();
            $table->string('department', 30)->default('technical')->after('type')->index();
        });
    }

    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table): void {
            $table->dropIndex(['type']);
            $table->dropIndex(['department']);
            $table->dropColumn(['type', 'department']);
        });
    }
};
