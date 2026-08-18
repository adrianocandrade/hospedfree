<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hosting_plans', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('product_id')->unique();
            $table->string('type', 20)->index();
            $table->unsignedSmallInteger('max_accounts_per_workspace')->default(1);
            $table->json('quotas')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('hosting_provider_packages', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('hosting_plan_id')->index();
            $table->string('provider', 40)->index();
            $table->string('remote_package', 120);
            $table->boolean('is_active')->default(true)->index();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['hosting_plan_id', 'provider']);
            $table->unique(['provider', 'remote_package']);
        });

        Schema::create('hosting_zones', function (Blueprint $table): void {
            $table->id();
            $table->string('domain', 253)->unique();
            $table->boolean('is_default')->default(false)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('hosting_orders', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('workspace_id')->index();
            $table->unsignedInteger('user_id')->index();
            $table->unsignedBigInteger('hosting_plan_id')->index();
            $table->unsignedBigInteger('product_id')->index();
            $table->unsignedBigInteger('price_id')->nullable()->index();
            $table->unsignedInteger('subscription_id')->nullable()->index();
            $table->unsignedBigInteger('hosting_zone_id')->index();
            $table->string('subdomain', 63);
            $table->string('fqdn', 253)->index();
            $table->string('domain_reservation_key', 253)->nullable()->unique();
            $table->string('idempotency_key', 80)->unique();
            $table->string('status', 40)->index();
            $table->string('failure_code', 80)->nullable();
            $table->text('safe_failure_message')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('fulfilled_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'status']);
        });

        Schema::create('hosting_accounts', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('hosting_order_id')->unique();
            $table->unsignedBigInteger('workspace_id')->index();
            $table->unsignedInteger('user_id')->index();
            $table->unsignedBigInteger('hosting_plan_id')->index();
            $table->unsignedBigInteger('product_id')->index();
            $table->unsignedBigInteger('price_id')->nullable()->index();
            $table->unsignedInteger('subscription_id')->nullable()->index();
            $table->unsignedBigInteger('hosting_zone_id')->index();
            $table->string('provider', 40)->index();
            $table->string('provider_account_id', 120)->nullable();
            $table->string('username', 120)->nullable();
            $table->string('fqdn', 253)->index();
            $table->string('active_domain', 253)->nullable()->unique();
            $table->unsignedTinyInteger('free_slot')->nullable();
            $table->string('status', 40)->index();
            $table->string('desired_status', 40)->nullable()->index();
            $table->text('control_panel_url')->nullable();
            $table->text('webftp_url')->nullable();
            $table->text('installer_url')->nullable();
            $table->string('ftp_host', 253)->nullable();
            $table->string('sql_host', 253)->nullable();
            $table->text('credential_secret')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('suspended_at')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamp('deletion_requested_at')->nullable();
            $table->timestamp('deletes_at')->nullable()->index();
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['workspace_id', 'free_slot']);
            $table->unique(['provider', 'provider_account_id']);
            $table->index(['workspace_id', 'status']);
        });

        Schema::create('hosting_provider_operations', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('hosting_order_id')->nullable()->index();
            $table->unsignedBigInteger('hosting_account_id')->nullable()->index();
            $table->string('provider', 40)->index();
            $table->string('operation', 40)->index();
            $table->string('idempotency_key', 100)->unique();
            $table->string('request_fingerprint', 64)->nullable();
            $table->string('status', 40)->index();
            $table->unsignedSmallInteger('attempt_count')->default(0);
            $table->string('safe_code', 80)->nullable();
            $table->text('safe_message')->nullable();
            $table->timestamp('retry_after')->nullable()->index();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('hosting_account_events', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('hosting_account_id')->index();
            $table->unsignedInteger('actor_user_id')->nullable()->index();
            $table->string('event', 60)->index();
            $table->string('from_status', 40)->nullable();
            $table->string('to_status', 40)->nullable();
            $table->text('safe_message')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        $productId = DB::table('products')
            ->where('name', 'Hospedagem Free')
            ->value('id');

        if (!$productId) {
            $productId = DB::table('products')->insertGetId([
                'name' => 'Hospedagem Free',
                'description' => 'Hospedagem gratuita com endereço hsite.top.',
                'uuid' => (string) Str::uuid(),
                'feature_list' => json_encode([
                    'Endereço hsite.top',
                    'Painel de hospedagem',
                    'Base de conhecimento e suporte',
                ], JSON_UNESCAPED_UNICODE),
                'position' => 0,
                'recommended' => false,
                'free' => true,
                'hidden' => false,
                'trial_period_days' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $planId = DB::table('hosting_plans')->insertGetId([
            'product_id' => $productId,
            'type' => 'free',
            'max_accounts_per_workspace' => 1,
            'quotas' => null,
            'is_active' => true,
            'sort_order' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('hosting_provider_packages')->insert([
            'hosting_plan_id' => $planId,
            'provider' => 'fake',
            'remote_package' => 'free',
            'is_active' => true,
            'metadata' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('hosting_zones')->insert([
            'domain' => 'hsite.top',
            'is_default' => true,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('hosting_account_events');
        Schema::dropIfExists('hosting_provider_operations');
        Schema::dropIfExists('hosting_accounts');
        Schema::dropIfExists('hosting_orders');
        Schema::dropIfExists('hosting_zones');
        Schema::dropIfExists('hosting_provider_packages');
        Schema::dropIfExists('hosting_plans');
    }
};
