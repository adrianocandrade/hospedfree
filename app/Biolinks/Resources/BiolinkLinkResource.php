<?php

namespace App\Biolinks\Resources;

use App\Biolinks\Models\BiolinkLink;
use App\Links\Resources\LinkResource;
use Dedoc\Scramble\Attributes\SchemaName;

/**
 * @mixin BiolinkLink
 */
#[SchemaName('BiolinkLink')]
class BiolinkLinkResource extends LinkResource
{
    public function toArray($request): array
    {
        return [
            ...parent::toArray($request),
            'active' => $this->active,
            'leap_until' => $this->leap_until,
            /** @var boolean */
            'active_locked' => $this->active_locked,
            'animation' => $this->animation,
            'position' => $this->position,
            /** @var 'image'|'asset'|'none'|null */
            'thumbnail_type' => $this->thumbnail_type,
            /** @var string|null */
            'thumbnail_asset' => $this->thumbnail_asset,
            /** @var array{backgroundColor?: string, textColor?: string, borderColor?: string, iconColor?: string}|null */
            'style' => $this->style,
            /** @var 'link' */
            'model_type' => $this->model_type,
        ];
    }
}
