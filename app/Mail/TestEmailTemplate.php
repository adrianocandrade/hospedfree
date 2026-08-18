<?php

namespace App\Mail;

enum TestEmailTemplate: string
{
    case MailSetup = 'mail_setup';
    case EmailVerification = 'email_verification';
    case PasswordReset = 'password_reset';
    case ContactMessage = 'contact_message';
    case PaymentFailed = 'payment_failed';
    case InvoiceAvailable = 'invoice_available';
    case HostingReady = 'hosting_ready';
    case HostingSuspended = 'hosting_suspended';
    case HostingReactivated = 'hosting_reactivated';
    case HostingPasswordChanged = 'hosting_password_changed';
    case HostingActionRequired = 'hosting_action_required';
    case TicketCreated = 'ticket_created';
    case TicketReply = 'ticket_reply';
    case TicketStatusChanged = 'ticket_status_changed';
    case TicketStaffActivity = 'ticket_staff_activity';

    public function label(): string
    {
        return match ($this) {
            self::MailSetup => __('Mail configuration'),
            self::EmailVerification => __('Email verification code'),
            self::PasswordReset => __('Password reset'),
            self::ContactMessage => __('Contact page message'),
            self::PaymentFailed => __('Payment failed'),
            self::InvoiceAvailable => __('Invoice available'),
            self::HostingReady => __('Hosting account ready'),
            self::HostingSuspended => __('Hosting account suspended'),
            self::HostingReactivated => __('Hosting account reactivated'),
            self::HostingPasswordChanged => __('Hosting password changed'),
            self::HostingActionRequired => __('Hosting action required'),
            self::TicketCreated => __('Support ticket created'),
            self::TicketReply => __('Support reply'),
            self::TicketStatusChanged => __('Support ticket resolved'),
            self::TicketStaffActivity => __('Support staff alert'),
        };
    }
}
