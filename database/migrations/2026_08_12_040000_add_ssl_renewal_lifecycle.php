<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('hosting_ssl_certificates', function (Blueprint $table): void {
            $table->string('renewal_status', 40)->nullable()->index()->after('installation_status');
            $table->string('renewal_order_id')->nullable()->index()->after('remote_order_id');
            $table->json('renewal_dns_validation')->nullable()->after('dns_validation');
            $table->timestamp('renewal_requested_at')->nullable()->after('last_checked_at');
            $table->timestamp('renewal_retry_after')->nullable()->index()->after('renewal_requested_at');
            $table->timestamp('last_renewed_at')->nullable()->after('renewal_retry_after');
        });
    }

    public function down(): void
    {
        Schema::table('hosting_ssl_certificates', function (Blueprint $table): void {
            $table->dropColumn([
                'renewal_status',
                'renewal_order_id',
                'renewal_dns_validation',
                'renewal_requested_at',
                'renewal_retry_after',
                'last_renewed_at',
            ]);
        });
    }
};
