<?php

namespace App\Biolinks\Actions;

use App\Analytics\Actions\LogTrackedEvent;
use App\Analytics\Models\TrackedEvent;
use App\Analytics\Resources\TrackedEventResource;
use App\Biolinks\Models\Biolink;
use App\Biolinks\Models\BiolinkWidget;
use App\Webhooks\Jobs\DispatchWebhooksForEvent;
use App\Webhooks\Models\Webhook;
use Common\Core\AppUrl;
use Illuminate\Support\Facades\DB;

class LogBiolinkWidgetClick
{
    public function execute(Biolink $biolink, BiolinkWidget $widget): TrackedEvent
    {
        $attributes = [
            ...LogTrackedEvent::requestAttributes(),
            'domain_id' => app(AppUrl::class)->matchedCustomDomain?->id ?? 0,
            'user_id' => $biolink->user_id,
            'workspace_id' => $biolink->workspace_id,
            'event_type' => 'click',
        ];

        $event = $widget->trackedEvents()->create($attributes);

        if (!$attributes['crawler']) {
            $widget
                ->newQuery()
                ->whereKey($widget->getKey())
                ->update([
                    'clicks_count' => DB::raw('clicks_count + 1'),
                    'clicked_at' => now(),
                    'updated_at' => now(),
                ]);

            DispatchWebhooksForEvent::dispatch(
                eventType: Webhook::EVENT_CLICKED,
                userId: $biolink->user_id,
                payload: (new TrackedEventResource($event))->toWebhookArray(),
            );
        }

        return $event;
    }
}
