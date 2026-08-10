<?php

namespace App\Bookings\Support;

use Illuminate\Support\Arr;

final class BookingConfig
{
    public const SERVICE_TYPES = [
        'appointment',
        'meeting',
        'class',
        'consultation',
        'salon',
        'barbershop',
        'online',
        'other',
    ];

    public const SERVICE_TYPES_WITH_MEETING = ['meeting', 'class', 'online'];

    public const PAYMENT_METHODS = ['none', 'link', 'pix', 'link_and_pix'];

    public const STATUSES = [
        'confirmed',
        'cancelled_by_customer',
        'cancelled_by_provider',
        'rescheduled',
        'completed',
        'no_show',
    ];

    public const EXCEPTION_TYPES = ['closed', 'open', 'break'];

    public static function normalizeService(array $data): array
    {
        $paymentUrl = self::safeUrl($data['payment_url'] ?? null);
        $pixKey = trim((string) ($data['pix_key'] ?? ''));
        $paymentMethod = $data['payment_method'] ?? null;
        if (!in_array($paymentMethod, self::PAYMENT_METHODS, true)) {
            $paymentMethod = match (true) {
                !empty($paymentUrl) && $pixKey !== '' => 'link_and_pix',
                !empty($paymentUrl) => 'link',
                $pixKey !== '' => 'pix',
                default => 'none',
            };
        }

        if ($paymentMethod === 'none') {
            $paymentUrl = null;
            $pixKey = '';
        }

        $paymentConfirmationUrl = self::safeUrl($data['payment_confirmation_url'] ?? null);
        $paymentConfirmationInstructions = trim((string) ($data['payment_confirmation_instructions'] ?? ''));
        if ($paymentMethod === 'none') {
            $paymentConfirmationUrl = null;
            $paymentConfirmationInstructions = '';
        }

        $serviceType = in_array($data['service_type'] ?? null, self::SERVICE_TYPES, true)
            ? $data['service_type']
            : 'appointment';
        $meetingUrl = self::safeUrl($data['meeting_url'] ?? null);
        if (!in_array($serviceType, self::SERVICE_TYPES_WITH_MEETING, true)) {
            $meetingUrl = null;
        }

        return [
            'name' => trim((string) ($data['name'] ?? '')),
            'description' => trim((string) ($data['description'] ?? '')),
            'image' => self::safeUrl($data['image'] ?? null),
            'service_type' => $serviceType,
            'duration_minutes' => (int) ($data['duration_minutes'] ?? 30),
            'slot_interval_minutes' => array_key_exists('slot_interval_minutes', $data) && $data['slot_interval_minutes'] !== ''
                ? (int) $data['slot_interval_minutes']
                : null,
            'capacity' => array_key_exists('capacity', $data) && $data['capacity'] !== ''
                ? (int) $data['capacity']
                : null,
            'buffer_before_minutes' => (int) ($data['buffer_before_minutes'] ?? 0),
            'buffer_after_minutes' => (int) ($data['buffer_after_minutes'] ?? 0),
            'price' => ($data['price'] ?? null) === '' ? null : ($data['price'] ?? null),
            'currency' => strtoupper(trim((string) ($data['currency'] ?? 'BRL'))),
            'meeting_url' => $meetingUrl,
            'payment_method' => $paymentMethod,
            'payment_url' => in_array($paymentMethod, ['link', 'link_and_pix'], true) ? $paymentUrl : null,
            'pix_key' => in_array($paymentMethod, ['pix', 'link_and_pix'], true) ? $pixKey : '',
            'payment_instructions' => $paymentMethod === 'none'
                ? ''
                : trim((string) ($data['payment_instructions'] ?? '')),
            'payment_confirmation_url' => $paymentConfirmationUrl,
            'payment_confirmation_instructions' => $paymentConfirmationInstructions,
            'release_info_after_booking' => (bool) ($data['release_info_after_booking'] ?? true),
            'active' => (bool) ($data['active'] ?? true),
            'position' => (int) ($data['position'] ?? 0),
        ];
    }

    public static function normalizeSettings(array $data): array
    {
        $timezone = trim((string) ($data['timezone'] ?? 'UTC'));

        if (!in_array($timezone, \DateTimeZone::listIdentifiers(), true)) {
            $timezone = 'UTC';
        }

        return [
            'timezone' => $timezone,
            'mail_connection_id' => isset($data['mail_connection_id']) ? (int) $data['mail_connection_id'] : null,
            'default_slot_interval_minutes' => max(5, (int) ($data['default_slot_interval_minutes'] ?? 30)),
            'default_capacity' => max(1, (int) ($data['default_capacity'] ?? 1)),
            'cancellation_deadline_minutes' => isset($data['cancellation_deadline_minutes']) ? max(0, (int) $data['cancellation_deadline_minutes']) : null,
            'customer_can_cancel' => (bool) ($data['customer_can_cancel'] ?? true),
            'customer_can_reschedule' => (bool) ($data['customer_can_reschedule'] ?? true),
            'reminder_enabled' => (bool) ($data['reminder_enabled'] ?? false),
            'reminder_minutes' => max(0, (int) ($data['reminder_minutes'] ?? 1440)),
        ];
    }

    public static function safeUrl(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (!is_string($value) || !filter_var($value, FILTER_VALIDATE_URL)) {
            return null;
        }

        $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));
        return in_array($scheme, ['http', 'https'], true) ? $value : null;
    }

    public static function safeArray(array $data, array $allowed): array
    {
        return Arr::only($data, $allowed);
    }
}
