<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hosting_premium_subdomains', function (
            Blueprint $table,
        ): void {
            $table->id();
            $table->unsignedBigInteger('hosting_zone_id')->index();
            $table->string('label', 4);
            $table->unsignedBigInteger('annual_price_id')->nullable()->index();
            $table->unsignedInteger('assigned_user_id')->nullable()->index();
            $table->unsignedInteger('subscription_id')->nullable()->unique();
            $table->timestamp('complimentary_until')->nullable();
            $table->unsignedInteger('reserved_user_id')->nullable()->index();
            $table->timestamp('reservation_expires_at')->nullable()->index();
            $table->boolean('is_active')->default(true)->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['hosting_zone_id', 'label']);
            $table
                ->foreign('hosting_zone_id')
                ->references('id')
                ->on('hosting_zones')
                ->restrictOnDelete();
            $table
                ->foreign('annual_price_id')
                ->references('id')
                ->on('prices')
                ->restrictOnDelete();
            $table
                ->foreign('assigned_user_id')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table
                ->foreign('reserved_user_id')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table
                ->foreign('subscription_id')
                ->references('id')
                ->on('subscriptions')
                ->restrictOnDelete();
        });

        Schema::create('hosting_premium_subdomain_purchases', function (
            Blueprint $table,
        ): void {
            $table->id();
            $table->uuid('uuid')->unique('hf_prem_purchase_uuid_uq');
            $table
                ->unsignedBigInteger('premium_subdomain_id')
                ->index('hf_prem_purchase_offer_idx');
            $table
                ->unsignedInteger('user_id')
                ->index('hf_prem_purchase_user_idx');
            $table
                ->unsignedBigInteger('price_id')
                ->index('hf_prem_purchase_price_idx');
            $table
                ->unsignedInteger('subscription_id')
                ->nullable()
                ->unique('hf_prem_purchase_subscription_uq');
            $table
                ->string('status', 32)
                ->default('pending')
                ->index('hf_prem_purchase_status_idx');
            $table->string('gateway', 16)->nullable();
            $table->string('gateway_subscription_id', 191)->nullable();
            $table
                ->string('failure_code', 64)
                ->nullable()
                ->index('hf_prem_purchase_failure_idx');
            $table
                ->timestamp('expires_at')
                ->index('hf_prem_purchase_expires_idx');
            $table->timestamps();

            $table->unique(
                ['gateway', 'gateway_subscription_id'],
                'hf_prem_purchase_gateway_uq',
            );
            $table
                ->foreign('premium_subdomain_id', 'hf_prem_purchase_offer_fk')
                ->references('id')
                ->on('hosting_premium_subdomains')
                ->restrictOnDelete();
            $table
                ->foreign('user_id', 'hf_prem_purchase_user_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table
                ->foreign('price_id', 'hf_prem_purchase_price_fk')
                ->references('id')
                ->on('prices')
                ->restrictOnDelete();
            $table
                ->foreign('subscription_id', 'hf_prem_purchase_subscription_fk')
                ->references('id')
                ->on('subscriptions')
                ->restrictOnDelete();
        });

        Schema::table('hosting_orders', function (Blueprint $table): void {
            $table
                ->unsignedBigInteger('premium_subdomain_id')
                ->nullable()
                ->index()
                ->after('hosting_zone_id');
            $table
                ->foreign('premium_subdomain_id')
                ->references('id')
                ->on('hosting_premium_subdomains')
                ->restrictOnDelete();
        });

        Schema::table('hosting_accounts', function (Blueprint $table): void {
            $table
                ->unsignedBigInteger('premium_subdomain_id')
                ->nullable()
                ->index()
                ->after('hosting_zone_id');
            $table
                ->foreign('premium_subdomain_id')
                ->references('id')
                ->on('hosting_premium_subdomains')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('hosting_accounts', function (Blueprint $table): void {
            $table->dropForeign(['premium_subdomain_id']);
            $table->dropColumn('premium_subdomain_id');
        });
        Schema::table('hosting_orders', function (Blueprint $table): void {
            $table->dropForeign(['premium_subdomain_id']);
            $table->dropColumn('premium_subdomain_id');
        });
        Schema::dropIfExists('hosting_premium_subdomain_purchases');
        Schema::dropIfExists('hosting_premium_subdomains');
    }
};
