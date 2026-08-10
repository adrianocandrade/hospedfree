<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (
            !Schema::hasTable('biolink_widgets') ||
            !Schema::hasTable('biolink_widget_items') ||
            !Schema::hasTable('biolink_products')
        ) {
            return;
        }

        DB::table('biolink_widgets')
            ->where('type', 'linkedProduct')
            ->orderBy('id')
            ->chunkById(100, function ($widgets): void {
                foreach ($widgets as $widget) {
                    $config = json_decode($widget->config ?: '{}', true) ?: [];

                    if (($config['source'] ?? null) === 'catalog') {
                        continue;
                    }

                    $items = DB::table('biolink_widget_items')
                        ->where('biolink_widget_id', $widget->id)
                        ->orderBy('sort_order')
                        ->orderBy('id')
                        ->get();
                    $productIds = [];

                    foreach ($items as $item) {
                        $legacyKey = "widget:{$widget->id}:item:{$item->id}";
                        $product = DB::table('biolink_products')
                            ->where('biolink_id', $widget->biolink_id)
                            ->where('legacy_key', $legacyKey)
                            ->first();

                        if (!$product) {
                            $productId = DB::table('biolink_products')->insertGetId([
                                'biolink_id' => $widget->biolink_id,
                                'legacy_key' => $legacyKey,
                                'name' => $item->title ?: 'Produto',
                                'description' => $item->description,
                                'image' => $item->image,
                                'price' => $item->price,
                                'currency' => $item->currency,
                                'url' => $item->url,
                                'active' => $item->active,
                                'position' => $item->sort_order,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        } else {
                            $productId = $product->id;

                            if ($product->deleted_at) {
                                DB::table('biolink_products')
                                    ->where('id', $productId)
                                    ->update([
                                        'deleted_at' => null,
                                        'updated_at' => now(),
                                    ]);
                            }
                        }

                        $productIds[] = $productId;
                    }

                    $config['source'] = 'catalog';
                    $config['productIds'] = $productIds;

                    DB::table('biolink_widgets')
                        ->where('id', $widget->id)
                        ->update([
                            'config' => json_encode($config),
                            'updated_at' => now(),
                        ]);
                }
            });
    }

    public function down(): void
    {
        // Keep migrated catalog products and widget configuration intact.
    }
};
