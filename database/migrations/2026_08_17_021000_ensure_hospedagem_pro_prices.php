<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::transaction(function (): void {
            $productId = DB::table('hosting_provider_packages')
                ->join(
                    'hosting_plans',
                    'hosting_plans.id',
                    '=',
                    'hosting_provider_packages.hosting_plan_id',
                )
                ->where('hosting_provider_packages.provider', 'mofh')
                ->where('hosting_provider_packages.remote_package', 'pro')
                ->value('hosting_plans.product_id');

            if ($productId === null) {
                return;
            }

            $now = now();
            $approvedPrices = [
                [
                    'amount' => '9.90',
                    'currency' => 'brl',
                    'interval' => 'month',
                    'interval_count' => 1,
                    'default' => true,
                ],
                [
                    'amount' => '99.00',
                    'currency' => 'brl',
                    'interval' => 'year',
                    'interval_count' => 1,
                    'default' => false,
                ],
            ];
            $approvedPriceIds = [];

            foreach ($approvedPrices as $approvedPrice) {
                $approvedPriceId = DB::table('prices')
                    ->where('product_id', $productId)
                    ->where('active', true)
                    ->where('amount', $approvedPrice['amount'])
                    ->whereRaw('LOWER(currency) = ?', [
                        $approvedPrice['currency'],
                    ])
                    ->whereRaw('LOWER(`interval`) = ?', [
                        $approvedPrice['interval'],
                    ])
                    ->where(
                        'interval_count',
                        $approvedPrice['interval_count'],
                    )
                    ->orderByRaw(
                        'CASE WHEN stripe_id IS NOT NULL OR paypal_id IS NOT NULL THEN 0 ELSE 1 END',
                    )
                    ->orderBy('id')
                    ->value('id');

                if ($approvedPriceId === null) {
                    $approvedPriceId = DB::table('prices')->insertGetId([
                        'product_id' => $productId,
                        ...$approvedPrice,
                        'active' => true,
                        'stripe_id' => null,
                        'paypal_id' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                } else {
                    DB::table('prices')
                        ->where('id', $approvedPriceId)
                        ->update([
                            ...$approvedPrice,
                            'active' => true,
                            'updated_at' => $now,
                        ]);
                }

                $approvedPriceIds[] = $approvedPriceId;
            }

            DB::table('prices')
                ->where('product_id', $productId)
                ->where('active', true)
                ->whereNotIn('id', $approvedPriceIds)
                ->update([
                    'active' => false,
                    'updated_at' => $now,
                ]);
        });
    }

    public function down(): void
    {
        // Prices may be referenced by subscriptions, invoices, or gateways.
        // Keep every catalog version intact during an application rollback.
    }
};
