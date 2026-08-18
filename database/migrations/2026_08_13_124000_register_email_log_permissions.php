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
        // Keep permission rollback additive because custom roles may use them.
    }
};
