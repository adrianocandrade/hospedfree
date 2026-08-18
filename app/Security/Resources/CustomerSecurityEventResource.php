<?php

namespace App\Security\Resources;

use App\Security\Models\CustomerSecurityEvent;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin CustomerSecurityEvent */
#[SchemaName('CustomerSecurityEvent')]
class CustomerSecurityEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event' => $this->event->value,
            'ip_address' => $this->ip_address,
            'created_at' => $this->created_at,
        ];
    }
}
