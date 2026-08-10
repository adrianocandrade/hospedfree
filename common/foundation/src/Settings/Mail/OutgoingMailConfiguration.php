<?php

namespace Common\Settings\Mail;

final class OutgoingMailConfiguration
{
    public static function resolveResendApiKey(
        ?string $adminApiKey,
        ?string $laravelApiKey,
    ): ?string {
        $adminApiKey = trim((string) $adminApiKey);

        return $adminApiKey !== '' ? $adminApiKey : $laravelApiKey;
    }

    /**
     * @return array{
     *     primary: string,
     *     fallback: string|null,
     *     default: string,
     *     failover_mailers: list<string>
     * }
     */
    public static function resolve(?string $primary, ?string $fallback): array
    {
        $primary = trim((string) $primary) ?: 'log';
        $fallback = trim((string) $fallback) ?: null;

        // Preserve installations that already opted into Laravel's example
        // failover mailer before primary/fallback fields were available.
        if ($primary === 'failover') {
            $primary = 'smtp';
            $fallback ??= 'log';
        }

        if ($fallback === $primary || $fallback === 'failover') {
            $fallback = null;
        }

        $mailers = array_values(
            array_filter([$primary, $fallback], fn($mailer) => $mailer),
        );

        return [
            'primary' => $primary,
            'fallback' => $fallback,
            'default' => $fallback ? 'failover' : $primary,
            'failover_mailers' => $mailers,
        ];
    }
}
