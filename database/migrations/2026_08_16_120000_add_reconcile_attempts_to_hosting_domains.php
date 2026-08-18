<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hosting_domains', function (Blueprint $table): void {
            $table
                ->unsignedSmallInteger('reconcile_attempts')
                ->default(0)
                ->after('failure_count');
        });
    }

    public function down(): void
    {
        Schema::table('hosting_domains', function (Blueprint $table): void {
            $table->dropColumn('reconcile_attempts');
        });
    }
};
