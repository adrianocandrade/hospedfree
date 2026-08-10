<?php

namespace App\Biolinks\Resources;

use App\Biolinks\Models\BiolinkWidgetSubmission;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin BiolinkWidgetSubmission
 */
#[SchemaName('BiolinkWidgetSubmission')]
class BiolinkWidgetSubmissionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'biolink_id' => $this->biolink_id,
            'widget_id' => $this->widget_id,
            'widget_type' => $this->widget_type,
            /** @var 'new' | 'read' | 'archived' */
            'status' => $this->status,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'message' => $this->message,
            /** @var array<string, mixed> */
            'payload' => $this->payload,
            'consent_at' => $this->consent_at,
            'created_at' => $this->created_at,
            'read_at' => $this->read_at,
            'archived_at' => $this->archived_at,
            'widget' => $this->whenLoaded('widget', fn() => [
                'id' => $this->widget?->id,
                'type' => $this->widget?->type,
                'label' => $this->widget?->config['title'] ?? null,
            ]),
        ];
    }
}
