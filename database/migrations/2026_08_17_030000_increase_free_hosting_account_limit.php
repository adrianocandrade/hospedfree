<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::table('hosting_plans')
            ->where('type', 'free')
            ->where('max_accounts_per_workspace', '<', 2)
            ->update([
                'max_accounts_per_workspace' => 2,
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        DB::table('hosting_plans')
            ->where('type', 'free')
            ->where('max_accounts_per_workspace', 2)
            ->update([
                'max_accounts_per_workspace' => 1,
                'updated_at' => now(),
            ]);
    }
};
