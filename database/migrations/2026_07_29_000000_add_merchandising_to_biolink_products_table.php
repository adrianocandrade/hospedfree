<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('biolink_products')) {
            return;
        }

        Schema::table('biolink_products', function (Blueprint $table): void {
            $table->decimal('compare_price', 12, 2)->nullable()->after('price');
            $table->string('badge', 40)->nullable()->after('currency');
            $table->decimal('rating', 2, 1)->nullable()->after('badge');
            $table->string('stock_label', 80)->nullable()->after('rating');
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('biolink_products')) {
            return;
        }

        Schema::table('biolink_products', function (Blueprint $table): void {
            $table->dropColumn([
                'compare_price',
                'badge',
                'rating',
                'stock_label',
            ]);
        });
    }
};
