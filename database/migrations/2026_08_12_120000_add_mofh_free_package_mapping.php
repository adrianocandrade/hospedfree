<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $planId = DB::table('hosting_plans')
            ->where('type', 'free')
            ->orderBy('id')
            ->value('id');

        if (!$planId) {
            return;
        }

        DB::table('hosting_provider_packages')->updateOrInsert(
            [
                'hosting_plan_id' => $planId,
                'provider' => 'mofh',
            ],
            [
                'remote_package' => 'free',
                'is_active' => true,
                'metadata' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );
    }

    public function down(): void
    {
        DB::table('hosting_provider_packages')
            ->where('provider', 'mofh')
            ->where('remote_package', 'free')
            ->delete();
    }
};
