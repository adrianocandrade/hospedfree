<?php

namespace App\Biolinks\Controllers;

use App\Biolinks\Actions\LogBiolinkWidgetClick;
use App\Biolinks\Models\Biolink;
use App\Links\Actions\LinkeablePublicPolicy;
use App\Links\Exceptions\LinkRedirectFailed;
use Common\Core\AppUrl;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;

class PublicBiolinkWidgetEngagementController extends Controller
{
    public function store(
        int $biolinkId,
        int $widgetId,
        LogBiolinkWidgetClick $logger,
    ): Response {
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

        $widget = $biolink->widgets()->findOrFail($widgetId);

        if (!$widget->isCurrentlyVisible()) {
            abort(404);
        }

        $logger->execute($biolink, $widget);

        return response()->noContent();
    }
}
