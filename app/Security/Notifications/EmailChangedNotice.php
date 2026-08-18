<?php

namespace App\Security\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmailChangedNotice extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject(__('E-mail da conta HospedFree alterado'))
            ->greeting(__('Olá!'))
            ->line(__('O endereço de e-mail da sua conta HospedFree foi alterado.'))
            ->line(__('Se você não realizou essa alteração, redefina sua senha e entre em contato com o suporte imediatamente.'))
            ->line(__('Nenhuma ação é necessária se a alteração foi feita por você.'));
    }
}
