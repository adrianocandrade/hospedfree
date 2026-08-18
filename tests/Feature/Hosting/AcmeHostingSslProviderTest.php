<?php

namespace Tests\Feature\Hosting;

use Afosto\Acme\Client;
use Afosto\Acme\Data\Authorization;
use Afosto\Acme\Data\Certificate;
use Afosto\Acme\Data\Challenge;
use Afosto\Acme\Data\Order;
use App\Hosting\Data\HostingSslOrderData;
use App\Hosting\Providers\AcmeHostingSslProvider;
use App\Hosting\Services\AcmeClientFactory;
use App\Hosting\Services\CloudflareDnsService;
use DateTime;
use Tests\TestCase;

class AcmeHostingSslProviderTest extends TestCase
{
    public function test_request_returns_normalized_dns_challenge(): void
    {
        config()->set('hospedfree.acme.enabled', true);
        $order = $this->order('pending');
        $authorization = $this->authorization();
        $client = $this->clientMock(['createOrder', 'authorize']);
        $client->expects($this->once())->method('createOrder')->with(['site.example.com'])->willReturn($order);
        $client->expects($this->once())->method('authorize')->with($order)->willReturn([$authorization]);

        $provider = $this->provider($client);
        $result = $provider->requestCertificate('account-1', 'site.example.com');

        $this->assertTrue($result->success);
        $this->assertInstanceOf(HostingSslOrderData::class, $result->data);
        $this->assertSame('order-123', $result->data->remoteOrderId);
        $this->assertSame('TXT', $result->data->dnsInstructions[0]->type);
        $this->assertSame('_acme-challenge.site.example.com', $result->data->dnsInstructions[0]->name);
        $this->assertNotSame('', $result->data->dnsInstructions[0]->value);
    }

    public function test_validation_issues_certificate_only_after_dns_match(): void
    {
        config()->set('hospedfree.acme.enabled', true);
        $pending = $this->order('pending');
        $ready = $this->order('ready');
        $authorization = $this->authorization();
        $challenge = $authorization->getDnsChallenge();
        $certificate = $this->getMockBuilder(Certificate::class)
            ->disableOriginalConstructor()
            ->onlyMethods([
                'getExpiryDate',
                'getPrivateKey',
                'getCsr',
                'getCertificate',
                'getIntermediate',
            ])
            ->getMock();
        $certificate->method('getExpiryDate')->willReturn(new DateTime('+90 days'));
        $certificate->method('getPrivateKey')->willReturn('private-material');
        $certificate->method('getCsr')->willReturn('csr-material');
        $certificate->method('getCertificate')->willReturn('certificate-material');
        $certificate->method('getIntermediate')->willReturn('ca-material');

        $client = $this->clientMock([
            'getOrder',
            'authorize',
            'selfTest',
            'validate',
            'getCertificate',
        ]);
        $client->expects($this->exactly(2))->method('getOrder')->with('order-123')->willReturnOnConsecutiveCalls($pending, $ready);
        $client->expects($this->once())->method('authorize')->with($pending)->willReturn([$authorization]);
        $client->expects($this->once())->method('selfTest')->with($authorization, Client::VALIDATION_DNS, 1)->willReturn(true);
        $client->expects($this->once())->method('validate')->with($challenge, 3)->willReturn(true);
        $client->expects($this->once())->method('getCertificate')->with($ready)->willReturn($certificate);

        $result = $this->provider($client)->validateCertificate(
            'account-1',
            'order-123',
        );

        $this->assertTrue($result->success);
        $this->assertSame('issued', $result->data->status);
        $this->assertSame('private-material', $result->data->privateKey);
        $this->assertSame('certificate-material', $result->data->certificate);
    }

    private function provider(Client $client): AcmeHostingSslProvider
    {
        $factory = $this->getMockBuilder(AcmeClientFactory::class)
            ->onlyMethods(['make'])
            ->getMock();
        $factory->method('make')->willReturn($client);
        $cloudflare = $this->getMockBuilder(CloudflareDnsService::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['isConfigured'])
            ->getMock();
        $cloudflare->method('isConfigured')->willReturn(false);

        return new AcmeHostingSslProvider($factory, $cloudflare);
    }

    /** @param list<string> $methods */
    private function clientMock(array $methods): Client
    {
        return $this->getMockBuilder(Client::class)
            ->disableOriginalConstructor()
            ->onlyMethods($methods)
            ->getMock();
    }

    private function order(string $status): Order
    {
        return new Order(
            ['site.example.com'],
            'https://acme.example.test/acme/order/account/order-123',
            $status,
            now()->addHour()->toIso8601String(),
            [['type' => 'dns', 'value' => 'site.example.com']],
            ['https://acme.example.test/auth/123'],
            'https://acme.example.test/finalize/123',
            null,
        );
    }

    private function authorization(): Authorization
    {
        $authorization = new Authorization(
            'site.example.com',
            now()->addHour()->toIso8601String(),
            'account-digest',
        );
        $authorization->addChallenge(new Challenge(
            'https://acme.example.test/auth/123',
            Client::VALIDATION_DNS,
            'pending',
            'https://acme.example.test/challenge/123',
            'challenge-token',
        ));

        return $authorization;
    }
}
