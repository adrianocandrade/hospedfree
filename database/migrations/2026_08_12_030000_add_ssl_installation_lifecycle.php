<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('hosting_ssl_certificates', function (Blueprint $table): void {
            $table->string('installation_status', 40)
                ->default('not_started')
                ->index()
                ->after('status');
            $table->timestamp('installation_attempted_at')->nullable()->after('issued_at');
            $table->timestamp('installed_at')->nullable()->after('installation_attempted_at');
            $table->timestamp('last_checked_at')->nullable()->index()->after('installed_at');
        });

        Schema::create('hosting_ssl_operations', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('hosting_ssl_certificate_id')->index();
            $table->unsignedBigInteger('hosting_account_id')->index();
            $table->string('operation', 40)->index();
            $table->string('idempotency_key', 190)->unique();
            $table->string('status', 40)->index();
            $table->unsignedInteger('attempt_count')->default(0);
            $table->string('safe_code', 100)->nullable();
            $table->text('safe_message')->nullable();
            $table->timestamp('retry_after')->nullable()->index();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hosting_ssl_operations');

        Schema::table('hosting_ssl_certificates', function (Blueprint $table): void {
            $table->dropColumn([
                'installation_status',
                'installation_attempted_at',
                'installed_at',
                'last_checked_at',
            ]);
        });
    }
};
