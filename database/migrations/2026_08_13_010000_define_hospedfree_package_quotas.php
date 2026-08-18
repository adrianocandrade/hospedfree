<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $packages = [
            'free' => [
                'disk_mb' => 5120,
                'bandwidth_mb' => 50000,
                'domains' => 2,
                'databases' => 2,
                'ad_free' => true,
            ],
            'pro' => [
                'disk_mb' => 10240,
                'bandwidth_mb' => 150000,
                'domains' => 5,
                'databases' => 10,
                'ad_free' => true,
            ],
        ];

        foreach ($packages as $remotePackage => $quotas) {
            $planIds = DB::table('hosting_provider_packages')
                ->where('provider', 'mofh')
                ->whereRaw('LOWER(remote_package) = ?', [$remotePackage])
                ->pluck('hosting_plan_id');

            if ($remotePackage === 'free') {
                $planIds = $planIds
                    ->merge(
                        DB::table('hosting_plans')
                            ->where('type', 'free')
                            ->pluck('id'),
                    )
                    ->unique();
            }

            foreach ($planIds as $planId) {
                $current = DB::table('hosting_plans')
                    ->where('id', $planId)
                    ->value('quotas');
                $current = $current ? json_decode($current, true) : [];

                DB::table('hosting_plans')
                    ->where('id', $planId)
                    ->update([
                        'quotas' => json_encode(
                            array_merge(
                                is_array($current) ? $current : [],
                                $quotas,
                            ),
                            JSON_UNESCAPED_UNICODE,
                        ),
                        'updated_at' => now(),
                    ]);
            }
        }
    }

    public function down(): void
    {
        // Quotas may be edited by the administrator after this migration.
        // Keep the configured commercial data during an application rollback.
    }
};
