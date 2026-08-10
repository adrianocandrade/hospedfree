<?php

namespace App\Biolinks\Resources;

use App\Biolinks\Models\BiolinkBadgeGrant;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin BiolinkBadgeGrant */
#[SchemaName('BiolinkBadgeGrant')]
class BiolinkBadgeGrantResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'source' => $this->source,
            'granted_at' => $this->granted_at,
            'first_unlocked_at' => $this->first_unlocked_at,
            'last_unlocked_at' => $this->last_unlocked_at,
            /** @var int */
            'times_claimed' => max(1, (int) $this->times_claimed),
            /** @var list<int> */
            'edition_years' => $this->claimedEditionYears(),
            /** @var int|null */
            'latest_edition_year' => $this->latestEditionYear(),
            'revoked_at' => $this->revoked_at,
            'badge' => new BiolinkBadgeDefinitionResource($this->whenLoaded('badge')),
        ];
    }
}
