<?php

namespace App\Security\Resources;

use App\Security\Models\CustomerCommunication;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin CustomerCommunication */
#[SchemaName('CustomerCommunication')]
class CustomerCommunicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kind' => $this->kind,
            'subject' => $this->subject,
            'status' => $this->status,
            'sent_at' => $this->sent_at,
            'created_at' => $this->created_at,
        ];
    }
}
