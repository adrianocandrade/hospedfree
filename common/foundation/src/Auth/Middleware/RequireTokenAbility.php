<?php

namespace Common\Auth\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class RequireTokenAbility
{
    public function handle(
        Request $request,
        Closure $next,
        string $ability,
    ): Response {
        $token = $request->user()?->currentAccessToken();

        abort_if(
            $token instanceof PersonalAccessToken &&
                !$request->user()->tokenCan($ability),
            403,
            'This access token does not have the required ability.',
        );

        return $next($request);
    }
}
