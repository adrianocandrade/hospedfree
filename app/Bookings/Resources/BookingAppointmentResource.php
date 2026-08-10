<?php

namespace App\Bookings\Resources;

use App\Bookings\Models\BookingAppointment;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin BookingAppointment */
class BookingAppointmentResource extends JsonResource
{
    public function toArray($request): array
    {
        $public = (bool) $request?->route('publicBooking');
        $manageToken = $this->getAttribute('manage_token');
        $manageUrl = $manageToken ? rtrim(config('app.url'), '/') . '/api/v1/public/booking/' . $manageToken : null;

        return [
            'id' => $this->id,
            'service' => new BookingServiceResource($this->whenLoaded('service')),
            'starts_at' => $this->starts_at,
            'ends_at' => $this->ends_at,
            'timezone' => $this->timezone,
            'customer_name' => $this->when(!$public, $this->customer_name),
            'customer_email' => $this->when(!$public, $this->customer_email),
            'customer_phone' => $this->when(!$public, $this->customer_phone),
            'status' => $this->status,
            'meeting_url' => $this->when($this->release_info_after_booking || !$public, $this->meeting_url),
            'payment_url' => $this->when($this->release_info_after_booking || !$public, $this->payment_url),
            'pix_key' => $this->when($this->release_info_after_booking || !$public, $this->pix_key),
            'payment_instructions' => $this->when($this->release_info_after_booking || !$public, $this->payment_instructions),
            'payment_confirmation_url' => $this->when($this->release_info_after_booking || !$public, $this->payment_confirmation_url),
            'payment_confirmation_instructions' => $this->when($this->release_info_after_booking || !$public, $this->payment_confirmation_instructions),
            'manage_url' => $manageUrl,
            'manage_token_expires_at' => $this->manage_token_expires_at,
        ];
    }
}
