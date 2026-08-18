<?php

namespace App\Hosting\Controllers;

use App\Hosting\Enums\HostingAccountStatus;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Services\HostingToolLaunchTicket;
use App\Hosting\Services\HostingToolsService;
use App\Hosting\Services\SafeToolUrl;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class HostingToolLaunchController
{
    public function __invoke(
        Request $request,
        string $ticket,
        HostingToolLaunchTicket $tickets,
        HostingToolsService $tools,
        SafeToolUrl $safeToolUrl,
    ): RedirectResponse {
        $payload = $tickets->consume($ticket);
        abort_unless($payload, 404);
        abort_unless($payload['user_id'] === $request->user()->id, 404);

        $account = HostingAccount::query()
            ->whereKey($payload['account_id'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();
        Gate::authorize('view', $account);
        abort_unless($account->status === HostingAccountStatus::Active, 409);

        $domain = is_string($payload['domain'] ?? null)
            ? strtolower($payload['domain'])
            : null;

        if ($payload['tool'] === 'site-builder') {
            abort_unless(
                $domain &&
                    (in_array($domain, [
                        strtolower($account->fqdn),
                        strtolower($account->active_domain ?: $account->fqdn),
                    ], true) ||
                        $account->domains()
                            ->where('domain', $domain)
                            ->where('status', 'active')
                            ->exists()),
                404,
            );
        }

        $result = $tools->open($account, $payload['tool'], $domain);
        abort_unless(
            $result->success,
            $result->retryable ? 503 : 404,
            $result->message,
        );

        $url = $result->toolLinks[$payload['tool']] ?? null;
        abort_unless(is_string($url), 404);

        $account->events()->create([
            'actor_user_id' => $request->user()->id,
            'event' => 'tool_opened',
            'safe_message' => 'External hosting tool opened.',
            'metadata' => ['tool' => $payload['tool']],
        ]);

        $response = str_starts_with($url, '/dashboard/')
            ? redirect($url)
            : redirect()->away($safeToolUrl->validate($url) ?: abort(404));

        return $response
            ->header('Cache-Control', 'no-store, private')
            ->header('Pragma', 'no-cache')
            ->header('Referrer-Policy', 'no-referrer')
            ->header('X-Robots-Tag', 'noindex, nofollow');
    }
}
