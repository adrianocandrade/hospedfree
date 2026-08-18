<?php

namespace App\Hosting\Services;

use Illuminate\Support\Str;

final class HostingPassword
{
    private const MOFH_COMPATIBLE_LENGTH = 16;

    public static function generate(): string
    {
        return Str::password(
            self::MOFH_COMPATIBLE_LENGTH,
            letters: true,
            numbers: true,
            symbols: false,
        );
    }
}
