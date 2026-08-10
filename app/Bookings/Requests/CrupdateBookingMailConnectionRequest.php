<?php

namespace App\Bookings\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CrupdateBookingMailConnectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:120',
            'provider' => ['required', Rule::in(['platform', 'smtp', 'gmail', 'mailgun', 'ses'])],
            'from_address' => 'nullable|email|max:255',
            'from_name' => 'nullable|string|max:120',
            'reply_to' => 'nullable|email|max:255',
            'credentials' => 'nullable|array|max:20',
            'active' => 'sometimes|boolean',
        ];
    }
}
