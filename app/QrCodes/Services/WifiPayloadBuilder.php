<?php

namespace App\QrCodes\Services;

use InvalidArgumentException;

class WifiPayloadBuilder
{
    /** @param array{ssid?: string, security?: string, password?: string, hidden?: bool} $data */
    public function build(array $data): string
    {
        $ssid = trim((string) ($data['ssid'] ?? ''));
        if ($ssid === '') {
            throw new InvalidArgumentException('Informe o nome da rede Wi-Fi.');
        }

        $security = strtoupper((string) ($data['security'] ?? 'WPA'));
        if (in_array($security, ['NONE', 'NOPASS'], true)) {
            $security = 'nopass';
        }
        if (!in_array($security, ['WPA', 'WEP', 'nopass'], true)) {
            throw new InvalidArgumentException(
                'Tipo de segurança Wi-Fi inválido.',
            );
        }

        $password = (string) ($data['password'] ?? '');
        if ($security !== 'nopass' && $password === '') {
            throw new InvalidArgumentException(
                'Informe a senha da rede Wi-Fi.',
            );
        }

        $payload = sprintf('WIFI:T:%s;S:%s;', $security, $this->escape($ssid));

        if ($security !== 'nopass') {
            $payload .= 'P:' . $this->escape($password) . ';';
        }

        return $payload .
            'H:' .
            (!empty($data['hidden']) ? 'true' : 'false') .
            ';;';
    }

    private function escape(string $value): string
    {
        return preg_replace('/([\\\\;,:\"])/u', '\\\\$1', $value) ?? $value;
    }
}
