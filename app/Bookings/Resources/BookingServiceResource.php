<?php

namespace App\Bookings\Resources;

use App\Bookings\Models\BookingService;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin BookingService */
class BookingServiceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'biolink_id' => $this->biolink_id,
            'name' => $this->name,
            'description' => $this->description,
            'image' => $this->image,
            'service_type' => $this->service_type,
            'duration_minutes' => $this->duration_minutes,
            'slot_interval_minutes' => $this->slot_interval_minutes,
            'capacity' => $this->capacity,
            'buffer_before_minutes' => $this->buffer_before_minutes,
            'buffer_after_minutes' => $this->buffer_after_minutes,
            'price' => $this->price,
            'currency' => $this->currency,
            'payment_method' => $this->payment_method,
            'meeting_url' => $this->when($this->canExposePrivateData($request), $this->meeting_url),
            'payment_url' => $this->when($this->canExposePrivateData($request), $this->payment_url),
            'pix_key' => $this->when($this->canExposePrivateData($request), $this->pix_key),
            'payment_instructions' => $this->when($this->canExposePrivateData($request), $this->payment_instructions),
            'payment_confirmation_url' => $this->when($this->canExposePrivateData($request), $this->payment_confirmation_url),
            'payment_confirmation_instructions' => $this->when($this->canExposePrivateData($request), $this->payment_confirmation_instructions),
            'release_info_after_booking' => $this->release_info_after_booking,
            'active' => $this->active,
            'position' => $this->position,
        ];
    }

    private function canExposePrivateData($request): bool
    {
        return (bool) ($request?->route('publicBooking') === false || $request?->user());
    }
}
