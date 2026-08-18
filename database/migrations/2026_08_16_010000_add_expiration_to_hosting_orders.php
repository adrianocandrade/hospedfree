<?php

use Carbon\CarbonImmutable;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('hosting_orders', function (Blueprint $table): void {
            $table
                ->timestamp('expires_at')
                ->nullable()
                ->after('cancelled_at')
                ->index();
        });

        $ttlMinutes = max(
            5,
            (int) config('hospedfree.order_payment_window_minutes', 30),
        );

        DB::table('hosting_orders')
            ->where('status', 'awaiting_payment')
            ->whereNull('expires_at')
            ->orderBy('id')
            ->chunkById(200, function ($orders) use ($ttlMinutes): void {
                foreach ($orders as $order) {
                    $createdAt = $order->created_at
                        ? CarbonImmutable::parse($order->created_at)
                        : now()->toImmutable();

                    DB::table('hosting_orders')
                        ->where('id', $order->id)
                        ->whereNull('expires_at')
                        ->update([
                            'expires_at' => $createdAt->addMinutes($ttlMinutes),
                        ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('hosting_orders', function (Blueprint $table): void {
            $table->dropIndex(['expires_at']);
            $table->dropColumn('expires_at');
        });
    }
};
