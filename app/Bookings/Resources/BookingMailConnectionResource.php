<?php

namespace App\Bookings\Resources;

use App\Bookings\Models\BookingMailConnection;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin BookingMailConnection */
class BookingMailConnectionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'provider' => $this->provider,
            'from_address' => $this->from_address,
            'from_name' => $this->from_name,
            'reply_to' => $this->reply_to,
            'active' => $this->active,
            'last_tested_at' => $this->last_tested_at,
            'last_error' => $this->last_error,
            'has_credentials' => !empty($this->getRawOriginal('credentials')),
        ];
    }
}
