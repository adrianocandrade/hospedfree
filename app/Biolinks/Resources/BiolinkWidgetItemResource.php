<?php

namespace App\Biolinks\Resources;

use App\Biolinks\Models\BiolinkWidgetItem;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin BiolinkWidgetItem
 */
#[SchemaName('BiolinkWidgetItem')]
class BiolinkWidgetItemResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'biolink_id' => $this->biolink_id,
            'biolink_widget_id' => $this->biolink_widget_id,
            'type' => $this->type,
            'active' => $this->active,
            'sort_order' => $this->sort_order,
            'title' => $this->title,
            'description' => $this->description,
            'url' => $this->url,
            'image' => $this->image,
            'price' => $this->price,
            'currency' => $this->currency,
            /** @var array<string, mixed> */
            'payload' => $this->payload,
        ];
    }
}
