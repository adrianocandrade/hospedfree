<?php

namespace Common\Auth\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class RequireSessionAuthentication
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_if(
            $request->user()?->currentAccessToken() instanceof PersonalAccessToken,
            403,
            'This action requires an authenticated browser session.',
        );

        return $next($request);
    }
}
