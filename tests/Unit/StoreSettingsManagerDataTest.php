<?php

namespace Tests\Unit;

use Common\Settings\DotEnvEditor;
use Common\Settings\Events\SettingsSaved;
use Common\Settings\Manager\StoreSettingsManagerData;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class StoreSettingsManagerDataTest extends TestCase
{
    public function test_server_setting_changes_clear_cached_configuration(): void
    {
        $dotEnvEditor = new class extends DotEnvEditor {
            public array $writes = [];

            public function write(array|Collection $values = []): void
            {
                $this->writes[] = $values;
            }
        };

        $this->app->instance(DotEnvEditor::class, $dotEnvEditor);

        $artisan = new FakeArtisan();
        $cache = new FakeCache();
        Event::fake([SettingsSaved::class]);
        Artisan::swap($artisan);
        Cache::swap($cache);

        app(StoreSettingsManagerData::class)->execute([
            'server' => ['github_id' => 'new-client-id'],
            'client' => [],
            'custom_code' => [],
            'seo' => [],
            'themes' => [],
        ]);

        $this->assertSame(
            [['github_id' => 'new-client-id']],
            $dotEnvEditor->writes,
        );
        $this->assertSame(['config:clear'], $artisan->commands);
        $this->assertSame(1, $cache->flushes);
    }
}

class FakeArtisan
{
    public array $commands = [];

    public function call(string $command): int
    {
        $this->commands[] = $command;

        return 0;
    }
}

class FakeCache
{
    public int $flushes = 0;

    public function get(string $key): mixed
    {
        return null;
    }

    public function set(string $key, mixed $value, mixed $ttl = null): bool
    {
        return true;
    }

    public function flush(): bool
    {
        $this->flushes++;

        return true;
    }
}
