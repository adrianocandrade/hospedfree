<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('qr_codes', function (Blueprint $table) {
            $table->string('type', 20)->default('url')->index()->after('name');
            $table->longText('data')->nullable()->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('qr_codes', function (Blueprint $table) {
            $table->dropIndex(['type']);
            $table->dropColumn(['type', 'data']);
        });
    }
};
