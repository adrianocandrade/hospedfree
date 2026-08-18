<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('customer_security_events', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedInteger('user_id')->index();
            $table->string('event', 80)->index();
            $table->string('ip_address', 80)->nullable();
            $table->timestamp('created_at')->nullable()->index();
        });

        Schema::create('administrative_security_events', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedInteger('actor_user_id')->index();
            $table->string('event', 120)->index();
            $table->string('target_type', 120)->index();
            $table->string('target_id')->nullable()->index();
            $table->string('ip_address', 80)->nullable();
            $table->timestamp('created_at')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('administrative_security_events');
        Schema::dropIfExists('customer_security_events');
    }
};
