<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('hosting_checkout_attempts', function (Blueprint $table): void {
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamp('last_checked_at')->nullable()->index();
            $table->string('failure_code', 80)->nullable()->index();
        });

        $graceMinutes = max(
            15,
            (int) config('hospedfree.checkout_attempt_grace_minutes', 60),
        );

        DB::table('hosting_checkout_attempts')
            ->whereNull('expires_at')
            ->select(['id', 'created_at'])
            ->orderBy('id')
            ->chunkById(200, function ($attempts) use ($graceMinutes): void {
                foreach ($attempts as $attempt) {
                    $createdAt = $attempt->created_at
                        ? Carbon::parse($attempt->created_at)
                        : now();

                    DB::table('hosting_checkout_attempts')
                        ->where('id', $attempt->id)
                        ->whereNull('expires_at')
                        ->update([
                            'expires_at' => $createdAt->addMinutes(
                                $graceMinutes,
                            ),
                        ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('hosting_checkout_attempts', function (Blueprint $table): void {
            $table->dropIndex(['expires_at']);
            $table->dropIndex(['last_checked_at']);
            $table->dropIndex(['failure_code']);
            $table->dropColumn([
                'expires_at',
                'last_checked_at',
                'failure_code',
            ]);
        });
    }
};
