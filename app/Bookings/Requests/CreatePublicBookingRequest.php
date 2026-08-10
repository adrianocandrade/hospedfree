<?php

namespace App\Bookings\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreatePublicBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_id' => 'required|integer|min:1',
            'date' => 'required|date_format:Y-m-d',
            'time' => 'required|date_format:H:i',
            'name' => 'required|string|max:120',
            'email' => 'required|email:rfc|max:255',
            'phone' => 'nullable|string|max:40',
        ];
    }
}
