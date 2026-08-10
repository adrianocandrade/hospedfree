<?php

namespace App\Blog\Policies;

use App\Models\User;
use Common\Core\Policies\BasePolicy;

class BlogPostPolicy extends BasePolicy
{
    public function index(User $user): bool
    {
        return $user->hasPermission('blog.update');
    }

    public function show(User $user): bool
    {
        return $user->hasPermission('blog.update');
    }

    public function store(User $user): bool
    {
        return $user->hasPermission('blog.update');
    }

    public function update(User $user): bool
    {
        return $user->hasPermission('blog.update');
    }

    public function destroy(User $user): bool
    {
        return $user->hasPermission('blog.update');
    }
}
