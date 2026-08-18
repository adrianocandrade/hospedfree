<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hosting_ssl_certificates', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('hosting_account_id')->index();
            $table->unsignedBigInteger('workspace_id')->index();
            $table->unsignedInteger('user_id')->index();
            $table->string('domain', 253)->index();
            $table->string('provider', 40)->default('manual')->index();
            $table->string('status', 40)->index();
            $table->string('validation_method', 40)->default('dns-01');
            $table->json('dns_validation')->nullable();
            $table->string('remote_order_id')->nullable()->index();
            $table->text('safe_message')->nullable();
            $table->text('private_key')->nullable();
            $table->text('csr')->nullable();
            $table->text('certificate')->nullable();
            $table->text('ca_certificate')->nullable();
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('issued_at')->nullable();
            $table->timestamp('valid_until')->nullable()->index();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();

            $table->unique(['hosting_account_id', 'domain', 'status'], 'hosting_ssl_account_domain_status_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hosting_ssl_certificates');
    }
};
