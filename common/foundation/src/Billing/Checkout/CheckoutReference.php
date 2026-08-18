<?php

namespace Common\Billing\Checkout;

use Illuminate\Support\Str;

final class CheckoutReference
{
    private const PATTERN = '/\A([a-z][a-z0-9_]{1,31}):([0-9a-f-]{36})\z/D';

    public static function make(string $context, string $identifier): string
    {
        $reference = "{$context}:" . strtolower($identifier);

        if (!self::normalize($reference)) {
            throw new \InvalidArgumentException('Invalid checkout reference.');
        }

        return $reference;
    }

    public static function normalize(mixed $reference): ?string
    {
        if (!is_string($reference) || strlen($reference) > 80) {
            return null;
        }

        $reference = strtolower(trim($reference));

        if (!preg_match(self::PATTERN, $reference, $matches)) {
            return null;
        }

        return Str::isUuid($matches[2]) ? $reference : null;
    }

    public static function identifierFor(mixed $reference, string $context): ?string
    {
        $reference = self::normalize($reference);

        if (!$reference || !str_starts_with($reference, "{$context}:")) {
            return null;
        }

        return substr($reference, strlen($context) + 1);
    }
}
