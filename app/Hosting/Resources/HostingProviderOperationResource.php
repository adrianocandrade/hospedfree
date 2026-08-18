<?php

namespace App\Hosting\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class HostingProviderOperationResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'hosting_account_id' => $this->hosting_account_id,
            'hosting_order_id' => $this->hosting_order_id,
            'provider' => $this->provider,
            'operation' => $this->operation->value,
            'status' => $this->status->value,
            'attempt_count' => $this->attempt_count,
            'safe_code' => $this->safe_code,
            'safe_message' => $this->safe_message,
            'retry_after' => $this->retry_after,
            'started_at' => $this->started_at,
            'completed_at' => $this->completed_at,
            'created_at' => $this->created_at,
        ];
    }
}
