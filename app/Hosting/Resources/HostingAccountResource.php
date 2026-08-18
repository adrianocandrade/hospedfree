<?php

namespace App\Hosting\Resources;

use App\Hosting\Services\HostingToolsService;
use Illuminate\Http\Resources\Json\JsonResource;

class HostingAccountResource extends JsonResource
{
    public function toArray($request): array
    {
        $maskedUsername = $this->username
            ? substr($this->username, 0, 2) .
                str_repeat('•', max(strlen($this->username) - 2, 4))
            : null;

        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'fqdn' => $this->fqdn,
            'status' => $this->status->value,
            'desired_status' => $this->desired_status?->value,
            'username_masked' => $maskedUsername,
            'has_credentials' => filled($this->credential_secret),
            'technical' => [
                'ftp_host' => $this->ftp_host,
                'sql_host' => $this->sql_host,
            ],
            'tools' => app(HostingToolsService::class)->capabilities(
                $this->resource,
            ),
            'plan' => $this->whenLoaded(
                'plan',
                fn() => [
                    'id' => $this->plan->id,
                    'product_id' => $this->plan->product_id,
                    'type' => $this->plan->type->value,
                    'name' => $this->plan->product?->name,
                    'quotas' => $this->plan->quotas ?? [],
                ],
            ),
            'activated_at' => $this->activated_at,
            'last_synced_at' => $this->last_synced_at,
            'deletion_requested_at' => $this->deletion_requested_at,
            'deletes_at' => $this->deletes_at,
            'can_cancel_deletion' =>
                $this->status->value === 'pending_deletion' &&
                $this->deletes_at?->isFuture(),
            'created_at' => $this->created_at,
        ];
    }
}
