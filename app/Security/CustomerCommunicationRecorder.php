<?php

namespace App\Security;

use App\Models\User;
use App\Security\Models\CustomerCommunication;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class CustomerCommunicationRecorder
{
    public function __construct(
        private readonly CustomerCommunicationDetails $details,
    ) {}

    public function record(
        User $user,
        Notification $notification,
        string $channel,
        string $status,
    ): void {
        if ($channel !== 'mail') {
            return;
        }

        $details = $this->details->for($notification, $user);
        if (!$details) {
            return;
        }

        if (blank($notification->id)) {
            $notification->id = (string) Str::uuid();
        }

        $notificationId = (string) $notification->id;
        $identity = [
            'notification_id' => $notificationId,
            'user_id' => $user->id,
            'channel' => $channel,
        ];

        $communication = CustomerCommunication::query()->firstOrNew($identity);
        if (!$communication->exists) {
            $communication->uuid = (string) Str::uuid7();
        }

        $communication->fill([
            'notification_type' => $notification::class,
            'kind' => $details['kind'],
            'subject' => $details['subject'],
            'status' => $status,
            'sent_at' => $status === 'sent' ? now() : $communication->sent_at,
            'failed_at' => $status === 'failed' ? now() : null,
        ])->save();
    }
}
