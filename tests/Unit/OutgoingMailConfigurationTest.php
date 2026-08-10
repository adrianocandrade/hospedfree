<?php

namespace Tests\Unit;

use Common\Settings\Mail\OutgoingMailConfiguration;
use Illuminate\Mail\Transport\ResendTransport;
use Illuminate\Support\Facades\Mail;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class OutgoingMailConfigurationTest extends TestCase
{
    public function test_admin_resend_api_key_takes_priority_over_laravel_key(): void
    {
        $this->assertSame(
            're_admin_key',
            OutgoingMailConfiguration::resolveResendApiKey(
                're_admin_key',
                're_laravel_key',
            ),
        );
    }

    public function test_laravel_resend_key_is_used_when_admin_key_is_empty(): void
    {
        $this->assertSame(
            're_laravel_key',
            OutgoingMailConfiguration::resolveResendApiKey(
                '  ',
                're_laravel_key',
            ),
        );
    }

    public function test_it_uses_primary_mailer_directly_without_fallback(): void
    {
        $selection = OutgoingMailConfiguration::resolve('resend', null);

        $this->assertSame('resend', $selection['primary']);
        $this->assertNull($selection['fallback']);
        $this->assertSame('resend', $selection['default']);
        $this->assertSame(['resend'], $selection['failover_mailers']);
    }

    public function test_it_enables_failover_in_primary_then_fallback_order(): void
    {
        $selection = OutgoingMailConfiguration::resolve('resend', 'smtp');

        $this->assertSame('resend', $selection['primary']);
        $this->assertSame('smtp', $selection['fallback']);
        $this->assertSame('failover', $selection['default']);
        $this->assertSame(['resend', 'smtp'], $selection['failover_mailers']);
    }

    #[DataProvider('emptyOrDuplicateFallbackProvider')]
    public function test_it_ignores_empty_or_duplicate_fallback(
        ?string $fallback,
    ): void {
        $selection = OutgoingMailConfiguration::resolve('resend', $fallback);

        $this->assertNull($selection['fallback']);
        $this->assertSame('resend', $selection['default']);
        $this->assertSame(['resend'], $selection['failover_mailers']);
    }

    public static function emptyOrDuplicateFallbackProvider(): array
    {
        return [[null], [''], ['   '], ['resend']];
    }

    public function test_it_preserves_legacy_failover_configuration(): void
    {
        $selection = OutgoingMailConfiguration::resolve('failover', null);

        $this->assertSame('smtp', $selection['primary']);
        $this->assertSame('log', $selection['fallback']);
        $this->assertSame('failover', $selection['default']);
        $this->assertSame(['smtp', 'log'], $selection['failover_mailers']);
    }

    public function test_laravel_can_resolve_the_resend_transport(): void
    {
        config()->set([
            'services.resend.key' => 're_test_key',
            'mail.mailers.resend' => ['transport' => 'resend'],
        ]);

        Mail::purge('resend');

        $this->assertInstanceOf(
            ResendTransport::class,
            Mail::mailer('resend')->getSymfonyTransport(),
        );
    }
}
