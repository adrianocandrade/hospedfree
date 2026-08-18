<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('pending_email')->nullable()->after('email');
            $table->string('pending_email_verification_hash')->nullable();
            $table->timestamp('pending_email_requested_at')->nullable();
            $table->index('pending_email');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['pending_email']);
            $table->dropColumn([
                'pending_email',
                'pending_email_verification_hash',
                'pending_email_requested_at',
            ]);
        });
    }
};
