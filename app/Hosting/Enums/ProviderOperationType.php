<?php

namespace App\Hosting\Enums;

enum ProviderOperationType: string
{
    case HealthCheck = 'health_check';
    case CheckAvailability = 'check_availability';
    case Create = 'create';
    case Reconcile = 'reconcile';
    case Suspend = 'suspend';
    case Unsuspend = 'unsuspend';
    case Delete = 'delete';
    case ChangePassword = 'change_password';
    case ChangePackage = 'change_package';
}
