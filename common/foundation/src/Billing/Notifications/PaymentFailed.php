<?php

namespace Common\Billing\Notifications;

use App\Models\User;
use Common\Billing\Subscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentFailed extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Subscription $subscription)
    {
    }

    public function via(mixed $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(User $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject($this->mainLine())
            ->level('error')
            ->greeting(__('Hello, :name', ['name' => $notifiable->name]))
            ->line($this->descriptionLine())
            ->action(__('hospedfree-notifications.billing.payment_failed.action'), $this->mainAction());
    }

    public function toArray(mixed $notifiable): array
    {
        return [
            'lines' => [
                [
                    'content' => $this->mainLine(),
                ],
                [
                    'content' => $this->descriptionLine(),
                ],
            ],
            'buttonActions' => [
                [
                    'label' => __('hospedfree-notifications.billing.payment_failed.action'),
                    'action' => $this->mainAction(),
                ],
            ],
        ];
    }

    protected function mainLine(): string
    {
        return __('hospedfree-notifications.billing.payment_failed.subject', [
            'plan' => $this->subscription->product->name,
        ]);
    }

    protected function descriptionLine(): string
    {
        $planName = $this->subscription->product->name;
        return __('hospedfree-notifications.billing.payment_failed.line', [
            'plan' => $planName,
        ]);
    }

    protected function mainAction(): string
    {
        return config('app.url') . '/billing';
    }
}
