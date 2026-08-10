<?php

namespace App\Bookings\Requests;

use App\Bookings\Support\BookingConfig;
use Illuminate\Foundation\Http\FormRequest;

class CrupdateBookingServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:160',
            'description' => 'nullable|string|max:2000',
            'image' => 'nullable|url:http,https|max:2048',
            'service_type' => 'nullable|string|in:' . implode(',', BookingConfig::SERVICE_TYPES),
            'duration_minutes' => 'required|integer|min:5|max:1440',
            'slot_interval_minutes' => 'nullable|integer|min:5|max:1440',
            'capacity' => 'nullable|integer|min:1|max:1000',
            'buffer_before_minutes' => 'nullable|integer|min:0|max:1440',
            'buffer_after_minutes' => 'nullable|integer|min:0|max:1440',
            'price' => 'nullable|numeric|min:0|max:999999999',
            'currency' => 'nullable|string|size:3',
            'meeting_url' => 'nullable|url:http,https|max:2048',
            'payment_method' => 'nullable|string|in:' . implode(',', BookingConfig::PAYMENT_METHODS),
            'payment_url' => 'nullable|url:http,https|max:2048',
            'pix_key' => 'nullable|string|max:255',
            'payment_instructions' => 'nullable|string|max:2000',
            'payment_confirmation_url' => 'nullable|url:http,https|max:2048',
            'payment_confirmation_instructions' => 'nullable|string|max:2000',
            'release_info_after_booking' => 'sometimes|boolean',
            'active' => 'sometimes|boolean',
            'position' => 'sometimes|integer|min:0|max:10000',
        ];
    }
}
