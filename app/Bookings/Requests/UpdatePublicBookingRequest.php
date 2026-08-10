<?php

namespace App\Bookings\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePublicBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date' => 'required|date_format:Y-m-d',
            'time' => 'required|date_format:H:i',
        ];
    }
}
