<?php

namespace App\Biolinks\Resources;

use App\Biolinks\Models\BiolinkBadgeDefinition;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin BiolinkBadgeDefinition */
#[SchemaName('BiolinkBadgeDefinition')]
class BiolinkBadgeDefinitionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'kind' => $this->kind,
            'category' => $this->category,
            'access_type' => $this->access_type,
            'reference' => $this->reference,
            'label' => $this->label_key,
            'description' => $this->description_key,
            'label_text' => (string) __($this->label_key),
            'description_text' => (string) __($this->description_key),
            'icon' => $this->icon,
            'color' => $this->color,
            'required_feature' => $this->required_feature,
            'grant_mode' => $this->grant_mode,
            'repeat_yearly' => (bool) $this->repeat_yearly,
            'show_year' => (bool) $this->show_year,
            'action_url' => $this->action_url,
            'starts_at' => $this->starts_at,
            'claim_until' => $this->claim_until,
            'is_active' => $this->is_active,
            'owned' => (bool) ($this->owned ?? false),
            'can_claim' => (bool) ($this->can_claim ?? false),
            'status' => $this->status ?? null,
            /** @var int|null */
            'edition_year' => $this->edition_year ?? $this->editionYear(),
            /** @var list<int> */
            'owned_years' => $this->owned_years ?? [],
            /** @var int|null */
            'latest_edition_year' => $this->latest_edition_year ?? null,
            /** @var int */
            'times_claimed' => (int) ($this->times_claimed ?? 0),
            /** @var array<string, mixed>|null */
            'metadata' => $this->metadata,
            'grants_count' => $this->whenCounted('grants'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
