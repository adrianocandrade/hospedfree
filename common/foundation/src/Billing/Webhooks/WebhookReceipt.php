<?php

namespace Common\Billing\Webhooks;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class WebhookReceipt
{
    public function begin(string $gateway, string $eventId, string $payload): bool
    {
        return DB::transaction(function () use ($gateway, $eventId, $payload): bool {
            $receipt = DB::table('billing_webhook_receipts')
                ->where('gateway', $gateway)
                ->where('event_id', $eventId)
                ->lockForUpdate()
                ->first();

            if ($receipt?->status === 'succeeded') {
                return false;
            }

            if (
                $receipt?->status === 'processing'
                && Carbon::parse($receipt->updated_at)->gt(now()->subMinutes(10))
            ) {
                return false;
            }

            if ($receipt) {
                DB::table('billing_webhook_receipts')->where('id', $receipt->id)->update([
                    'status' => 'processing',
                    'attempts' => $receipt->attempts + 1,
                    'payload_hash' => hash('sha256', $payload),
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('billing_webhook_receipts')->insert([
                    'gateway' => $gateway,
                    'event_id' => $eventId,
                    'payload_hash' => hash('sha256', $payload),
                    'status' => 'processing',
                    'attempts' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return true;
        });
    }

    public function complete(string $gateway, string $eventId): void
    {
        $this->finish($gateway, $eventId, 'succeeded');
    }

    public function fail(string $gateway, string $eventId): void
    {
        $this->finish($gateway, $eventId, 'failed');
    }

    private function finish(string $gateway, string $eventId, string $status): void
    {
        DB::table('billing_webhook_receipts')
            ->where('gateway', $gateway)
            ->where('event_id', $eventId)
            ->update([
                'status' => $status,
                'processed_at' => now(),
                'updated_at' => now(),
            ]);
    }
}
