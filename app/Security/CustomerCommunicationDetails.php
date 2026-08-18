<?php

namespace App\Security;

use App\Hosting\Notifications\HostingAccountNotification;
use App\Security\Notifications\VerifyEmailChange;
use App\Security\Notifications\EmailChangedNotice;
use App\Support\Notifications\SupportTicketNotification;
use Common\Auth\Notifications\VerifyEmailWithOtp;
use Common\Billing\Notifications\NewInvoiceAvailable;
use Common\Billing\Notifications\PaymentFailed;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;
use Throwable;

class CustomerCommunicationDetails
{
    /** @return array{kind: string, subject: string}|null */
    public function for(Notification $notification, object $notifiable): ?array
    {
        $kind = match (true) {
            $notification instanceof HostingAccountNotification =>
                'hosting.' . $notification->type->value,
            $notification instanceof SupportTicketNotification =>
                'support.' . $notification->type->value,
            $notification instanceof NewInvoiceAvailable => 'billing.invoice_available',
            $notification instanceof PaymentFailed => 'billing.payment_failed',
            $notification instanceof VerifyEmailChange => 'security.email_change',
            $notification instanceof EmailChangedNotice => 'security.email_changed_notice',
            $notification instanceof VerifyEmailWithOtp => 'security.verification_code',
            $notification instanceof ResetPassword => 'security.password_reset',
            default => null,
        };

        if (!$kind) {
            return null;
        }

        return [
            'kind' => $kind,
            'subject' => $this->subject($notification, $notifiable, $kind),
        ];
    }

    private function subject(
        Notification $notification,
        object $notifiable,
        string $kind,
    ): string {
        $securitySubject = match ($kind) {
            'security.email_change' => __('Confirmação de alteração de e-mail'),
            'security.email_changed_notice' => __('E-mail da conta alterado'),
            'security.verification_code' => __('Código de segurança da conta'),
            'security.password_reset' => __('Redefinição de senha'),
            default => null,
        };

        if ($securitySubject) {
            return $securitySubject;
        }

        try {
            $message = $notification->toMail($notifiable);
            $subject = $message instanceof MailMessage ? $message->subject : null;
        } catch (Throwable) {
            $subject = null;
        }

        return Str::limit(
            trim(strip_tags((string) ($subject ?: __('Notificação da HospedFree')))),
            240,
            '…',
        );
    }
}
