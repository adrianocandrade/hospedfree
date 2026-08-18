<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class SupportNotificationRecipients
{
    /**
     * @return Collection<int, User>
     */
    public function all(): Collection
    {
        return User::query()
            ->where(function ($query): void {
                $query
                    ->whereHas('permissions', fn($permissions) => $permissions
                        ->whereIn('name', ['support.manage', 'admin']))
                    ->orWhereHas('roles.permissions', fn($permissions) => $permissions
                        ->whereIn('name', ['support.manage', 'admin']));
            })
            ->get();
    }
}
