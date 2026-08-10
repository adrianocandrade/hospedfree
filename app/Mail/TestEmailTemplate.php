<?php

namespace App\Mail;

enum TestEmailTemplate: string
{
    case MailSetup = 'mail_setup';
    case EmailVerification = 'email_verification';
    case WorkspaceInvitation = 'workspace_invitation';
    case ContactMessage = 'contact_message';
    case PaymentFailed = 'payment_failed';
    case InvoiceAvailable = 'invoice_available';
    case ClickQuotaExhausted = 'click_quota_exhausted';
    case WebhookDisabled = 'webhook_disabled';
    case BookingConfirmation = 'booking_confirmation';

    public function label(): string
    {
        return match ($this) {
            self::MailSetup => __('Mail configuration'),
            self::EmailVerification => __('Email verification code'),
            self::WorkspaceInvitation => __('Workspace invitation'),
            self::ContactMessage => __('Contact page message'),
            self::PaymentFailed => __('Payment failed'),
            self::InvoiceAvailable => __('Invoice available'),
            self::ClickQuotaExhausted => __('Click quota exhausted'),
            self::WebhookDisabled => __('Webhook disabled'),
            self::BookingConfirmation => __('Booking confirmation'),
        };
    }
}
