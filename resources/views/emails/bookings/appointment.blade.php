<p>{{ __('Your booking has been :event.', ['event' => $event]) }}</p>
<p><strong>{{ $appointment->service?->name }}</strong></p>
<p>{{ $appointment->starts_at?->timezone($appointment->timezone)->format('Y-m-d H:i') }} ({{ $appointment->timezone }})</p>
@if($appointment->meeting_url)<p><a href="{{ $appointment->meeting_url }}">{{ __('Open meeting link') }}</a></p>@endif
@if($appointment->payment_url)<p><a href="{{ $appointment->payment_url }}">{{ __('Payment link') }}</a></p>@endif
@if($appointment->pix_key)<p><strong>{{ __('PIX details') }}:</strong> {{ $appointment->pix_key }}</p>@endif
@if($appointment->payment_instructions)<p>{{ $appointment->payment_instructions }}</p>@endif
@if($appointment->payment_confirmation_url)<p><a href="{{ $appointment->payment_confirmation_url }}">{{ __('Send payment receipt') }}</a></p>@endif
@if($appointment->payment_confirmation_instructions)<p>{{ $appointment->payment_confirmation_instructions }}</p>@endif
@if($appointment->getAttribute('manage_token'))<p><a href="{{ rtrim(config('app.url'), '/') . '/api/v1/public/booking/' . $appointment->getAttribute('manage_token') }}">{{ __('Manage booking') }}</a></p>@endif
