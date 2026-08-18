<?php

namespace Tests\Feature\Hosting;

use Afosto\Acme\Data\Order;
use App\Hosting\Services\HardenedAcmeClient;
use GuzzleHttp\Psr7\Response;
use League\Flysystem\Filesystem;
use League\Flysystem\Local\LocalFilesystemAdapter;
use Psr\Http\Message\ResponseInterface;
use Tests\TestCase;

class HardenedAcmeClientTest extends TestCase
{
    public function test_authorize_ignores_acme_challenges_without_a_token(): void
    {
        $client = new TestableHardenedAcmeClient([
            'username' => 'ssl-test@example.com',
            'fs' => new Filesystem(
                new LocalFilesystemAdapter(
                    storage_path('framework/testing/acme'),
                ),
            ),
        ]);
        $client->response = new Response(
            200,
            [],
            json_encode(
                [
                    'identifier' => [
                        'type' => 'dns',
                        'value' => 'site.example.com',
                    ],
                    'status' => 'pending',
                    'expires' => now()->addHour()->toIso8601String(),
                    'challenges' => [
                        [
                            'type' => 'dns-01',
                            'url' => 'https://acme.example.test/challenge/dns',
                            'status' => 'pending',
                            'token' => 'dns-token',
                        ],
                        [
                            'type' => 'dns-persist-01',
                            'url' =>
                                'https://acme.example.test/challenge/persist',
                            'status' => 'pending',
                            'issuer-domain-names' => ['example.test'],
                        ],
                    ],
                ],
                JSON_THROW_ON_ERROR,
            ),
        );

        $authorizations = $client->authorize($this->order());

        $this->assertCount(1, $authorizations);
        $this->assertCount(1, $authorizations[0]->getChallenges());
        $this->assertSame(
            'dns-token',
            $authorizations[0]->getDnsChallenge()->getToken(),
        );
    }

    public function test_generates_a_private_key_with_an_explicit_openssl_config(): void
    {
        $opensslConfig = dirname(PHP_BINARY) . '/extras/ssl/openssl.cnf';
        if (!is_file($opensslConfig)) {
            $this->markTestSkipped(
                'The local PHP installation has no bundled OpenSSL config.',
            );
        }

        config()->set('hospedfree.acme.openssl_config', $opensslConfig);
        $client = new TestableHardenedAcmeClient([
            'username' => 'ssl-test@example.com',
            'fs' => new Filesystem(
                new LocalFilesystemAdapter(
                    storage_path('framework/testing/acme'),
                ),
            ),
            'key_length' => 2048,
        ]);

        $key = $client->generateKeyForTest();

        $this->assertStringContainsString('BEGIN PRIVATE KEY', $key);
        $this->assertNotFalse(openssl_pkey_get_private($key));
    }

    private function order(): Order
    {
        return new Order(
            ['site.example.com'],
            'https://acme.example.test/order/123',
            'pending',
            now()->addHour()->toIso8601String(),
            [['type' => 'dns', 'value' => 'site.example.com']],
            ['https://acme.example.test/authorization/123'],
            'https://acme.example.test/finalize/123',
            null,
        );
    }
}

class TestableHardenedAcmeClient extends HardenedAcmeClient
{
    public ResponseInterface $response;

    protected function init(): void {}

    protected function request(
        $url,
        $payload = [],
        $method = 'POST',
    ): ResponseInterface {
        return $this->response;
    }

    protected function signPayloadKid($payload, $url): array
    {
        return [];
    }

    protected function getDigest(): string
    {
        return 'account-digest';
    }

    public function generateKeyForTest(): string
    {
        return $this->generatePrivateKey();
    }
}
