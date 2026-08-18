<?php

namespace App\Hosting\Services;

class SafeToolUrl
{
    public function validate(?string $url): ?string
    {
        if (!$url || !filter_var($url, FILTER_VALIDATE_URL)) {
            return null;
        }

        $parts = parse_url($url);

        if (
            ($parts['scheme'] ?? null) !== 'https' ||
            empty($parts['host']) ||
            isset($parts['user']) ||
            isset($parts['pass'])
        ) {
            return null;
        }

        return $url;
    }
}
