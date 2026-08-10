<?php

namespace App\Biolinks\Policies;

use App\Biolinks\Models\Biolink;
use App\Folders\Policies\FolderPolicy;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class BiolinkPolicy extends FolderPolicy
{
    protected string $resource = Biolink::class;

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
