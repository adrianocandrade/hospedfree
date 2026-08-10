<?php

namespace App\Biolinks\Controllers;

use App\Biolinks\Models\Biolink;
use App\Biolinks\Models\BiolinkWidget;
use App\Biolinks\Support\PublicBiolinkProfileData;
use App\Links\Actions\LinkeablePublicPolicy;
use App\Links\Exceptions\LinkRedirectFailed;
use Common\Core\AppUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class PublicBiolinkProfileController extends Controller
{
    /**
     * @operationId getPublicBiolinkDiscordPresence
     * @unauthenticated
     */
    public function discord(int $biolinkId, int $widgetId, PublicBiolinkProfileData $profiles): JsonResponse
    {
        $widget = $this->publicWidget($biolinkId, $widgetId, 'discordPresence');
        $config = $widget->config ?? [];

        $data = ($config['discordSource'] ?? 'manual') === 'lanyard'
            ? $profiles->discordPresence((string) ($config['discordUserId'] ?? ''))
            : ['available' => false];

        return response()->json($data)->header('Cache-Control', 'no-store, private');
    }

    /**
     * @operationId getPublicBiolinkSteamProfile
     * @unauthenticated
     */
    public function steam(int $biolinkId, int $widgetId, PublicBiolinkProfileData $profiles): JsonResponse
    {
        $widget = $this->publicWidget($biolinkId, $widgetId, 'gamingProfile');
        $config = $widget->config ?? [];

        $data = ($config['gamingSource'] ?? 'manual') === 'steam'
            ? $profiles->steamProfile((string) ($config['steamProfileUrl'] ?? ''))
            : ['available' => false];

        return response()->json($data)->header('Cache-Control', 'no-store, private');
    }

    private function publicWidget(int $biolinkId, int $widgetId, string $type): BiolinkWidget
    {
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
            ->where('type', $type)
            ->findOrFail($widgetId);

        if (!$widget->isCurrentlyVisible()) {
            abort(404);
        }

        return $widget;
    }
}
