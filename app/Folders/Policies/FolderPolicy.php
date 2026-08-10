<?php

namespace App\Folders\Policies;

use App\Folders\Models\Folder;
use App\Models\User;
use Common\Workspaces\Policies\WorkspacedResourcePolicy;
use Illuminate\Database\Eloquent\Model;

class FolderPolicy extends WorkspacedResourcePolicy
{
    protected string $resource = Folder::class;

    public function show(User $currentUser, Model $resource): bool
    {
        // block when trying to access via API and no password is provided
        if (!!$resource->password && !requestIsFromFrontend()) {
            if (
                !request('password') ||
                !$resource->passwordMatches(request('password'))
            ) {
                return false;
            }
        }

        return parent::show($currentUser, $resource);
    }
}
