<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        $now = now();
        $productId = DB::table('products')
            ->where('name', 'Hospedagem Pro')
            ->value('id');

        if (!$productId) {
            $productId = DB::table('products')->insertGetId([
                'name' => 'Hospedagem Pro',
                'description' =>
                    'Hospedagem paga com mais recursos, domínios e bancos de dados.',
                'uuid' => (string) Str::uuid(),
                'feature_list' => json_encode(
                    [
                        '10 GB de espaço em disco',
                        '150 GB de tráfego mensal',
                        'Até 5 domínios',
                        'Até 10 bancos MySQL',
                        'Sem anúncios',
                    ],
                    JSON_UNESCAPED_UNICODE,
                ),
                'position' => 10,
                'recommended' => true,
                'free' => false,
                'hidden' => false,
                'trial_period_days' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $planId = DB::table('hosting_plans')
            ->where('product_id', $productId)
            ->value('id');

        $quotas = [
            'disk_mb' => 10240,
            'bandwidth_mb' => 150000,
            'domains' => 5,
            'databases' => 10,
            'ad_free' => true,
        ];

        if (!$planId) {
            $planId = DB::table('hosting_plans')->insertGetId([
                'product_id' => $productId,
                'type' => 'paid',
                'max_accounts_per_workspace' => 1,
                'quotas' => json_encode($quotas, JSON_UNESCAPED_UNICODE),
                'is_active' => true,
                'sort_order' => 10,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        } else {
            $current = DB::table('hosting_plans')
                ->where('id', $planId)
                ->value('quotas');
            $current = $current ? json_decode($current, true) : [];

            DB::table('hosting_plans')
                ->where('id', $planId)
                ->update([
                    'type' => 'paid',
                    'quotas' => json_encode(
                        array_merge(is_array($current) ? $current : [], $quotas),
                        JSON_UNESCAPED_UNICODE,
                    ),
                    'updated_at' => $now,
                ]);
        }

        $packageQuery = DB::table('hosting_provider_packages')->where([
            'hosting_plan_id' => $planId,
            'provider' => 'mofh',
        ]);

        if ($packageQuery->exists()) {
            $packageQuery->update([
                'remote_package' => 'pro',
                'is_active' => true,
                'metadata' => null,
                'updated_at' => $now,
            ]);
        } else {
            DB::table('hosting_provider_packages')->insert([
                'hosting_plan_id' => $planId,
                'provider' => 'mofh',
                'remote_package' => 'pro',
                'is_active' => true,
                'metadata' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        // Product and hosting catalog data can be edited by administrators.
        // Keep it intact during an application rollback.
    }
};
