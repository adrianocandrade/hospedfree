<?php

namespace Tests\Unit;

use App\Bookings\Support\BookingConfig;
use App\Bookings\Support\BookingToken;
use Tests\TestCase;

class BookingConfigTest extends TestCase
{
    public function test_service_config_normalizes_safe_urls_and_defaults(): void
    {
        $service = BookingConfig::normalizeService([
            'name' => ' Consultoria ',
            'duration_minutes' => 45,
            'meeting_url' => 'https://meet.example.test/room',
            'payment_url' => 'javascript:alert(1)',
            'currency' => 'brl',
            'service_type' => 'meeting',
        ]);

        $this->assertSame('Consultoria', $service['name']);
        $this->assertSame('https://meet.example.test/room', $service['meeting_url']);
        $this->assertNull($service['payment_url']);
        $this->assertSame('BRL', $service['currency']);
        $this->assertSame('meeting', $service['service_type']);
        $this->assertSame('none', $service['payment_method']);
        $this->assertNull($service['capacity']);
    }

    public function test_service_payment_method_controls_optional_payment_fields(): void
    {
        $service = BookingConfig::normalizeService([
            'name' => 'Aula em grupo',
            'duration_minutes' => 60,
            'service_type' => 'class',
            'payment_method' => 'link_and_pix',
            'payment_url' => 'https://pay.example.test/checkout',
            'pix_key' => 'pix@example.test',
        ]);

        $this->assertSame('class', $service['service_type']);
        $this->assertSame('link_and_pix', $service['payment_method']);
        $this->assertSame('https://pay.example.test/checkout', $service['payment_url']);
        $this->assertSame('pix@example.test', $service['pix_key']);

        $withoutPayment = BookingConfig::normalizeService([
            'name' => 'Corte',
            'payment_method' => 'none',
            'payment_url' => 'https://pay.example.test/checkout',
            'pix_key' => 'pix@example.test',
        ]);

        $this->assertNull($withoutPayment['payment_url']);
        $this->assertSame('', $withoutPayment['pix_key']);
    }

    public function test_in_person_service_clears_meeting_data_and_keeps_payment_confirmation_details(): void
    {
        $service = BookingConfig::normalizeService([
            'name' => 'Corte de cabelo',
            'service_type' => 'barbershop',
            'meeting_url' => 'https://meet.example.test/room',
            'payment_url' => 'https://pay.example.test/checkout',
            'payment_confirmation_url' => 'https://wa.me/5511999999999',
            'payment_confirmation_instructions' => 'Envie o comprovante com o seu nome.',
        ]);

        $this->assertNull($service['meeting_url']);
        $this->assertSame('link', $service['payment_method']);
        $this->assertSame('https://wa.me/5511999999999', $service['payment_confirmation_url']);
        $this->assertSame('Envie o comprovante com o seu nome.', $service['payment_confirmation_instructions']);
    }

    public function test_settings_normalize_invalid_timezone_to_utc(): void
    {
        $settings = BookingConfig::normalizeSettings([
            'timezone' => 'Not/A/Timezone',
            'default_capacity' => 0,
        ]);

        $this->assertSame('UTC', $settings['timezone']);
        $this->assertSame(1, $settings['default_capacity']);
    }

    public function test_booking_token_is_hashable_without_storing_plain_value(): void
    {
        [$plain, $hash] = BookingToken::create();

        $this->assertNotSame($plain, $hash);
        $this->assertSame($hash, BookingToken::hash($plain));
        $this->assertSame(64, strlen($hash));
    }
}
