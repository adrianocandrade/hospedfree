<?php

namespace App\Bookings\Requests;

use App\Bookings\Support\BookingConfig;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateBookingAvailabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'settings' => 'nullable|array',
            'settings.timezone' => ['nullable', 'string', Rule::in(\DateTimeZone::listIdentifiers())],
            'settings.mail_connection_id' => 'nullable|integer|min:1',
            'settings.default_slot_interval_minutes' => 'nullable|integer|min:5|max:1440',
            'settings.default_capacity' => 'nullable|integer|min:1|max:1000',
            'settings.cancellation_deadline_minutes' => 'nullable|integer|min:0|max:10080',
            'settings.customer_can_cancel' => 'sometimes|boolean',
            'settings.customer_can_reschedule' => 'sometimes|boolean',
            'settings.reminder_enabled' => 'sometimes|boolean',
            'settings.reminder_minutes' => 'nullable|integer|min:0|max:10080',
            'rules' => 'nullable|array|max:100',
            'rules.*.weekday' => 'required|integer|min:1|max:7',
            'rules.*.start_time' => 'required|date_format:H:i',
            'rules.*.end_time' => 'required|date_format:H:i',
            'rules.*.active' => 'sometimes|boolean',
            'exceptions' => 'nullable|array|max:500',
            'exceptions.*.exception_date' => 'required|date_format:Y-m-d',
            'exceptions.*.type' => ['required', Rule::in(BookingConfig::EXCEPTION_TYPES)],
            'exceptions.*.start_time' => 'nullable|date_format:H:i',
            'exceptions.*.end_time' => 'nullable|date_format:H:i',
            'exceptions.*.reason' => 'nullable|string|max:255',
            'exceptions.*.active' => 'sometimes|boolean',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            foreach ($this->input('rules', []) as $index => $rule) {
                if (($rule['start_time'] ?? '') >= ($rule['end_time'] ?? '')) {
                    $validator->errors()->add("rules.$index.end_time", __('The end time must be after the start time.'));
                }
            }

            foreach ($this->input('exceptions', []) as $index => $exception) {
                if (($exception['type'] ?? 'closed') !== 'closed' && (($exception['start_time'] ?? '') >= ($exception['end_time'] ?? ''))) {
                    $validator->errors()->add("exceptions.$index.end_time", __('The end time must be after the start time.'));
                }
            }
        });
    }
}
