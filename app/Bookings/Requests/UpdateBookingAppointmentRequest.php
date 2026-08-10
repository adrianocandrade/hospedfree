<?php

namespace App\Bookings\Requests;

use App\Bookings\Support\BookingConfig;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBookingAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::in(BookingConfig::STATUSES)],
            'date' => 'nullable|date_format:Y-m-d',
            'time' => 'nullable|date_format:H:i',
        ];
    }
}
