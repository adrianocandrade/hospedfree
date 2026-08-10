<?php

namespace App\Biolinks\Controllers;

use App\Biolinks\Models\Biolink;
use App\Links\Actions\LinkeablePublicPolicy;
use App\Links\Exceptions\LinkRedirectFailed;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;

class PublicBiolinkViewerCountController extends Controller
{
    private const ACTIVE_FOR_SECONDS = 75;
    private const CACHE_FOR_SECONDS = 90;
    private const MAX_VIEWERS = 5000;

    /**
     * Register a short-lived visitor heartbeat and return the active viewer count.
     *
     * @operationId getPublicBiolinkViewerCount
     * @unauthenticated
     * @return array{count: int}
     */
    public function __invoke(int $biolinkId, Request $request): JsonResponse
    {
        $biolink = Biolink::query()
            ->with(['user', 'rules'])
            ->findOrFail($biolinkId);

        try {
            if (!(new LinkeablePublicPolicy(app(\Common\Core\AppUrl::class)))->isAccessible($biolink)) {
                abort(404);
            }
        } catch (LinkRedirectFailed) {
            abort(404);
        }

        $visitorToken = trim((string) $request->query('visitor_token'));
        if ($visitorToken === '') {
            $visitorToken = implode('|', [
                (string) $request->ip(),
                (string) $request->userAgent(),
            ]);
        }

        $viewerKey = hash('sha256', $visitorToken . '|' . config('app.key'));
        $cacheKey = "biolink-viewers:{$biolink->id}";
        $now = now()->timestamp;
        $activeSince = $now - self::ACTIVE_FOR_SECONDS;
        $viewers = Cache::get($cacheKey, []);
        $viewers = is_array($viewers) ? $viewers : [];
        $viewers = array_filter(
            $viewers,
            static fn(mixed $lastSeen): bool => is_int($lastSeen) && $lastSeen >= $activeSince,
        );
        $viewers[$viewerKey] = $now;

        if (count($viewers) > self::MAX_VIEWERS) {
            arsort($viewers);
            $viewers = array_slice($viewers, 0, self::MAX_VIEWERS, true);
        }

        Cache::put($cacheKey, $viewers, self::CACHE_FOR_SECONDS);

        return response()
            ->json(['count' => count($viewers)])
            ->header('Cache-Control', 'no-store, private');
    }
}
