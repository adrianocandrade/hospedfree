<?php

namespace Tests\Unit;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class PortugueseLocalizationMigrationTest extends TestCase
{
    public function test_migration_adds_pt_br_and_preserves_legacy_pt_as_pt_pt(): void
    {
        $this->useInMemoryDatabase();
        $this->createTestTables();

        DB::table('localizations')->insert([
            'name' => 'Português',
            'language' => 'pt',
            'direction' => 'ltr',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('users')->insert(['language' => 'pt']);
        DB::table('settings')->insert([
            'name' => 'locale.default',
            'value' => 'pt',
        ]);

        $migration = require database_path(
            'migrations/2026_07_20_000000_add_brazilian_portuguese_localization.php',
        );

        $migration->up();

        $this->assertDatabaseHas('localizations', [
            'name' => 'Português (Brasil)',
            'language' => 'pt-BR',
            'direction' => 'ltr',
        ]);
        $this->assertDatabaseHas('localizations', [
            'name' => 'Português (Portugal)',
            'language' => 'pt-PT',
            'direction' => 'ltr',
        ]);
        $this->assertDatabaseMissing('localizations', ['language' => 'pt']);
        $this->assertDatabaseHas('users', ['language' => 'pt-PT']);
        $this->assertDatabaseHas('settings', [
            'name' => 'locale.default',
            'value' => 'pt-PT',
        ]);
    }

    private function useInMemoryDatabase(): void
    {
        Config::set('database.default', 'sqlite');
        Config::set('database.connections.sqlite.database', ':memory:');

        DB::purge('sqlite');
        DB::reconnect('sqlite');
    }

    private function createTestTables(): void
    {
        Schema::create('localizations', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name');
            $table->string('language', 5)->nullable();
            $table->string('direction', 10)->default('ltr');
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->increments('id');
            $table->string('language', 5)->nullable();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name')->unique();
            $table->text('value');
        });
    }
}
