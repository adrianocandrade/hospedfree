<?php

namespace Common\Billing\Notifications;

use App\Models\User;
use Common\Billing\Invoices\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewInvoiceAvailable extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Invoice $invoice)
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
            ->level('success')
            ->greeting(__('Hello, :name', ['name' => $notifiable->name]))
            ->line($this->descriptionLine())
            ->action(__('hospedfree-notifications.billing.invoice_available.action'), $this->mainAction());
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
                    'label' => __('hospedfree-notifications.billing.invoice_available.action'),
                    'action' => $this->mainAction(),
                ],
            ],
        ];
    }

    protected function mainLine(): string
    {
        return __('hospedfree-notifications.billing.invoice_available.subject');
    }

    protected function descriptionLine(): string
    {
        return __('hospedfree-notifications.billing.invoice_available.line');
    }

    protected function mainAction(): string
    {
        return config('app.url') . '/billing/invoices/' . $this->invoice->uuid;
    }
}
