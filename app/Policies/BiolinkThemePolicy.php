<?php

namespace App\Policies;

use App\Biolinks\Models\BiolinkTheme;
use App\Models\User;
use Common\Core\Policies\BasePolicy;

class BiolinkThemePolicy extends BasePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, BiolinkTheme $biolinkTheme): bool
    {
        return $biolinkTheme->is_published || $user->id === $biolinkTheme->created_by || $this->hasPermission($user, 'settings.update');
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, BiolinkTheme $biolinkTheme): bool
    {
        return $user->id === $biolinkTheme->created_by || $this->hasPermission($user, 'settings.update');
    }

    public function delete(User $user, BiolinkTheme $biolinkTheme): bool
    {
        return $user->id === $biolinkTheme->created_by || $this->hasPermission($user, 'settings.update');
    }
}
