<?php

namespace Tests\Feature\Security;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SecurityHistoryRetentionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');
        DB::reconnect('sqlite');

        Schema::create('customer_communications', function (Blueprint $table): void {
            $table->id();
            $table->timestamps();
        });
        Schema::create('customer_security_events', function (Blueprint $table): void {
            $table->id();
            $table->timestamp('created_at')->nullable();
        });
        Schema::create('administrative_security_events', function (Blueprint $table): void {
            $table->id();
            $table->timestamp('created_at')->nullable();
        });
        Schema::create('user_sessions', function (Blueprint $table): void {
            $table->id();
            $table->timestamps();
        });
    }

    public function test_it_prunes_only_security_history_older_than_each_retention_period(): void
    {
        config()->set('hospedfree.retention.customer_communications_days', 10);
        config()->set('hospedfree.retention.security_events_days', 20);
        config()->set('hospedfree.retention.administrative_audit_days', 30);
        config()->set('hospedfree.retention.user_sessions_days', 40);

        $this->insertOldAndCurrent('customer_communications', 11, 9);
        $this->insertOldAndCurrent('customer_security_events', 21, 19);
        $this->insertOldAndCurrent('administrative_security_events', 31, 29);
        $this->insertOldAndCurrent('user_sessions', 41, 39);

        $this->assertSame(0, Artisan::call('security-history:prune'));

        foreach (
            [
                'customer_communications',
                'customer_security_events',
                'administrative_security_events',
                'user_sessions',
            ] as $table
        ) {
            $this->assertSame(1, DB::table($table)->count());
        }
    }

    private function insertOldAndCurrent(
        string $table,
        int $oldDays,
        int $currentDays,
    ): void {
        $rows = [
            ['created_at' => now()->subDays($oldDays)],
            ['created_at' => now()->subDays($currentDays)],
        ];

        if (Schema::hasColumn($table, 'updated_at')) {
            $rows[0]['updated_at'] = now()->subDays($oldDays);
            $rows[1]['updated_at'] = now()->subDays($currentDays);
        }

        DB::table($table)->insert($rows);
    }
}
