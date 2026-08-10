<?php

namespace App\Mail;

use App\Bookings\Mail\BookingAppointmentMailable;
use App\Bookings\Models\BookingAppointment;
use App\Bookings\Models\BookingService;
use App\Models\User;
use App\Notifications\ClickQuotaExhausted;
use App\Notifications\WebhookDisabledAfterFailures;
use App\Webhooks\Models\Webhook;
use Common\Auth\Notifications\VerifyEmailWithOtp;
use Common\Billing\Invoices\Invoice;
use Common\Billing\Models\Product;
use Common\Billing\Notifications\NewInvoiceAvailable;
use Common\Billing\Notifications\PaymentFailed;
use Common\Billing\Subscription;
use Common\Notifications\ContactPageMessage;
use Common\Settings\Validators\MailCredentials\MailCredentialsMailable;
use Common\Workspaces\Models\Workspace;
use Common\Workspaces\Notifications\WorkspaceInvitation;
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

        Notification::sendNow(
            $notifiable,
            new TestEmailNotification(
                $this->notificationFor($template, $actor),
                $template,
            ),
            ['mail'],
        );
    }

    private function mailableFor(
        TestEmailTemplate $template,
    ): ?Mailable {
        return match ($template) {
            TestEmailTemplate::MailSetup => new MailCredentialsMailable(
                config('mail.primary', config('mail.default')),
            ),
            TestEmailTemplate::BookingConfirmation => $this->bookingMailable(),
            default => null,
        };
    }

    private function notificationFor(
        TestEmailTemplate $template,
        User $actor,
    ): NotificationTemplate {
        return match ($template) {
            TestEmailTemplate::EmailVerification => new VerifyEmailWithOtp(
                '123456',
            ),
            TestEmailTemplate::WorkspaceInvitation => new WorkspaceInvitation(
                new Workspace(['name' => __('Example workspace')]),
                $actor->name ?: __('Administrator'),
                'test-invitation',
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
            TestEmailTemplate::ClickQuotaExhausted => new ClickQuotaExhausted(),
            TestEmailTemplate::WebhookDisabled => new WebhookDisabledAfterFailures(
                new Webhook(['name' => __('Example webhook')]),
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

    private function bookingMailable(): BookingAppointmentMailable
    {
        $appointment = new BookingAppointment([
            'starts_at' => now()->addDay()->startOfHour(),
            'timezone' => config('app.timezone', 'UTC'),
            'meeting_url' => rtrim(config('app.url'), '/') . '/meeting/test',
            'manage_token' => 'test-booking',
        ]);
        $appointment->setRelation(
            'service',
            new BookingService(['name' => __('Example consultation')]),
        );

        return new BookingAppointmentMailable(
            $appointment,
            BookingAppointment::CONFIRMED,
        );
    }
}
