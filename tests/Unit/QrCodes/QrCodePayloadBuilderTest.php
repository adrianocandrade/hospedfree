<?php

namespace Tests\Unit\QrCodes;

use App\QrCodes\QrCodeType;
use App\QrCodes\Services\PixPayloadBuilder;
use App\QrCodes\Services\QrCodePayloadBuilder;
use App\QrCodes\Services\WifiPayloadBuilder;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class QrCodePayloadBuilderTest extends TestCase
{
    public function test_it_builds_a_pix_payload_with_valid_crc_and_brazilian_amount(): void
    {
        $payload = (new PixPayloadBuilder())->build([
            'key_type' => 'cpf',
            'key' => '529.982.247-25',
            'receiver_name' => 'José da Silva',
            'receiver_city' => 'São Paulo',
            'amount' => '10,50',
            'description' => 'Pedido 42',
        ]);

        $this->assertStringStartsWith('000201', $payload);
        $this->assertStringContainsString('0014BR.GOV.BCB.PIX', $payload);
        $this->assertStringContainsString('011152998224725', $payload);
        $this->assertStringContainsString('540510.50', $payload);
        $this->assertStringContainsString('5913JOSE DA SILVA', $payload);
        $this->assertStringContainsString('6009SAO PAULO', $payload);
        $this->assertStringContainsString('6304', $payload);
        $this->assertSame(
            $this->crc16(substr($payload, 0, -4)),
            substr($payload, -4),
        );
    }

    public function test_it_validates_pix_document_and_random_keys(): void
    {
        $builder = new PixPayloadBuilder();

        $this->assertSame(
            '11222333000181',
            $builder->normalizeKey('cnpj', '11.222.333/0001-81'),
        );
        $this->assertSame(
            '123e4567-e89b-12d3-a456-426614174000',
            $builder->normalizeKey(
                'random',
                '123E4567-E89B-12D3-A456-426614174000',
            ),
        );

        $this->expectException(InvalidArgumentException::class);
        $builder->normalizeKey('cpf', '111.111.111-11');
    }

    public function test_it_rejects_invalid_cnpj_and_random_pix_keys(): void
    {
        $builder = new PixPayloadBuilder();

        foreach (
            [
                ['cnpj', '11.111.111/1111-11'],
                ['random', 'not-a-uuid'],
            ] as [$type, $key]
        ) {
            try {
                $builder->normalizeKey($type, $key);
                $this->fail("Expected the $type key to be rejected.");
            } catch (InvalidArgumentException) {
                $this->addToAssertionCount(1);
            }
        }
    }

    public function test_it_normalizes_pix_and_contact_phones(): void
    {
        $this->assertSame(
            '+5511999999999',
            QrCodePayloadBuilder::normalizePhone('(11) 99999-9999'),
        );
        $this->assertSame(
            '+14155552671',
            QrCodePayloadBuilder::normalizePhone('+1 (415) 555-2671'),
        );
    }

    public function test_it_escapes_wifi_special_characters_and_omits_open_network_password(): void
    {
        $builder = new WifiPayloadBuilder();

        $this->assertSame(
            'WIFI:T:WPA;S:Minha\\;Rede;P:senha\\:forte;H:true;;',
            $builder->build([
                'ssid' => 'Minha;Rede',
                'security' => 'WPA',
                'password' => 'senha:forte',
                'hidden' => true,
            ]),
        );
        $this->assertSame(
            'WIFI:T:nopass;S:Convidados;H:false;;',
            $builder->build([
                'ssid' => 'Convidados',
                'security' => 'nopass',
                'password' => 'não deve aparecer',
            ]),
        );
    }

    public function test_it_builds_supported_direct_payloads(): void
    {
        $builder = new QrCodePayloadBuilder();

        $this->assertSame(
            'https://wa.me/5511999999999?text=Ol%C3%A1%20mundo',
            $builder->buildDirect(QrCodeType::Whatsapp, [
                'phone' => '(11) 99999-9999',
                'message' => 'Olá mundo',
            ]),
        );
        $this->assertSame(
            'mailto:cliente@example.com?subject=Proposta&body=Ol%C3%A1',
            $builder->buildDirect(QrCodeType::Email, [
                'email' => 'CLIENTE@example.com',
                'subject' => 'Proposta',
                'message' => 'Olá',
            ]),
        );
        $this->assertSame(
            'geo:-23.5505,-46.6333',
            $builder->buildDirect(QrCodeType::Location, [
                'latitude' => '-23.5505',
                'longitude' => '-46.6333',
            ]),
        );
        $this->assertSame(
            'tel:+5511999999999',
            $builder->buildDirect(QrCodeType::Phone, [
                'phone' => '(11) 99999-9999',
            ]),
        );
        $this->assertSame(
            'SMSTO:+5511999999999:Olá',
            $builder->buildDirect(QrCodeType::Sms, [
                'phone' => '(11) 99999-9999',
                'message' => 'Olá',
            ]),
        );
        $this->assertSame(
            'Conteúdo simples',
            $builder->buildDirect(QrCodeType::Text, [
                'content' => 'Conteúdo simples',
            ]),
        );
        $this->assertStringContainsString(
            "BEGIN:VCARD\r\nVERSION:3.0",
            $builder->buildDirect(QrCodeType::Vcard, [
                'first_name' => 'Ana',
                'last_name' => 'Silva',
                'email' => 'ana@example.com',
            ]),
        );
        $this->assertStringContainsString(
            'TEL;TYPE=CELL:+5511999999999',
            $builder->buildDirect(QrCodeType::Vcard, [
                'first_name' => 'Ana',
                'phone' => '(11) 99999-9999',
            ]),
        );
    }

    public function test_only_url_and_whatsapp_use_redirect_capabilities(): void
    {
        foreach (QrCodeType::cases() as $type) {
            $expected = in_array(
                $type,
                [QrCodeType::Url, QrCodeType::Whatsapp],
                true,
            );
            $this->assertSame(
                $expected,
                $type->supportsRedirectCapabilities(),
            );
        }
    }

    public function test_it_rejects_dangerous_url_protocols(): void
    {
        $this->expectException(InvalidArgumentException::class);

        (new QrCodePayloadBuilder())->buildDirect(
            QrCodeType::Url,
            longUrl: 'javascript:alert(1)',
        );
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
