<?php

namespace App\Security;

use App\Models\User;
use Illuminate\Events\Dispatcher;
use Illuminate\Notifications\Events\NotificationFailed;
use Illuminate\Notifications\Events\NotificationSending;
use Illuminate\Notifications\Events\NotificationSent;
use Illuminate\Notifications\Notification;

class CustomerCommunicationSubscriber
{
    public function __construct(
        private readonly CustomerCommunicationRecorder $recorder,
    ) {}

    public function sending(NotificationSending $event): void
    {
        $this->record($event->notifiable, $event->notification, $event->channel, 'sending');
    }

    public function sent(NotificationSent $event): void
    {
        $this->record($event->notifiable, $event->notification, $event->channel, 'sent');
    }

    public function failed(NotificationFailed $event): void
    {
        $this->record($event->notifiable, $event->notification, $event->channel, 'failed');
    }

    public function subscribe(Dispatcher $events): array
    {
        return [
            NotificationSending::class => 'sending',
            NotificationSent::class => 'sent',
            NotificationFailed::class => 'failed',
        ];
    }

    private function record(
        mixed $notifiable,
        Notification $notification,
        string $channel,
        string $status,
    ): void {
        if (!$notifiable instanceof User) {
            return;
        }

        $this->recorder->record($notifiable, $notification, $channel, $status);
    }
}
