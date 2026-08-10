<?php

namespace App\QrCodes\Services;

use App\Links\Actions\GetMetadataFromUrl;
use App\QrCodes\QrCodeType;
use InvalidArgumentException;

class QrCodePayloadBuilder
{
    public function __construct(
        private readonly PixPayloadBuilder $pix = new PixPayloadBuilder(),
        private readonly WifiPayloadBuilder $wifi = new WifiPayloadBuilder(),
        private readonly VCardPayloadBuilder $vcard = new VCardPayloadBuilder(),
    ) {}

    /** @param array<string, mixed> $data */
    public function build(
        QrCodeType|string $type,
        array $data = [],
        ?string $longUrl = null,
        ?string $backHalf = null,
    ): string {
        $type = is_string($type) ? QrCodeType::from($type) : $type;

        if ($type->supportsRedirectCapabilities() && $backHalf) {
            return url("qr/$backHalf");
        }

        return $this->buildDirect($type, $data, $longUrl);
    }

    /** @param array<string, mixed> $data */
    public function buildDirect(
        QrCodeType|string $type,
        array $data = [],
        ?string $longUrl = null,
    ): string {
        $type = is_string($type) ? QrCodeType::from($type) : $type;

        return match ($type) {
            QrCodeType::Url => $this->buildUrl(
                $longUrl ?? ($data['url'] ?? null),
            ),
            QrCodeType::Pix => $this->pix->build($data),
            QrCodeType::Wifi => $this->wifi->build($data),
            QrCodeType::Whatsapp => $this->buildWhatsapp($data),
            QrCodeType::Phone => 'tel:' .
                self::normalizePhone(
                    $this->requireValue(
                        $data['phone'] ?? null,
                        'Informe o telefone.',
                    ),
                ),
            QrCodeType::Email => $this->buildEmail($data),
            QrCodeType::Sms => $this->buildSms($data),
            QrCodeType::Text => $this->requireValue(
                $data['content'] ?? null,
                'Informe o conteúdo do QR Code.',
            ),
            QrCodeType::Vcard => $this->vcard->build($data),
            QrCodeType::Location => $this->buildLocation($data),
        };
    }

    public static function normalizePhone(
        string $phone,
        bool $withPlus = true,
    ): string {
        $hasInternationalPrefix = str_starts_with(trim($phone), '+');
        $digits = preg_replace('/\D+/', '', $phone) ?? '';
        if (
            !$hasInternationalPrefix &&
            strlen($digits) >= 10 &&
            strlen($digits) <= 11
        ) {
            $digits = '55' . $digits;
        }
        if (!preg_match('/^\d{10,15}$/', $digits)) {
            throw new InvalidArgumentException(
                'Informe o telefone com código do país e DDD.',
            );
        }

        return ($withPlus ? '+' : '') . $digits;
    }

    private function buildUrl(mixed $value): string
    {
        $value = $this->requireValue($value, 'Informe a URL de destino.');
        if (preg_match('/^(?:javascript|data|vbscript):/i', $value)) {
            throw new InvalidArgumentException(
                'Use uma URL HTTP ou HTTPS segura.',
            );
        }

        $url = GetMetadataFromUrl::normalizeUrl($value);
        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
        if (!in_array($scheme, ['http', 'https'], true)) {
            throw new InvalidArgumentException(
                'Use uma URL HTTP ou HTTPS segura.',
            );
        }

        return $url;
    }

    /** @param array<string, mixed> $data */
    private function buildWhatsapp(array $data): string
    {
        $phone = self::normalizePhone(
            $this->requireValue($data['phone'] ?? null, 'Informe o WhatsApp.'),
            false,
        );
        $message = trim((string) ($data['message'] ?? ''));

        return "https://wa.me/$phone" .
            ($message !== ''
                ? '?' .
                    http_build_query(
                        ['text' => $message],
                        '',
                        '&',
                        PHP_QUERY_RFC3986,
                    )
                : '');
    }

    /** @param array<string, mixed> $data */
    private function buildEmail(array $data): string
    {
        $email = strtolower(
            $this->requireValue(
                $data['email'] ?? null,
                'Informe o e-mail do destinatário.',
            ),
        );
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Informe um e-mail válido.');
        }

        $query = array_filter(
            [
                'subject' => trim((string) ($data['subject'] ?? '')),
                'body' => trim((string) ($data['message'] ?? '')),
            ],
            fn(string $value) => $value !== '',
        );

        return "mailto:$email" .
            ($query
                ? '?' . http_build_query($query, '', '&', PHP_QUERY_RFC3986)
                : '');
    }

    /** @param array<string, mixed> $data */
    private function buildSms(array $data): string
    {
        $phone = self::normalizePhone(
            $this->requireValue(
                $data['phone'] ?? null,
                'Informe o telefone do SMS.',
            ),
        );

        return "SMSTO:$phone:" . trim((string) ($data['message'] ?? ''));
    }

    /** @param array<string, mixed> $data */
    private function buildLocation(array $data): string
    {
        $latitude = filter_var(
            $data['latitude'] ?? null,
            FILTER_VALIDATE_FLOAT,
        );
        $longitude = filter_var(
            $data['longitude'] ?? null,
            FILTER_VALIDATE_FLOAT,
        );
        if ($latitude === false || $latitude < -90 || $latitude > 90) {
            throw new InvalidArgumentException('Informe uma latitude válida.');
        }
        if ($longitude === false || $longitude < -180 || $longitude > 180) {
            throw new InvalidArgumentException('Informe uma longitude válida.');
        }

        return sprintf('geo:%s,%s', $latitude, $longitude);
    }

    private function requireValue(mixed $value, string $message): string
    {
        $value = trim((string) $value);
        if ($value === '') {
            throw new InvalidArgumentException($message);
        }

        return $value;
    }
}
