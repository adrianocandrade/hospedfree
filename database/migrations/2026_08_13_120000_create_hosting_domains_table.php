<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hosting_domains', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('hosting_account_id')
                ->constrained('hosting_accounts')
                ->cascadeOnDelete();
            $table->string('domain', 253);
            $table->string('type', 32)->default('custom');
            $table->string('status', 32)->default('pending');
            $table->boolean('is_primary')->default(false);
            $table->string('dns_status', 32)->nullable();
            $table->string('safe_code', 100)->nullable();
            $table->json('dns_instructions')->nullable();
            $table->unsignedSmallInteger('failure_count')->default(0);
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamp('next_check_at')->nullable()->index();
            $table->timestamps();

            $table->unique(['hosting_account_id', 'domain']);
            $table->index(['hosting_account_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hosting_domains');
    }
};
