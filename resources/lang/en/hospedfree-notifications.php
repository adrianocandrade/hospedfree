<?php

return [
    'greeting' => 'Hello, :name',
    'security_notice' => 'For your security, this email does not contain passwords or credentials. Sign in to view protected information.',
    'hosting_plan' => 'your hosting plan',
    'not_available' => 'a date to be confirmed',
    'hosting' => [
        'hosting_ready' => [
            'subject' => 'Your hosting is ready',
            'line_1' => ':domain is active and ready for you to publish your site.',
            'line_2' => 'Use the HospedFree dashboard to manage files, domains, databases, SSL and tools.',
            'action' => 'Manage hosting',
        ],
        'hosting_provisioning_failed' => [
            'subject' => 'We need to finish activating your hosting',
            'line_1' => 'We could not finish activating :domain.',
            'line_2' => 'Your request remains recorded. Open the dashboard to check the next action or contact support.',
            'action' => 'Review hosting',
        ],
        'hosting_suspended' => [
            'subject' => 'Your hosting has been suspended',
            'line_1' => 'Access to :domain is currently suspended.',
            'line_2' => 'Open the dashboard to review the account status and the available recovery options.',
            'action' => 'Review account',
        ],
        'hosting_reactivated' => [
            'subject' => 'Your hosting has been reactivated',
            'line_1' => ':domain is active again.',
            'line_2' => 'You can return to the dashboard and continue managing your site.',
            'action' => 'Open hosting',
        ],
        'hosting_password_changed' => [
            'subject' => 'Your hosting password was changed',
            'line_1' => 'The protected hosting password for :domain was changed successfully.',
            'line_2' => 'If you did not request this change, sign in and contact support immediately.',
            'action' => 'Review security',
        ],
        'hosting_deletion_scheduled' => [
            'subject' => 'Hosting deletion scheduled',
            'line_1' => 'Deletion of :domain is scheduled for :effective_at.',
            'line_2' => 'You can cancel the deletion from the dashboard while the grace period is active.',
            'action' => 'Review deletion',
        ],
        'hosting_deletion_cancelled' => [
            'subject' => 'Hosting deletion cancelled',
            'line_1' => 'The scheduled deletion of :domain was cancelled.',
            'line_2' => 'Your hosting remains available with its current account status.',
            'action' => 'Open hosting',
        ],
        'hosting_deleted' => [
            'subject' => 'Hosting account deleted',
            'line_1' => 'The deletion of :domain has been completed.',
            'line_2' => 'This account can no longer be accessed from the hosting tools.',
            'action' => 'View hosting accounts',
        ],
        'hosting_downgrade_scheduled' => [
            'subject' => 'Change to the Free plan scheduled',
            'line_1' => 'The paid access for :domain ended and the change to the Free plan is being processed.',
            'line_2' => 'Your site will not be deleted automatically. We will update the account when the plan change is complete.',
            'action' => 'Review plan',
        ],
        'hosting_plan_changed' => [
            'subject' => 'Your hosting plan was updated',
            'line_1' => ':domain is now using :plan.',
            'line_2' => 'The current limits and features are available in your dashboard.',
            'action' => 'View plan',
        ],
        'hosting_action_required' => [
            'subject' => 'Your hosting needs attention',
            'line_1' => 'An operation for :domain could not be completed automatically.',
            'line_2' => 'Open the dashboard to review the safe recovery action or contact support.',
            'action' => 'Review hosting',
        ],
    ],
    'support' => [
        'ticket_created' => [
            'subject' => 'Support ticket #:ticket received',
            'line_1' => 'We received support ticket #:ticket.',
            'line_2' => 'You can follow the conversation and add more information from your dashboard.',
            'action' => 'View ticket',
        ],
        'ticket_reply' => [
            'subject' => 'New reply to ticket #:ticket',
            'line_1' => 'The HospedFree support team replied to ticket #:ticket.',
            'line_2' => 'Open the conversation to read the reply and continue the support request.',
            'action' => 'Read reply',
        ],
        'ticket_status_changed' => [
            'subject' => 'Ticket #:ticket was updated',
            'line_1' => 'Ticket #:ticket is now :status.',
            'line_2' => 'The complete history remains available in your support area.',
            'action' => 'View ticket',
        ],
        'ticket_staff_activity' => [
            'subject' => 'Support activity on ticket #:ticket',
            'line_1' => ':activity on ticket #:ticket.',
            'line_2' => 'Open the support area to review the request. The email does not include the customer message or attachments.',
            'action' => 'Open support',
        ],
    ],
    'support_status' => [
        'open' => 'open',
        'pending_customer' => 'waiting for the customer',
        'pending_support' => 'waiting for support',
        'resolved' => 'resolved',
        'closed' => 'closed',
        '' => 'updated',
    ],
    'support_activity' => [
        'created' => 'A new support request was created',
        'customer_reply' => 'The customer sent a new reply',
        '' => 'There is new activity',
    ],
    'billing' => [
        'payment_failed' => [
            'subject' => 'We could not confirm the payment for :plan',
            'line' => 'Update your payment method to keep :plan active. If paid access ends, your hosting will be scheduled to move to the Free plan; your site will not be deleted automatically.',
            'action' => 'Review billing',
        ],
        'invoice_available' => [
            'subject' => 'Your payment receipt is available',
            'line' => 'The receipt for your latest HospedFree payment is ready to view.',
            'action' => 'View receipt',
        ],
    ],
];
