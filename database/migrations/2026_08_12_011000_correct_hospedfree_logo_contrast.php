<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        foreach ([
            'branding.logo_dark' => 'images/logo-white.png',
            'branding.logo_light' => 'images/logo-1.png',
        ] as $name => $value) {
            DB::table('settings')->updateOrInsert(
                ['name' => $name],
                ['value' => $value, 'updated_at' => now()],
            );
        }
    }

    public function down(): void
    {
        // Logo rollback is performed with the release rollback or admin settings.
    }
};
