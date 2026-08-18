<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('support_ticket_attachments')) {
            return;
        }

        Schema::create('support_ticket_attachments', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('support_ticket_message_id')->index();
            $table->unsignedInteger('user_id')->nullable()->index();
            $table->string('disk', 40)->default('local');
            $table->string('path');
            $table->string('file_name', 255);
            $table->string('mime_type', 120)->nullable();
            $table->unsignedBigInteger('size');
            $table->timestamps();

            $table->index(['support_ticket_message_id', 'created_at'], 'sta_message_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_ticket_attachments');
    }
};
