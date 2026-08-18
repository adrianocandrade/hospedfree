<?php

namespace Tests\Feature\Hosting;

use App\Hosting\Data\HostingProviderPackageData;
use App\Hosting\Providers\MofhHostingPackageCatalogProvider;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Psr7\Response;
use Psr\Http\Message\RequestInterface;
use Tests\TestCase;

class MofhHostingPackageCatalogProviderTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set(
            'hospedfree.mofh.base_url',
            'https://panel.myownfreehost.net/xml-api/',
        );
        config()->set('hospedfree.mofh.username', 'api-user');
        config()->set('hospedfree.mofh.password', 'api-secret');
    }

    public function test_it_returns_only_normalized_package_fields(): void
    {
        $history = [];
        $provider = $this->provider(
            new Response(
                200,
                [],
                json_encode(
                    [
                        'packages' => [
                            [
                                'name' => 'free',
                                'QUOTA' => '5242880000',
                                'BWLIMIT' => '52428800000',
                                'provider_secret' => 'must-not-leave-adapter',
                            ],
                        ],
                    ],
                    JSON_THROW_ON_ERROR,
                ),
            ),
            $history,
        );

        $result = $provider->listPackages();

        $this->assertTrue($result->success);
        $this->assertCount(1, $result->data);
        $this->assertContainsOnlyInstancesOf(
            HostingProviderPackageData::class,
            $result->data,
        );
        $this->assertSame('free', $result->data[0]->name);
        $this->assertSame(5000, $result->data[0]->diskLimitMb);
        $this->assertSame(50000, $result->data[0]->bandwidthLimitMb);
        $this->assertStringNotContainsString(
            'must-not-leave-adapter',
            json_encode($result, JSON_THROW_ON_ERROR),
        );

        /** @var RequestInterface $request */
        $request = $history[0]['request'];
        $this->assertSame(
            'https://panel.myownfreehost.net/json-api/listpkgs',
            (string) $request->getUri(),
        );
        $this->assertSame(
            'Basic ' . base64_encode('api-user:api-secret'),
            $request->getHeaderLine('Authorization'),
        );
        $this->assertStringNotContainsString(
            'api_user',
            (string) $request->getUri(),
        );
        $this->assertStringNotContainsString(
            'api_key',
            (string) $request->getUri(),
        );
    }

    public function test_it_classifies_invalid_username_without_exposing_provider_message(): void
    {
        $providerMessage = 'The API username api-user appears to be invalid.';
        $provider = $this->provider(
            new Response(
                200,
                [],
                json_encode(
                    [
                        'cpanelresult' => ['error' => $providerMessage],
                    ],
                    JSON_THROW_ON_ERROR,
                ),
            ),
        );

        $result = $provider->listPackages();

        $this->assertFalse($result->success);
        $this->assertSame(
            'provider_package_lookup_invalid_username',
            $result->code,
        );
        $this->assertStringNotContainsString('api-user', $result->safeMessage);
        $this->assertStringNotContainsString(
            $providerMessage,
            $result->safeMessage,
        );
    }

    public function test_it_rejects_a_malformed_catalog_as_retryable(): void
    {
        $provider = $this->provider(new Response(200, [], '{not-json'));

        $result = $provider->listPackages();

        $this->assertFalse($result->success);
        $this->assertTrue($result->retryable);
        $this->assertSame(
            'provider_package_lookup_invalid_response',
            $result->code,
        );
    }

    public function test_it_accepts_the_singular_package_envelope_used_by_mofh(): void
    {
        $provider = $this->provider(
            new Response(
                200,
                [],
                json_encode(
                    [
                        'package' => [
                            [
                                'name' => 'pro',
                                'QUOTA' => 10485760000,
                                'BWLIMIT' => 104857600000,
                            ],
                        ],
                    ],
                    JSON_THROW_ON_ERROR,
                ),
            ),
        );

        $result = $provider->listPackages();

        $this->assertTrue($result->success);
        $this->assertCount(1, $result->data);
        $this->assertSame('pro', $result->data[0]->name);
        $this->assertSame(10000, $result->data[0]->diskLimitMb);
        $this->assertSame(100000, $result->data[0]->bandwidthLimitMb);
    }

    /**
     * @param array<int, array<string, mixed>> $history
     */
    private function provider(
        Response $response,
        array &$history = [],
    ): MofhHostingPackageCatalogProvider {
        $stack = HandlerStack::create(new MockHandler([$response]));
        $stack->push(Middleware::history($history));

        return new MofhHostingPackageCatalogProvider(
            new Client([
                'handler' => $stack,
            ]),
        );
    }
}
