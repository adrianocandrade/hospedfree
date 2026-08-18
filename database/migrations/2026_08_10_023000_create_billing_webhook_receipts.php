<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('billing_webhook_receipts', function (Blueprint $table): void {
            $table->id();
            $table->string('gateway', 30);
            $table->string('event_id', 190);
            $table->string('payload_hash', 64);
            $table->string('status', 20)->index();
            $table->unsignedSmallInteger('attempts')->default(1);
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            $table->unique(['gateway', 'event_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_webhook_receipts');
    }
};
