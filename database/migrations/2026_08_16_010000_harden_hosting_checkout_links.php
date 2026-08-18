<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table): void {
            $table->string('checkout_reference', 80)->nullable()->index();
        });

        Schema::table('hosting_orders', function (Blueprint $table): void {
            $table->char('request_fingerprint', 64)->nullable()->after('idempotency_key');
        });

        $this->assertNoDuplicateSubscriptionLinks('hosting_orders');
        $this->assertNoDuplicateSubscriptionLinks('hosting_accounts');

        Schema::table('hosting_orders', function (Blueprint $table): void {
            $table->unique('subscription_id');
        });
        Schema::table('hosting_accounts', function (Blueprint $table): void {
            $table->unique('subscription_id');
        });

        Schema::create('hosting_checkout_attempts', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('hosting_order_id')->index();
            $table->unsignedInteger('user_id')->index();
            $table->string('gateway', 20);
            $table->string('gateway_subscription_id', 191);
            $table->unsignedInteger('subscription_id')->nullable()->unique();
            $table->string('status', 20)->default('pending')->index();
            $table->timestamps();

            $table->unique(
                ['gateway', 'gateway_subscription_id'],
                'hosting_checkout_gateway_subscription_unique',
            );
            $table->index(
                ['hosting_order_id', 'status'],
                'hosting_checkout_order_status_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hosting_checkout_attempts');

        Schema::table('hosting_accounts', function (Blueprint $table): void {
            $table->dropUnique(['subscription_id']);
        });
        Schema::table('hosting_orders', function (Blueprint $table): void {
            $table->dropUnique(['subscription_id']);
            $table->dropColumn('request_fingerprint');
        });
        Schema::table('subscriptions', function (Blueprint $table): void {
            $table->dropIndex(['checkout_reference']);
            $table->dropColumn('checkout_reference');
        });
    }

    private function assertNoDuplicateSubscriptionLinks(string $table): void
    {
        $hasDuplicates = DB::table($table)
            ->whereNotNull('subscription_id')
            ->select('subscription_id')
            ->groupBy('subscription_id')
            ->havingRaw('COUNT(*) > 1')
            ->exists();

        if ($hasDuplicates) {
            throw new RuntimeException(
                "Cannot enforce exclusive hosting subscriptions: duplicate links exist in {$table}.",
            );
        }
    }
};
