<?php

namespace App\Security;

use Illuminate\Http\Request;

class RequestSecurityContext
{
    public function maskedIp(Request|null $request = null): ?string
    {
        return $this->maskIp($request?->ip());
    }

    public function maskIp(?string $ip): ?string
    {
        if (!$ip || !filter_var($ip, FILTER_VALIDATE_IP)) {
            return null;
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $parts = explode('.', $ip);
            $parts[3] = 'xxx';

            return implode('.', $parts);
        }

        $packed = @inet_pton($ip);
        if ($packed === false) {
            return null;
        }

        $normalized = inet_ntop(substr($packed, 0, 8) . str_repeat("\0", 8));

        return $normalized ? rtrim($normalized, ':') . '::/64' : null;
    }
}
