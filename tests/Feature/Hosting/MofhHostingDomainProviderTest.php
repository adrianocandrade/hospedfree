<?php

namespace Tests\Feature\Hosting;

use App\Hosting\Data\HostingDomainData;
use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Providers\MofhHostingDomainProvider;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Request as GuzzleRequest;
use GuzzleHttp\Psr7\Response;
use Tests\TestCase;

class MofhHostingDomainProviderTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('hospedfree.mofh.base_url', 'https://panel.myownfreehost.net/xml-api/');
        config()->set('hospedfree.mofh.username', 'api-user');
        config()->set('hospedfree.mofh.password', 'api-secret');
        config()->set('hospedfree.vistapanel.enabled', true);
        config()->set(
            'hospedfree.vistapanel.cpanel_url',
            'https://panel.example.test',
        );
    }

    public function test_it_normalizes_domain_list_without_returning_raw_provider_data(): void
    {
        $result = $this->provider([
            new Response(200, [], '[["ACTIVE","site.hsite.top"],["ACTIVE","example.com"]]'),
        ])->listDomains('epiz_12345678', 'site.hsite.top');

        $this->assertTrue($result->success);
        $this->assertCount(2, $result->data);
        $this->assertContainsOnlyInstancesOf(HostingDomainData::class, $result->data);
        $this->assertTrue($result->data[0]->isPrimary);
        $this->assertSame('custom', $result->data[1]->type);
        $this->assertStringNotContainsString('api-secret', json_encode($result));
    }

    public function test_it_verifies_that_domain_belongs_to_expected_panel_account(): void
    {
        $owned = $this->provider([
            new Response(200, [], '["ACTIVE","example.com","/home/example.com/htdocs","epiz_12345678"]'),
        ])->checkDomain('epiz_12345678', 'example.com');
        $foreign = $this->provider([
            new Response(200, [], '["ACTIVE","example.com","/home/example.com/htdocs","epiz_99999999"]'),
        ])->checkDomain('epiz_12345678', 'example.com');

        $this->assertSame('active', $owned->data->status);
        $this->assertSame('pending_verification', $foreign->data->status);
    }

    public function test_it_returns_a_safe_cname_instruction_for_custom_domain_verification(): void
    {
        config()->set('hospedfree.domains.cname_target', 'ns1.byet.org');
        $hash = '73081144a0525fde6ba1b0510684efcf';

        $result = $this->provider([
            new Response(200, [], $hash),
        ])->domainVerificationInstructions('epiz_12345678', 'example.com');

        $this->assertTrue($result->success);
        $this->assertSame('CNAME', $result->data[0]->type);
        $this->assertSame("{$hash}.example.com", $result->data[0]->name);
        $this->assertSame('ns1.byet.org', $result->data[0]->value);
        $this->assertStringNotContainsString('api-secret', json_encode($result));
    }

    public function test_transport_failure_is_retryable_and_unverified_custom_domain_mutation_is_rejected(): void
    {
        $failed = $this->provider([
            new ConnectException('api-secret leaked', new GuzzleRequest('GET', 'https://example.test')),
        ])->listDomains('epiz_12345678', 'site.hsite.top');
        $change = $this->provider([])->addCustomDomain(
            $this->credentials(),
            'example.com',
        );

        $this->assertFalse($failed->success);
        $this->assertTrue($failed->retryable);
        $this->assertSame('provider_unreachable', $failed->code);
        $this->assertStringNotContainsString('api-secret', $failed->safeMessage);
        $this->assertSame('custom_domain_mutation_not_verified', $change->code);
    }

    public function test_it_creates_and_deletes_subdomains_through_a_server_only_panel_session(): void
    {
        $login = new Response(
            200,
            [
                'Set-Cookie' =>
                    'PHPSESSID=server-session-secret; Path=/; Secure; HttpOnly',
            ],
            "document.location.href = 'panel/indexpl.php';",
        );
        $home = new Response(
            200,
            [],
            '<a href="/panel/indexpl.php?option=domains&amp;ttt=12345">Domains</a>',
        );
        $created = $this->provider([
            $login,
            $home,
            new Response(200, [], '<div>Subdomain created successfully</div>'),
        ])->addSubdomain($this->credentials(), 'blog', 'hsite.top');
        $deleted = $this->provider([
            $login,
            $home,
            new Response(200, [], '<div>Subdomain deleted successfully</div>'),
        ])->deleteDomain(
            $this->credentials(),
            'blog.hsite.top',
            'subdomain',
        );

        $this->assertTrue($created->success);
        $this->assertSame('blog.hsite.top', $created->data->domain);
        $this->assertSame('subdomain', $created->data->type);
        $this->assertTrue($deleted->success);
        $this->assertStringNotContainsString(
            'panel-password-secret',
            json_encode([$created, $deleted]),
        );
    }

    private function provider(array $responses): MofhHostingDomainProvider
    {
        $mock = new MockHandler($responses);

        return new MofhHostingDomainProvider(new Client([
            'handler' => HandlerStack::create($mock),
        ]));
    }

    private function credentials(): PanelAccountCredentialsData
    {
        return new PanelAccountCredentialsData(
            username: 'epiz_12345678',
            password: 'panel-password-secret',
        );
    }
}
