<?php

namespace App\Biolinks\Resources;

use App\Biolinks\Models\BiolinkWidget;
use App\Biolinks\Models\BiolinkProduct;
use App\Biolinks\Resources\BiolinkProductResource;
use App\Links\Models\Link;
use App\QrCodes\Services\PixPayloadBuilder;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Resources\Json\JsonResource;
use InvalidArgumentException;

/**
 * @mixin BiolinkWidget
 */
#[SchemaName('BiolinkWidget')]
class BiolinkWidgetResource extends JsonResource
{
    public function toArray($request): array
    {
        $config = $this->config ?? [];
        if ($this->type === 'donation' && ($config['pixEnabled'] ?? false)) {
            try {
                $config['pixPayload'] = app(PixPayloadBuilder::class)->build([
                    'key_type' => $config['pixKeyType'] ?? '',
                    'key' => $config['pixKey'] ?? '',
                    'receiver_name' => $config['pixReceiverName'] ?? '',
                    'receiver_city' => $config['pixReceiverCity'] ?? '',
                    'amount' => $config['pixAmount'] ?? null,
                    'description' => $config['pixDescription'] ?? '',
                    'txid' => $config['pixTxid'] ?? '',
                ]);
            } catch (InvalidArgumentException) {
                unset($config['pixPayload']);
            }
        }
        $productIds =
            ($config['source'] ?? null) === 'catalog' &&
            $this->type === 'linkedProduct'
                ? collect($config['productIds'] ?? [])
                    ->filter(
                        fn($id) => is_int($id) || ctype_digit((string) $id),
                    )
                    ->map(fn($id) => (int) $id)
                    ->values()
                : collect();

        return [
            'id' => $this->id,
            'biolink_id' => $this->biolink_id,
            'active' => $this->active,
            'position' => $this->position,
            'clicks_count' => $this->clicks_count,
            'pinned' => $this->pinned,
            'activates_at' => $this->activates_at,
            'expires_at' => $this->expires_at,
            'password' => $this->password ? Link::PLACEHOLDER_PASSWORD : null,
            'utm' => $this->utm,
            /** @var array<string, mixed> */
            'config' => $config,
            /** @var array<BiolinkWidgetItemResource> */
            'items' => $this->whenLoaded(
                'items',
                fn() => BiolinkWidgetItemResource::collection($this->items),
            ),
            /** @var array<BiolinkProductResource> */
            'catalog_items' => $productIds->isNotEmpty()
                ? BiolinkProductResource::collection(
                    BiolinkProduct::query()
                        ->where('biolink_id', $this->biolink_id)
                        ->whereIn('id', $productIds)
                        ->where('active', true)
                        ->orderByRaw(
                            'FIELD(id, ' . $productIds->implode(',') . ')',
                        )
                        ->get(),
                )
                : [],
            /** @var array<array{id: int, type: string, key?: string|null, value?: string|null}> */
            'rules' => $this->whenLoaded(
                'rules',
                fn() => $this->rules->map(
                    fn($rule) => [
                        'id' => $rule->id,
                        'type' => $rule->type,
                        'key' => $rule->key,
                        'value' => $rule->value,
                    ],
                ),
            ),
            /** @var array<array{id: int, name: string}> */
            'pixels' => $this->whenLoaded(
                'pixels',
                fn() => $this->pixels->map(
                    fn($pixel) => [
                        'id' => $pixel->id,
                        'name' => $pixel->name,
                    ],
                ),
            ),
            /** @var 'image' | 'text' | 'socials' | 'youtube' | 'soundcloud' | 'vimeo' | 'spotify' | 'twitch' | 'tiktok' | 'contactForm' | 'emailSignup' | 'eventRsvp' | 'linkedProduct' | 'linkedCourse' | 'service' | 'booking' | 'faq' | 'linkCollection' | 'embedCollection' | 'imageGallery' | 'qrCode' | 'location' | 'contactCard' | 'smsSignup' | 'poll' | 'reviews' | 'stats' | 'discountCode' | 'document' | 'genericVideo' | 'podcastMusic' | 'mobileApp' | 'eventList' | 'externalForm' | 'rssFeed' | 'donation' | 'viewerCount' | 'discordPresence' | 'gamingProfile' | 'spotlight' | 'ctaBanner' | 'logoCloud' | 'socialFeed' | 'countdown' | 'audio' | 'imageComparison' */
            'type' => $this->type,
            /** @var 'biolinkWidget' */
            'model_type' => $this->model_type,
        ];
    }
}
