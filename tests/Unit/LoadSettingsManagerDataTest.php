<?php

namespace Tests\Unit;

use Tests\TestCase;

class LoadSettingsManagerDataTest extends TestCase
{
    public function test_settings_manager_uses_laravel_cache_facade(): void
    {
        $source = file_get_contents(
            base_path(
                'common/foundation/src/Settings/Manager/LoadSettingsManagerData.php',
            ),
        );

        $this->assertIsString($source);
        $this->assertStringContainsString(
            'use Illuminate\Support\Facades\Cache;',
            $source,
        );
        $this->assertStringContainsString('Cache::get(', $source);
    }
}
