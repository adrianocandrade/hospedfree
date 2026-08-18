<?php

namespace App\Hosting\Enums;

enum HostingAccountStatus: string
{
    case Pending = 'pending';
    case Provisioning = 'provisioning';
    case Active = 'active';
    case Suspended = 'suspended';
    case PendingDowngrade = 'pending_downgrade';
    case PendingDeletion = 'pending_deletion';
    case Deleting = 'deleting';
    case Deleted = 'deleted';
    case Failed = 'failed';
    case ActionRequired = 'action_required';

    public function canTransitionTo(self $next): bool
    {
        return match ($this) {
            self::Pending => in_array($next, [self::Provisioning, self::PendingDeletion, self::Failed], true),
            self::Provisioning => in_array($next, [self::Active, self::PendingDeletion, self::Failed, self::ActionRequired], true),
            self::Active => in_array($next, [self::Suspended, self::PendingDowngrade, self::PendingDeletion, self::ActionRequired], true),
            self::Suspended => in_array($next, [self::Active, self::PendingDeletion, self::Deleting, self::ActionRequired], true),
            self::PendingDowngrade => in_array($next, [self::Active, self::ActionRequired, self::PendingDeletion], true),
            self::PendingDeletion => in_array($next, [self::Active, self::Suspended, self::Deleting], true),
            self::Deleting => in_array($next, [self::Deleted, self::ActionRequired], true),
            self::Failed, self::ActionRequired => in_array($next, [self::Provisioning, self::Active, self::Suspended, self::PendingDeletion, self::Deleting], true),
            self::Deleted => false,
        };
    }
}
