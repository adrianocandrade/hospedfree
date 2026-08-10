<?php

namespace App\Biolinks\Resources;

use App\Biolinks\Models\BiolinkProduct;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin BiolinkProduct */
#[SchemaName('BiolinkProduct')]
class BiolinkProductResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'biolink_id' => $this->biolink_id,
            'name' => $this->name,
            'description' => $this->description,
            'image' => $this->image,
            'price' => $this->price,
            /** @var string|null */
            'compare_price' => $this->compare_price,
            'currency' => $this->currency,
            /** @var string|null */
            'badge' => $this->badge,
            /** @var string|null */
            'rating' => $this->rating,
            /** @var string|null */
            'stock_label' => $this->stock_label,
            'url' => $this->url,
            'active' => $this->active,
            'position' => $this->position,
        ];
    }
}
