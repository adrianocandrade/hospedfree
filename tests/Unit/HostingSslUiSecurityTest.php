<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class HostingSslUiSecurityTest extends TestCase
{
    public function test_sensitive_ssl_actions_require_password_confirmation_in_the_dashboard(): void
    {
        $source = file_get_contents(
            dirname(__DIR__, 2) .
                '/resources/client/hosting/hosting-ssl-tab.tsx',
        );

        $this->assertStringContainsString(
            'usePasswordConfirmedAction',
            $source,
        );
        $this->assertMatchesRegularExpression(
            '/withConfirmedPassword\(\(\)\s*=>\s*requestCertificate\.mutate\(requestDomain\),?\s*\)/s',
            $source,
        );
        $this->assertMatchesRegularExpression(
            '/withConfirmedPassword\(\(\)\s*=>\s*revoke\.mutate\(certificate\.id\),?\s*\)/s',
            $source,
        );
    }
}
