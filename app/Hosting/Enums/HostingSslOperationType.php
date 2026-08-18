<?php

namespace App\Hosting\Enums;

enum HostingSslOperationType: string
{
    case Install = 'install';
    case Reconcile = 'reconcile';
    case Renew = 'renew';
    case Revoke = 'revoke';
}
