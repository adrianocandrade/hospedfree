<?php

namespace App\Biolinks\Actions;

use App\Biolinks\Models\Biolink;
use App\Biolinks\Models\BiolinkTheme;
use App\Biolinks\Resources\BiolinkResource;
use App\Webhooks\Jobs\DispatchWebhooksForEvent;
use App\Links\Linkeable\CrupdateLinkeable;
use App\Models\User;
use App\Webhooks\Models\Webhook;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CrupdateBiolink extends CrupdateLinkeable
{
    public function execute(
        array $specifiedData,
        Biolink|null $biolink = null,
    ): Biolink {
        $isCreating = is_null($biolink);
        $modelId = Arr::pull($specifiedData, 'model_id');

        $specifiedData = $this->filterOutDataBasedOnUserPermissions(
            $specifiedData,
        );

        $inlineData = [
            ...$this->getUtmInlineData($specifiedData),
            ...$this->getExpirationAndPasswordInlineData($specifiedData),
            ...Arr::only($specifiedData, [
                'name',
                'back_half',
                'domain_id',
                'user_id',
                'workspace_id',
            ]),
        ];

        $biolink = DB::transaction(function () use (
            $isCreating,
            $biolink,
            $inlineData,
            $specifiedData,
            $modelId,
        ) {
            if ($isCreating) {
                $biolink = Biolink::query()->create([
                    ...$inlineData,
                    'user_id' => $inlineData['user_id'] ?? Auth::id(),
                    'back_half' => $inlineData['back_half'] ?? Str::random(5),
                ]);

                if ($modelId) {
                    $theme = BiolinkTheme::query()
                        ->where('is_published', true)
                        ->findOrFail($modelId);
                    (new AddModelContentToBiolink())->execute($biolink, $theme);
                } else {
                    (new AddInitialContentToBiolink())->execute(
                        $biolink['id'],
                        $biolink->user,
                    );
                }
            } else {
                $biolink->fill($inlineData)->save();
            }

            $this->saveLinkeableRules($biolink, $specifiedData);
            $this->saveLinkeableTags($biolink, $specifiedData);
            $this->saveLinkeableTrackingPixels($biolink, $specifiedData);
            $this->saveQrCode($biolink, $specifiedData);

            return $biolink;
        });

        // dispatch webhooks
        DispatchWebhooksForEvent::dispatch(
            eventType: $isCreating
                ? Webhook::EVENT_CREATED
                : Webhook::EVENT_UPDATED,
            userId: $biolink->user_id,
            payload: (new BiolinkResource($biolink))->toWebhookArray(),
        );

        return $biolink;
    }
}
