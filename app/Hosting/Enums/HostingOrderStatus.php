<?php

namespace App\Hosting\Enums;

enum HostingOrderStatus: string
{
    case Requested = 'requested';
    case AwaitingPayment = 'awaiting_payment';
    case Paid = 'paid';
    case Provisioning = 'provisioning';
    case Fulfilled = 'fulfilled';
    case Failed = 'failed';
    case Cancelled = 'cancelled';

    public function canTransitionTo(self $next): bool
    {
        return match ($this) {
            self::Requested => in_array($next, [self::AwaitingPayment, self::Provisioning, self::Failed, self::Cancelled], true),
            self::AwaitingPayment => in_array($next, [self::Paid, self::Cancelled], true),
            self::Paid => in_array($next, [self::Provisioning, self::Cancelled], true),
            self::Provisioning => in_array($next, [self::Fulfilled, self::Failed], true),
            self::Failed => in_array($next, [self::Provisioning, self::Cancelled], true),
            self::Fulfilled, self::Cancelled => false,
        };
    }
}
