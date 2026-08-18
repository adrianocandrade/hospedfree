<?php

namespace App\Security\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerifyEmailChange extends Notification
{
    public function __construct(public readonly string $code) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject(__('Confirm your new :site email', [
                'site' => config('app.name'),
            ]))
            ->greeting(__('Confirm your new email address'))
            ->line(__('Use this security code to finish changing your email:'))
            ->line($this->code)
            ->line(__('This code expires in 30 minutes.'))
            ->line(__('If you did not request this change, ignore this email and review your account security.'));
    }
}
