<?php

namespace App\QrCodes\Services;

use Illuminate\Support\Str;
use InvalidArgumentException;

class PixPayloadBuilder
{
    /** @param array<string, mixed> $data */
    public function build(array $data): string
    {
        $key = $this->normalizeKey(
            (string) ($data['key_type'] ?? ''),
            (string) ($data['key'] ?? ''),
        );
        $receiverName = $this->normalizeMerchantText(
            (string) ($data['receiver_name'] ?? ''),
            25,
        );
        $receiverCity = $this->normalizeMerchantText(
            (string) ($data['receiver_city'] ?? ''),
            15,
        );

        if ($receiverName === '' || $receiverCity === '') {
            throw new InvalidArgumentException(
                'Informe o nome e a cidade do recebedor.',
            );
        }

        $merchantAccount =
            $this->tlv('00', 'BR.GOV.BCB.PIX') . $this->tlv('01', $key);
        $description = trim((string) ($data['description'] ?? ''));
        if ($description !== '') {
            $availableBytes = max(0, 99 - strlen($merchantAccount) - 4);
            $description = $this->limitBytes(
                $description,
                min(30, $availableBytes),
            );
            if ($description !== '') {
                $merchantAccount .= $this->tlv('02', $description);
            }
        }

        $payload =
            $this->tlv('00', '01') .
            $this->tlv('26', $merchantAccount) .
            $this->tlv('52', '0000') .
            $this->tlv('53', '986');

        $amount = $this->normalizeAmount($data['amount'] ?? null);
        if ($amount !== null) {
            $payload .= $this->tlv('54', $amount);
        }

        $txid = trim((string) ($data['txid'] ?? '')) ?: '***';
        if (!preg_match('/^[A-Za-z0-9*]{1,25}$/', $txid)) {
            throw new InvalidArgumentException(
                'O TxID deve conter apenas letras, números ou asteriscos.',
            );
        }

        $payload .=
            $this->tlv('58', 'BR') .
            $this->tlv('59', $receiverName) .
            $this->tlv('60', $receiverCity) .
            $this->tlv('62', $this->tlv('05', $txid)) .
            '6304';

        return $payload . $this->crc16($payload);
    }

    public function normalizeKey(string $type, string $key): string
    {
        $key = trim($key);

        return match ($type) {
            'cpf' => $this->normalizeCpf($key),
            'cnpj' => $this->normalizeCnpj($key),
            'phone' => QrCodePayloadBuilder::normalizePhone($key),
            'email' => $this->normalizeEmail($key),
            'random' => $this->normalizeRandomKey($key),
            default => throw new InvalidArgumentException(
                'Selecione um tipo de chave Pix válido.',
            ),
        };
    }

    private function normalizeCpf(string $value): string
    {
        $digits = preg_replace('/\D+/', '', $value) ?? '';
        if (!$this->validDocument($digits, 11)) {
            throw new InvalidArgumentException('Informe um CPF válido.');
        }
        return $digits;
    }

    private function normalizeCnpj(string $value): string
    {
        $digits = preg_replace('/\D+/', '', $value) ?? '';
        if (!$this->validDocument($digits, 14)) {
            throw new InvalidArgumentException('Informe um CNPJ válido.');
        }
        return $digits;
    }

    private function normalizeEmail(string $value): string
    {
        $email = Str::lower($value);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Informe um e-mail Pix válido.');
        }
        return $email;
    }

    private function normalizeRandomKey(string $value): string
    {
        if (!Str::isUuid($value)) {
            throw new InvalidArgumentException(
                'Informe uma chave aleatória Pix no formato UUID.',
            );
        }
        return Str::lower($value);
    }

    private function validDocument(string $digits, int $length): bool
    {
        if (strlen($digits) !== $length || preg_match('/^(\d)\1+$/', $digits)) {
            return false;
        }

        if ($length === 11) {
            for ($position = 9; $position < 11; $position++) {
                $sum = 0;
                for ($index = 0; $index < $position; $index++) {
                    $sum += ((int) $digits[$index]) * ($position + 1 - $index);
                }
                $digit = (($sum * 10) % 11) % 10;
                if ($digit !== (int) $digits[$position]) {
                    return false;
                }
            }
            return true;
        }

        $weights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        for ($position = 12; $position < 14; $position++) {
            $sum = 0;
            $offset = 13 - $position;
            for ($index = 0; $index < $position; $index++) {
                $sum += ((int) $digits[$index]) * $weights[$index + $offset];
            }
            $remainder = $sum % 11;
            $digit = $remainder < 2 ? 0 : 11 - $remainder;
            if ($digit !== (int) $digits[$position]) {
                return false;
            }
        }

        return true;
    }

    private function normalizeAmount(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $normalized = trim((string) $value);
        if (str_contains($normalized, ',')) {
            $normalized = str_replace('.', '', $normalized);
            $normalized = str_replace(',', '.', $normalized);
        }
        if (!is_numeric($normalized) || (float) $normalized <= 0) {
            throw new InvalidArgumentException(
                'O valor Pix deve ser maior que zero.',
            );
        }

        return number_format((float) $normalized, 2, '.', '');
    }

    private function normalizeMerchantText(
        string $value,
        int $maxLength,
    ): string {
        $ascii = Str::upper(Str::ascii(trim($value)));
        $ascii = preg_replace('/[^A-Z0-9 ]+/', '', $ascii) ?? '';
        $ascii = preg_replace('/\s+/', ' ', $ascii) ?? '';

        return trim(substr($ascii, 0, $maxLength));
    }

    private function limitBytes(string $value, int $bytes): string
    {
        return $bytes > 0 ? mb_strcut($value, 0, $bytes, 'UTF-8') : '';
    }

    private function tlv(string $id, string $value): string
    {
        if (strlen($value) > 99) {
            throw new InvalidArgumentException(
                'O conteúdo Pix excede o limite permitido.',
            );
        }

        return $id .
            str_pad((string) strlen($value), 2, '0', STR_PAD_LEFT) .
            $value;
    }

    private function crc16(string $payload): string
    {
        $crc = 0xffff;
        foreach (str_split($payload) as $character) {
            $crc ^= ord($character) << 8;
            for ($bit = 0; $bit < 8; $bit++) {
                $crc =
                    ($crc & 0x8000) !== 0
                        ? (($crc << 1) ^ 0x1021) & 0xffff
                        : ($crc << 1) & 0xffff;
            }
        }

        return strtoupper(str_pad(dechex($crc), 4, '0', STR_PAD_LEFT));
    }
}
