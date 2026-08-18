<?php

namespace App\Hosting\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

final class Hostname implements ValidationRule
{
    public function validate(
        string $attribute,
        mixed $value,
        Closure $fail,
    ): void {
        if (!is_string($value)) {
            $fail(__('validation.string', ['attribute' => $attribute]));

            return;
        }

        if (
            !filter_var($value, FILTER_VALIDATE_IP) &&
            !filter_var($value, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME)
        ) {
            $fail(__('validation.regex', ['attribute' => $attribute]));
        }
    }
}
