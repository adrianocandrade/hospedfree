<?php

namespace App\Hosting\Enums;

enum HostingAccountNotificationType: string
{
    case Ready = 'hosting_ready';
    case ProvisioningFailed = 'hosting_provisioning_failed';
    case Suspended = 'hosting_suspended';
    case Reactivated = 'hosting_reactivated';
    case PasswordChanged = 'hosting_password_changed';
    case DeletionScheduled = 'hosting_deletion_scheduled';
    case DeletionCancelled = 'hosting_deletion_cancelled';
    case Deleted = 'hosting_deleted';
    case DowngradeScheduled = 'hosting_downgrade_scheduled';
    case PlanChanged = 'hosting_plan_changed';
    case ActionRequired = 'hosting_action_required';
}
