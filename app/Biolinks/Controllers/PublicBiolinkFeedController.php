<?php

namespace App\Biolinks\Controllers;

use App\Biolinks\Models\Biolink;
use App\Biolinks\Support\SafeFeedReader;
use App\Links\Actions\LinkeablePublicPolicy;
use App\Links\Exceptions\LinkRedirectFailed;
use Common\Core\AppUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class PublicBiolinkFeedController extends Controller
{
    /**
     * Return a sanitized, cached RSS, Atom or YouTube feed for a public widget.
     *
     * @operationId getPublicBiolinkFeed
     * @unauthenticated
     */
    public function __invoke(
        int $biolinkId,
        int $widgetId,
        SafeFeedReader $feeds,
    ): JsonResponse {
        $biolink = Biolink::query()
            ->with(['user', 'rules'])
            ->findOrFail($biolinkId);

        try {
            if (!(new LinkeablePublicPolicy(app(AppUrl::class)))->isAccessible($biolink)) {
                abort(404);
            }
        } catch (LinkRedirectFailed) {
            abort(404);
        }

        $widget = $biolink->widgets()
            ->where('type', 'rssFeed')
            ->findOrFail($widgetId);

        if (!$widget->isCurrentlyVisible()) {
            abort(404);
        }

        $url = trim((string) (($widget->config ?? [])['url'] ?? ''));
        abort_if($url === '', 404);

        return response()
            ->json(['data' => $feeds->read($url)])
            ->header('Cache-Control', 'public, max-age=300, stale-while-revalidate=300');
    }
}
