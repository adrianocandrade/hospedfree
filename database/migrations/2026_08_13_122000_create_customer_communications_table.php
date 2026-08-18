<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('customer_communications', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedInteger('user_id')->index();
            $table->uuid('notification_id')->nullable()->index();
            $table->string('notification_type');
            $table->string('kind', 120)->index();
            $table->string('channel', 32)->default('mail')->index();
            $table->string('status', 32)->default('sending')->index();
            $table->string('subject')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['notification_id', 'user_id', 'channel'],
                'customer_communications_notification_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_communications');
    }
};
