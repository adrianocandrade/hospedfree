<?php

use Common\Core\Install\CreateDefaultMenus;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    public function up(): void
    {
        app(CreateDefaultMenus::class)->execute();
    }

    public function down(): void
    {
        // Keep restored and user-edited menus intact.
    }
};
