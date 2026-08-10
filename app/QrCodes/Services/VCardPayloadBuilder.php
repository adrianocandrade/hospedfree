<?php

namespace App\QrCodes\Services;

use App\Links\Actions\GetMetadataFromUrl;
use InvalidArgumentException;

class VCardPayloadBuilder
{
    /** @param array<string, mixed> $data */
    public function build(array $data): string
    {
        $firstName = trim((string) ($data['first_name'] ?? ''));
        $lastName = trim((string) ($data['last_name'] ?? ''));
        if ($firstName === '') {
            throw new InvalidArgumentException('Informe o nome do contato.');
        }

        $fullName = trim("$firstName $lastName");
        $lines = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            sprintf(
                'N:%s;%s;;;',
                $this->escape($lastName),
                $this->escape($firstName),
            ),
            'FN:' . $this->escape($fullName),
        ];

        $phone = trim((string) ($data['phone'] ?? ''));
        if ($phone !== '') {
            $phone = QrCodePayloadBuilder::normalizePhone($phone);
        }

        $email = strtolower(trim((string) ($data['email'] ?? '')));
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Informe um e-mail válido.');
        }

        $website = trim((string) ($data['website'] ?? ''));
        if ($website !== '') {
            $website = GetMetadataFromUrl::normalizeUrl($website);
            $scheme = strtolower((string) parse_url($website, PHP_URL_SCHEME));
            if (!in_array($scheme, ['http', 'https'], true)) {
                throw new InvalidArgumentException(
                    'Informe um site HTTP ou HTTPS válido.',
                );
            }
        }

        $optionalLines = [
            'ORG' => $data['company'] ?? null,
            'TITLE' => $data['job_title'] ?? null,
            'TEL;TYPE=CELL' => $phone,
            'EMAIL' => $email,
            'URL' => $website,
            'ADR;TYPE=WORK' => $data['address'] ?? null,
            'NOTE' => $data['notes'] ?? null,
        ];

        foreach ($optionalLines as $field => $value) {
            $value = trim((string) $value);
            if ($value !== '') {
                $lines[] = "$field:" . $this->escape($value);
            }
        }

        $lines[] = 'END:VCARD';

        return implode("\r\n", $lines);
    }

    private function escape(string $value): string
    {
        return str_replace(
            ['\\', "\r\n", "\r", "\n", ';', ','],
            ['\\\\', '\\n', '\\n', '\\n', '\\;', '\\,'],
            $value,
        );
    }
}
