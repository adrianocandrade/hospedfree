<?php

namespace App\Bookings\Support;

use Illuminate\Support\Str;

final class BookingToken
{
    public static function create(): array
    {
        $plain = Str::random(64);
        return [$plain, hash('sha256', $plain)];
    }

    public static function hash(string $plain): string
    {
        return hash('sha256', $plain);
    }
}
