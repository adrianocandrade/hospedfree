<?php

namespace App\Hosting\Policies;

use App\Hosting\Models\HostingAccount;
use App\Models\User;

class HostingAccountPolicy
{
    public function view(User $user, HostingAccount $account): bool
    {
        return $user->id === $account->user_id
            || $user->hasPermission('hosting.operations');
    }

    public function update(User $user, HostingAccount $account): bool
    {
        return $this->view($user, $account);
    }

    public function delete(User $user, HostingAccount $account): bool
    {
        return $this->view($user, $account);
    }
}
