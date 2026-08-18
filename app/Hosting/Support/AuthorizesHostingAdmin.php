<?php

namespace App\Hosting\Support;

use Illuminate\Http\Request;

trait AuthorizesHostingAdmin
{
    private function authorizeHostingAdmin(Request $request, string $permission = 'hosting.operations'): void
    {
        abort_unless($request->user()?->hasPermission($permission), 403);
    }
}
