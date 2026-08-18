<?php

namespace App\Hosting\Support;

use App\Models\User;
use Common\Workspaces\Models\Workspace;

trait ResolvesPersonalWorkspace
{
    private function personalWorkspace(User $user): Workspace
    {
        return $user->workspaces()
            ->where('is_personal', true)
            ->firstOrFail();
    }
}
