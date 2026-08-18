<?php

namespace App\Hosting\Resources;

use App\Hosting\Enums\HostingOrderStatus;
use Illuminate\Http\Resources\Json\JsonResource;

class HostingOrderResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'fqdn' => $this->fqdn,
            'status' => $this->status->value,
            'failure' => $this->failure_code
                ? [
                    'code' => $this->failure_code,
                    'message' => $this->safe_failure_message,
                ]
                : null,
            'paid_at' => $this->paid_at,
            'fulfilled_at' => $this->fulfilled_at,
            'cancelled_at' => $this->cancelled_at,
            'expires_at' => $this->expires_at,
            'can_cancel' =>
                $this->status === HostingOrderStatus::AwaitingPayment &&
                !$this->subscription_id,
            'created_at' => $this->created_at,
            'plan' => $this->whenLoaded(
                'plan',
                fn() => [
                    'id' => $this->plan->id,
                    'product_id' => $this->plan->product_id,
                    'name' => $this->plan->product?->name,
                    'type' => $this->plan->type->value,
                ],
            ),
            'price' => $this->whenLoaded(
                'price',
                fn() => [
                    'id' => $this->price->id,
                    'amount' => $this->price->amount,
                    'currency' => $this->price->currency,
                    'interval' => $this->price->interval,
                    'interval_count' => $this->price->interval_count,
                ],
            ),
            'account' => $this->whenLoaded(
                'account',
                fn() => new HostingAccountResource($this->account),
            ),
        ];
    }
}
