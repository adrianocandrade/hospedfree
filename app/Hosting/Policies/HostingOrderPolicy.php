<?php

namespace App\Hosting\Policies;

use App\Hosting\Models\HostingOrder;
use App\Models\User;

class HostingOrderPolicy
{
    public function view(User $user, HostingOrder $order): bool
    {
        return $user->id === $order->user_id
            || $user->hasPermission('hosting.operations');
    }
}
