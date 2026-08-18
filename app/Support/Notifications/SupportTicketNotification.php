<?php

namespace App\Support\Notifications;

use App\Models\User;
use App\Support\Enums\SupportTicketNotificationType;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SupportTicketNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public SupportTicketNotificationType $type,
        public int $ticketId,
        public ?string $status = null,
        public ?string $activity = null,
    ) {
        $this->afterCommit();
    }

    public function via(mixed $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(User $notifiable): MailMessage
    {
        $message = (new MailMessage())
            ->subject($this->translate('subject'))
            ->greeting(__('hospedfree-notifications.greeting', [
                'name' => $notifiable->name,
            ]));

        foreach ($this->lines() as $line) {
            $message->line($line);
        }

        return $message->action($this->translate('action'), $this->actionUrl());
    }

    public function toArray(mixed $notifiable): array
    {
        return [
            'type' => $this->type->value,
            'ticket_id' => $this->ticketId,
            'lines' => collect($this->lines())
                ->map(fn(string $line) => ['content' => $line])
                ->values()
                ->all(),
            'buttonActions' => [
                [
                    'label' => $this->translate('action'),
                    'action' => $this->actionUrl(),
                ],
            ],
        ];
    }

    /**
     * @return array<int, string>
     */
    private function lines(): array
    {
        return array_values(array_filter([
            $this->translate('line_1'),
            $this->translate('line_2'),
        ]));
    }

    private function translate(string $key): string
    {
        return __("hospedfree-notifications.support.{$this->type->value}.{$key}", [
            'ticket' => $this->ticketId,
            'status' => $this->translatedStatus(),
            'activity' => $this->translatedActivity(),
        ]);
    }

    private function translatedStatus(): string
    {
        return __("hospedfree-notifications.support_status.{$this->status}");
    }

    private function translatedActivity(): string
    {
        return __("hospedfree-notifications.support_activity.{$this->activity}");
    }

    private function actionUrl(): string
    {
        $path = $this->type === SupportTicketNotificationType::StaffActivity
            ? '/admin/support'
            : '/dashboard/support';

        return rtrim((string) config('app.url'), '/') . $path;
    }
}
