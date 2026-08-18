<?php

namespace Tests\Feature\Hosting;

use App\Hosting\Data\CreateHostingAccountData;
use App\Hosting\Providers\MofhHostingProvider;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Psr7\Request as GuzzleRequest;
use GuzzleHttp\Psr7\Response;
use Tests\TestCase;

class MofhHostingProviderTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('hospedfree.mofh.base_url', 'https://panel.myownfreehost.net/xml-api/');
        config()->set('hospedfree.mofh.username', 'api-user');
        config()->set('hospedfree.mofh.password', 'api-secret');
        config()->set('hospedfree.mofh.ftp_host', 'ftpupload.net');
        config()->set('hospedfree.tools.control_panel_url', 'https://cpanel.example.test');
        config()->set('hospedfree.tools.webftp_url', 'https://webftp.example.test');
        config()->set('hospedfree.tools.installer_url', 'https://installer.example.test');
    }

    public function test_it_checks_domain_availability_using_mofh_client_response(): void
    {
        $available = $this->provider([new Response(200, [], '1')])
            ->checkDomainAvailability('site.hsite.top');
        $unavailable = $this->provider([new Response(200, [], '0')])
            ->checkDomainAvailability('site.hsite.top');

        $this->assertTrue($available->success);
        $this->assertSame('available', $available->status);
        $this->assertFalse($unavailable->success);
        $this->assertSame('domain_unavailable', $unavailable->code);
    }

    public function test_health_check_accepts_a_valid_unavailable_probe_response(): void
    {
        $result = $this->provider([new Response(200, [], '0')])->healthCheck();

        $this->assertTrue($result->success);
        $this->assertSame('ready', $result->status);
        $this->assertSame('ok', $result->code);
    }

    public function test_it_classifies_an_unapproved_server_ip_without_exposing_provider_payload(): void
    {
        $payload = 'Your calling IP address 203.0.113.20 does not match the allowed IP address';
        $provider = $this->provider([new Response(200, [], $payload)]);

        $availability = $provider->checkDomainAvailability('site.hsite.top');

        $this->assertFalse($availability->success);
        $this->assertFalse($availability->retryable);
        $this->assertSame('provider_ip_not_allowed', $availability->code);
        $this->assertStringNotContainsString('203.0.113.20', $availability->message);
    }

    public function test_health_check_reports_an_unapproved_server_ip_with_a_safe_code(): void
    {
        $payload = 'Your calling IP address 203.0.113.20 does not match the allowed IP address';
        $result = $this->provider([new Response(200, [], $payload)])->healthCheck();

        $this->assertFalse($result->success);
        $this->assertSame('provider_ip_not_allowed', $result->code);
        $this->assertStringNotContainsString('203.0.113.20', $result->message);
    }

    public function test_it_creates_account_with_mofh_key_and_vistapanel_username_separated(): void
    {
        $history = [];
        $provider = $this->provider([
            new Response(200, [], '<response><result><status>1</status><statusmsg>OK</statusmsg><options><vpusername>epiz_12345678</vpusername></options></result></response>'),
        ], $history);

        $result = $provider->createAccount(new CreateHostingAccountData(
            domain: 'site.hsite.top',
            email: 'cliente@example.test',
            password: 'generated-secret',
            remotePackage: 'FREE',
            idempotencyKey: 'create:fixed-order-id',
        ));

        parse_str((string) $history[0]['request']->getBody(), $form);

        $this->assertTrue($result->success);
        $this->assertSame('pending', $result->status);
        $this->assertSame('epiz_12345678', $result->username);
        $this->assertMatchesRegularExpression('/^hf[a-f0-9]{6}$/', $result->remoteAccountId);
        $this->assertSame(8, strlen((string) $form['username']));
        $this->assertSame($result->remoteAccountId, $form['username']);
        $this->assertSame('free', $form['plan']);
        $this->assertSame('ftpupload.net', $result->ftpHost);
    }

    public function test_it_redacts_secrets_from_provider_errors(): void
    {
        $provider = $this->provider([
            new Response(200, [], '<response><result><status>0</status><statusmsg>password=generated-secret api_key=api-secret rejected</statusmsg></result></response>'),
        ]);

        $result = $provider->createAccount(new CreateHostingAccountData(
            domain: 'site.hsite.top',
            email: 'cliente@example.test',
            password: 'generated-secret',
            remotePackage: 'free',
            idempotencyKey: 'create:secret-test',
        ));

        $this->assertFalse($result->success);
        $this->assertStringNotContainsString('generated-secret', $result->message);
        $this->assertStringNotContainsString('api-secret', $result->message);
        $this->assertStringContainsString('[redacted]', $result->message);
    }

    public function test_it_maps_reconcile_status_from_mofh_domains_response(): void
    {
        $active = $this->provider([new Response(200, [], '[["ACTIVE","site.hsite.top"]]')])
            ->getAccount('hf123456');
        $suspended = $this->provider([new Response(200, [], '[["SUSPENDED","site.hsite.top"]]')])
            ->getAccount('hf123456');

        $this->assertTrue($active->success);
        $this->assertSame('active', $active->status);
        $this->assertTrue($suspended->success);
        $this->assertSame('suspended', $suspended->status);
    }

    public function test_reconcile_uses_vistapanel_username_for_domain_lookup(): void
    {
        $history = [];
        $provider = $this->provider([
            new Response(200, [], '[["ACTIVE","site.hsite.top"]]'),
        ], $history);

        $result = $provider->getAccount('hf123456', 'epiz_12345678');
        parse_str($history[0]['request']->getUri()->getQuery(), $query);

        $this->assertTrue($result->success);
        $this->assertSame('epiz_12345678', $query['username']);
        $this->assertSame('hf123456', $result->remoteAccountId);
    }

    public function test_provider_transport_errors_are_retryable_without_raw_payloads(): void
    {
        $provider = $this->provider([
            new ConnectException('api-secret connection failed', new GuzzleRequest('GET', 'https://example.test')),
        ]);

        $result = $provider->checkDomainAvailability('site.hsite.top');

        $this->assertFalse($result->success);
        $this->assertTrue($result->retryable);
        $this->assertSame('provider_unreachable', $result->code);
        $this->assertStringNotContainsString('api-secret', $result->message);
    }

    /**
     * @param array<int, mixed> $responses
     * @param array<int, array<string, mixed>> $history
     */
    private function provider(array $responses, array &$history = []): MofhHostingProvider
    {
        $mock = new MockHandler($responses);
        $stack = HandlerStack::create($mock);
        $stack->push(Middleware::history($history));

        return new MofhHostingProvider(new Client(['handler' => $stack]));
    }
}
