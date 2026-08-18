<?php

namespace App\Admin;

class SecurityRetentionSettingsValidator
{
    public const KEYS = [
        'outgoing_email_log_retention_days',
        'customer_communication_retention_days',
        'customer_security_event_retention_days',
        'administrative_security_audit_retention_days',
        'user_session_retention_days',
    ];

    public function fails(array $settings): ?array
    {
        foreach (self::KEYS as $key) {
            if (!array_key_exists($key, $settings)) {
                continue;
            }

            $value = filter_var($settings[$key], FILTER_VALIDATE_INT);
            if ($value === false || $value < 1 || $value > 3650) {
                return [
                    'retention_group' => __(
                        'Retention periods must be whole days between 1 and 3650.',
                    ),
                ];
            }
        }

        return null;
    }
}
