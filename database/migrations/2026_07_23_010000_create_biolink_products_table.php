<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('biolink_products')) {
            return;
        }

        Schema::create('biolink_products', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('biolink_id')->constrained('biolinks')->cascadeOnDelete();
            $table->string('legacy_key', 160)->nullable();
            $table->string('name', 160);
            $table->text('description')->nullable();
            $table->string('image', 2048)->nullable();
            $table->decimal('price', 12, 2)->nullable();
            $table->string('currency', 3)->nullable();
            $table->string('url', 2048)->nullable();
            $table->boolean('active')->default(true);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['biolink_id', 'legacy_key']);
            $table->index(['biolink_id', 'active', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('biolink_products');
    }
};
