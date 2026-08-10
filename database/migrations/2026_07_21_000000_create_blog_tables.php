<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('blog_categories')) {
            Schema::create('blog_categories', function (Blueprint $table) {
                $table->id();
                $table->string('name', 100);
                $table->string('slug', 120)->unique();
                $table->text('description')->nullable();
                $table->string('seo_title', 160)->nullable();
                $table->string('seo_description', 320)->nullable();
                $table->unsignedInteger('sort_order')->default(0)->index();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (!Schema::hasTable('blog_posts')) {
            Schema::create('blog_posts', function (Blueprint $table) {
                $table->id();
                $table
                    ->foreignId('blog_category_id')
                    ->nullable()
                    ->constrained('blog_categories')
                    ->nullOnDelete();
                $table->integer('user_id')->nullable()->index();
                $table->string('title', 200);
                $table->string('slug', 220)->unique();
                $table->text('excerpt')->nullable();
                $table->longText('body');
                $table->string('featured_image', 2048)->nullable();
                $table->string('seo_title', 160)->nullable();
                $table->string('seo_description', 320)->nullable();
                $table->string('status', 20)->default('draft')->index();
                $table->dateTime('published_at')->nullable()->index();
                $table->timestamps();
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_posts');
        Schema::dropIfExists('blog_categories');
    }
};
