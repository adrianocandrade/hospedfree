<?php

namespace App\Mail;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TestEmailNotification extends Notification
{
    public function __construct(
        private readonly Notification $template,
        private readonly TestEmailTemplate $templateType,
    ) {}

    public function via(): array
    {
        return ['mail'];
    }

    public function toMail(mixed $notifiable): MailMessage
    {
        /** @var MailMessage $message */
        $message = $this->template->toMail($notifiable);
        $subject = $message->subject ?: $this->templateType->label();

        return $message->subject("[TEST] {$subject}");
    }
}
