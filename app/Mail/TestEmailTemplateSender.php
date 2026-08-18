<?php

namespace App\Mail;

use App\Hosting\Enums\HostingAccountNotificationType;
use App\Hosting\Notifications\HostingAccountNotification;
use App\Models\User;
use App\Support\Enums\SupportTicketNotificationType;
use App\Support\Notifications\SupportTicketNotification;
use Common\Auth\Notifications\VerifyEmailWithOtp;
use Common\Billing\Invoices\Invoice;
use Common\Billing\Models\Product;
use Common\Billing\Notifications\NewInvoiceAvailable;
use Common\Billing\Notifications\PaymentFailed;
use Common\Billing\Subscription;
use Common\Notifications\ContactPageMessage;
use Common\Settings\Validators\MailCredentials\MailCredentialsMailable;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Contracts\Mail\Mailable;
use Illuminate\Notifications\Notification as NotificationTemplate;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Symfony\Component\Mime\Email;

class TestEmailTemplateSender
{
    public function send(
        TestEmailTemplate $template,
        string $recipient,
        User $actor,
    ): void {
        $notifiable = clone $actor;
        $notifiable->email = $recipient;

        $mailable = $this->mailableFor($template);
        if ($mailable) {
            if ($locale = $notifiable->preferredLocale()) {
                $mailable->locale($locale);
            }

            $mailable->withSymfonyMessage(function (Email $message): void {
                $message->subject('[TEST] ' . $message->getSubject());
            });

            Mail::to($recipient)->send($mailable);
            return;
        }

        $previousResetUrlCallback = ResetPassword::$createUrlCallback;
        if ($template === TestEmailTemplate::PasswordReset) {
            ResetPassword::createUrlUsing(
                fn(mixed $user, string $token) => url("password/reset/{$token}"),
            );
        }

        try {
            Notification::sendNow(
                $notifiable,
                new TestEmailNotification(
                    $this->notificationFor($template),
                    $template,
                ),
                ['mail'],
            );
        } finally {
            if ($template === TestEmailTemplate::PasswordReset) {
                ResetPassword::$createUrlCallback = $previousResetUrlCallback;
            }
        }
    }

    private function mailableFor(
        TestEmailTemplate $template,
    ): ?Mailable {
        return match ($template) {
            TestEmailTemplate::MailSetup => new MailCredentialsMailable(
                config('mail.primary', config('mail.default')),
            ),
            default => null,
        };
    }

    private function notificationFor(
        TestEmailTemplate $template,
    ): NotificationTemplate {
        return match ($template) {
            TestEmailTemplate::EmailVerification => new VerifyEmailWithOtp(
                '123456',
            ),
            TestEmailTemplate::PasswordReset => new ResetPassword(
                'test-password-reset-token',
            ),
            TestEmailTemplate::ContactMessage => new ContactPageMessage([
                'email' => 'visitor@example.com',
                'name' => __('Example visitor'),
                'message' => __(
                    'This is sample content for testing the contact email template.',
                ),
            ]),
            TestEmailTemplate::PaymentFailed => new PaymentFailed(
                $this->subscription(),
            ),
            TestEmailTemplate::InvoiceAvailable => new NewInvoiceAvailable(
                new Invoice(['uuid' => 'test-invoice']),
            ),
            TestEmailTemplate::HostingReady => $this->hostingNotification(
                HostingAccountNotificationType::Ready,
            ),
            TestEmailTemplate::HostingSuspended => $this->hostingNotification(
                HostingAccountNotificationType::Suspended,
            ),
            TestEmailTemplate::HostingReactivated => $this->hostingNotification(
                HostingAccountNotificationType::Reactivated,
            ),
            TestEmailTemplate::HostingPasswordChanged => $this->hostingNotification(
                HostingAccountNotificationType::PasswordChanged,
            ),
            TestEmailTemplate::HostingActionRequired => $this->hostingNotification(
                HostingAccountNotificationType::ActionRequired,
            ),
            TestEmailTemplate::TicketCreated => $this->supportNotification(
                SupportTicketNotificationType::Created,
            ),
            TestEmailTemplate::TicketReply => $this->supportNotification(
                SupportTicketNotificationType::Reply,
            ),
            TestEmailTemplate::TicketStatusChanged => $this->supportNotification(
                SupportTicketNotificationType::StatusChanged,
            ),
            TestEmailTemplate::TicketStaffActivity => $this->supportNotification(
                SupportTicketNotificationType::StaffActivity,
                'customer_reply',
            ),
            default => throw new \LogicException(
                "Template {$template->value} must be sent as a mailable.",
            ),
        };
    }

    private function subscription(): Subscription
    {
        $subscription = new Subscription();
        $subscription->setRelation(
            'product',
            new Product(['name' => __('Professional plan')]),
        );

        return $subscription;
    }

    private function hostingNotification(
        HostingAccountNotificationType $type,
    ): HostingAccountNotification
    {
        return new HostingAccountNotification(
            type: $type,
            accountId: 1,
            domain: 'example.hsite.top',
            planName: __('HospedFree Pro'),
            effectiveAt: now()->addDays(7)->toIso8601String(),
        );
    }

    private function supportNotification(
        SupportTicketNotificationType $type,
        ?string $activity = null,
    ): SupportTicketNotification
    {
        return new SupportTicketNotification(
            type: $type,
            ticketId: 123,
            status: 'resolved',
            activity: $activity,
        );
    }
}
