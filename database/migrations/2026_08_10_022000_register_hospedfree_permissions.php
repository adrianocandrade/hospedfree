<?php

use Common\Database\Seeders\PermissionTableSeeder;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    public function up(): void
    {
        app(PermissionTableSeeder::class)->run();
    }

    public function down(): void
    {
        // Permissions may already be attached to custom roles. Keep rollback additive.
    }
};
