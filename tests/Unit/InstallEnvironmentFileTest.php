<?php

namespace Tests\Unit;

use Common\Core\Install\CheckSiteHealth;
use Tests\TestCase;

class InstallEnvironmentFileTest extends TestCase
{
    public function test_health_check_uses_the_available_dot_env_file(): void
    {
        config(['app.installed' => false]);

        $results = (new CheckSiteHealth())->execute();
        $paths = array_map(
            fn(string $path) => str_replace('\\', '/', $path),
            array_column(
                $results['results']['filesystem']['items'],
                'path',
            ),
        );
        $expectedPath = file_exists(base_path('.env'))
            ? base_path('.env')
            : base_path('.env.example');
        $expectedPath = str_replace('\\', '/', $expectedPath);

        $this->assertContains($expectedPath, $paths);
        $this->assertNotContains(
            str_replace('\\', '/', base_path('env.example')),
            $paths,
        );
    }

    public function test_installer_sources_use_the_standard_dot_env_example_name(): void
    {
        $files = [
            'public/index.php',
            'common/foundation/src/Core/Install/CheckSiteHealth.php',
            'common/foundation/src/Core/Install/InstallController.php',
            'common/foundation/src/Core/Install/UpdateActions.php',
        ];

        foreach ($files as $file) {
            $source = file_get_contents(base_path($file));

            $this->assertSame(
                0,
                preg_match_all('/(?<!\.)env\.example/', $source),
                "$file still references the legacy env.example filename.",
            );
        }
    }
}
