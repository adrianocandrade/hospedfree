<?php

namespace Tests\Feature\Hosting;

use App\Hosting\Data\HostingStatsData;
use App\Hosting\Data\PanelSessionData;
use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Providers\MofhHostingPanelProvider;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use Tests\TestCase;

class MofhHostingPanelProviderTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('hospedfree.vistapanel.enabled', true);
        config()->set(
            'hospedfree.vistapanel.cpanel_url',
            'https://panel.example.test',
        );
    }

    public function test_it_collects_normalized_stats_over_a_server_side_session(): void
    {
        $history = [];
        $provider = $this->provider(
            [
                new Response(
                    200,
                    [
                        'Set-Cookie' =>
                            'PHPSESSID=server-session-secret; Path=/; Secure; HttpOnly',
                    ],
                    "document.location.href = 'panel/indexpl.php';",
                ),
                new Response(
                    200,
                    [],
                    <<<'HTML'
                    <a href="/panel/indexpl.php?option=domains&amp;ttt=12345">Domains</a>
                    <table>
                      <tr><td class="stats_left">Sub-Domains:</td><td>1 / 2</td></tr>
                      <tr><td class="stats_left">Add-on Domains:</td><td>1 / 2</td></tr>
                      <tr><td class="stats_left">MySQL Databases:</td><td>2 / 250</td></tr>
                      <tr><td class="stats_left">Disk Space Used:</td><td>1.5 GB</td><td>30</td></tr>
                      <tr><td class="stats_left">Disk Quota:</td><td>5 GB</td></tr>
                      <tr><td class="stats_left">Bandwidth used:</td><td>768 MB</td></tr>
                      <tr><td class="stats_left">Bandwidth:</td><td>50 GB</td></tr>
                      <tr><td class="stats_left">Inodes Used:</td><td>2 % (1,250 of 50,000)</td></tr>
                    </table>
                    HTML
                    ,
                ),
            ],
            $history,
        );

        $result = $provider->stats($this->credentials());

        $this->assertTrue($result->success);
        $this->assertInstanceOf(HostingStatsData::class, $result->data);
        $this->assertSame(1_610_612_736, $result->data->diskUsedBytes);
        $this->assertSame(5_368_709_120, $result->data->diskLimitBytes);
        $this->assertSame(805_306_368, $result->data->bandwidthUsedBytes);
        $this->assertSame(53_687_091_200, $result->data->bandwidthLimitBytes);
        $this->assertSame(1250, $result->data->inodesUsed);
        $this->assertSame(50000, $result->data->inodesLimit);
        $this->assertSame(2, $result->data->domainCount);
        $this->assertSame(2, $result->data->databaseCount);
        $this->assertCount(2, $history);
        $this->assertTrue($history[0]['options']['verify']);
        $this->assertStringContainsString(
            'Mozilla/5.0',
            $history[0]['request']->getHeaderLine('User-Agent'),
        );
        $this->assertStringNotContainsString(
            'panel-password-secret',
            json_encode($result),
        );
        $this->assertStringNotContainsString(
            'server-session-secret',
            json_encode($result),
        );
    }

    public function test_it_rejects_invalid_panel_credentials_without_exposing_them(): void
    {
        $provider = $this->provider([
            new Response(200, [], '<html>Invalid login</html>'),
        ]);

        $result = $provider->stats($this->credentials());

        $this->assertFalse($result->success);
        $this->assertSame('panel_invalid_credentials', $result->code);
        $this->assertFalse($result->retryable);
        $this->assertStringNotContainsString(
            'panel-password-secret',
            $result->safeMessage,
        );
    }

    public function test_transport_failures_are_retryable_and_sso_is_not_faked(): void
    {
        $request = new Request('POST', 'https://panel.example.test/login.php');
        $provider = $this->provider([
            new ConnectException('password=panel-password-secret', $request),
        ]);

        $result = $provider->stats($this->credentials());
        $panel = $provider->createPanelSession($this->credentials());

        $this->assertFalse($result->success);
        $this->assertTrue($result->retryable);
        $this->assertSame('panel_unreachable', $result->code);
        $this->assertStringNotContainsString(
            'panel-password-secret',
            $result->safeMessage,
        );
        $this->assertSame('panel_sso_not_supported', $panel->code);
    }

    public function test_it_creates_an_installer_session_from_the_vistapanel_redirect(): void
    {
        config()->set(
            'hospedfree.tools.installer_url',
            'https://installer.example.test',
        );
        $history = [];
        $provider = $this->provider(
            [
                new Response(
                    200,
                    [
                        'Set-Cookie' =>
                            'PHPSESSID=server-session-secret; Path=/; Secure; HttpOnly',
                    ],
                    "document.location.href = 'panel/indexpl.php';",
                ),
                new Response(
                    200,
                    [],
                    '<a href="/panel/indexpl.php?option=domains&amp;ttt=12345">Domains</a>',
                ),
                new Response(302, [
                    'Location' =>
                        'https://installer.example.test/session/opaque-id',
                ]),
            ],
            $history,
        );

        $result = $provider->createInstallerSession($this->credentials());

        $this->assertTrue($result->success);
        $this->assertInstanceOf(PanelSessionData::class, $result->data);
        $this->assertSame('installer', $result->data->tool);
        $this->assertSame(
            'https://installer.example.test/session/opaque-id',
            $result->data->url,
        );
        $this->assertCount(3, $history);
        $this->assertStringContainsString(
            'option=installer',
            (string) $history[2]['request']->getUri(),
        );
        $this->assertStringNotContainsString(
            'panel-password-secret',
            json_encode($result),
        );
        $this->assertStringNotContainsString(
            'server-session-secret',
            json_encode($result),
        );
    }

    public function test_it_reads_the_installer_token_from_the_json_shape_used_by_vistapanel(): void
    {
        config()->set(
            'hospedfree.tools.installer_url',
            'https://installer.example.test',
        );
        $history = [];
        $provider = $this->provider(
            [
                new Response(
                    200,
                    [
                        'Set-Cookie' =>
                            'PHPSESSID=server-session-secret; Path=/; Secure; HttpOnly',
                    ],
                    "document.location.href = 'panel/indexpl.php';",
                ),
                new Response(
                    200,
                    [],
                    '{"url":"\\/panel\\/indexpl.php?option=domains\\u0026ttt\\u003D98765"},',
                ),
                new Response(302, [
                    'Location' =>
                        'https://installer.example.test/session/opaque-id',
                ]),
            ],
            $history,
        );

        $result = $provider->createInstallerSession($this->credentials());

        $this->assertTrue($result->success);
        $this->assertCount(3, $history);
        $this->assertStringContainsString(
            'ttt=98765',
            (string) $history[2]['request']->getUri(),
        );
    }

    public function test_it_uses_the_authenticated_installer_route_when_the_theme_omits_the_token(): void
    {
        config()->set(
            'hospedfree.tools.installer_url',
            'https://installer.example.test',
        );
        $history = [];
        $provider = $this->provider(
            [
                new Response(
                    200,
                    [
                        'Set-Cookie' =>
                            'PHPSESSID=server-session-secret; Path=/; Secure; HttpOnly',
                    ],
                    "document.location.href = 'panel/indexpl.php';",
                ),
                new Response(200, [], '<html><main>Control panel</main></html>'),
                new Response(302, [
                    'Location' =>
                        'https://installer.example.test/session/opaque-id',
                ]),
            ],
            $history,
        );

        $result = $provider->createInstallerSession($this->credentials());

        $this->assertTrue($result->success);
        $this->assertCount(3, $history);
        $installerUrl = (string) $history[2]['request']->getUri();
        $this->assertStringContainsString('option=installer', $installerUrl);
        $this->assertStringNotContainsString('ttt=', $installerUrl);
    }

    public function test_it_rejects_an_installer_redirect_to_an_unauthorized_host(): void
    {
        config()->set(
            'hospedfree.tools.installer_url',
            'https://installer.example.test',
        );
        $provider = $this->provider([
            new Response(
                200,
                [
                    'Set-Cookie' =>
                        'PHPSESSID=server-session-secret; Path=/; Secure; HttpOnly',
                ],
                "document.location.href = 'panel/indexpl.php';",
            ),
            new Response(
                200,
                [],
                '<a href="/panel/indexpl.php?option=domains&amp;ttt=12345">Domains</a>',
            ),
            new Response(302, [
                'Location' => 'https://attacker.example/session/opaque-id',
            ]),
        ]);

        $result = $provider->createInstallerSession($this->credentials());

        $this->assertFalse($result->success);
        $this->assertSame(
            'installer_redirect_host_not_allowed',
            $result->code,
        );
        $this->assertStringNotContainsString(
            'attacker.example',
            $result->safeMessage,
        );
    }

    public function test_it_allows_an_authorized_https_installer_on_a_custom_port(): void
    {
        config()->set(
            'hospedfree.tools.installer_url',
            'https://installer.example.test:8443',
        );
        $provider = $this->provider([
            new Response(
                200,
                [
                    'Set-Cookie' =>
                        'PHPSESSID=server-session-secret; Path=/; Secure; HttpOnly',
                ],
                "document.location.href = 'panel/indexpl.php';",
            ),
            new Response(
                200,
                [],
                '<a href="/panel/indexpl.php?option=domains&amp;ttt=12345">Domains</a>',
            ),
            new Response(302, [
                'Location' =>
                    'https://installer.example.test:8443/session/opaque-id',
            ]),
        ]);

        $result = $provider->createInstallerSession($this->credentials());

        $this->assertTrue($result->success);
    }

    public function test_it_blocks_an_installer_redirect_that_contains_the_account_password(): void
    {
        config()->set(
            'hospedfree.tools.installer_url',
            'https://installer.example.test',
        );
        $provider = $this->provider([
            new Response(
                200,
                [
                    'Set-Cookie' =>
                        'PHPSESSID=server-session-secret; Path=/; Secure; HttpOnly',
                ],
                "document.location.href = 'panel/indexpl.php';",
            ),
            new Response(
                200,
                [],
                '<a href="/panel/indexpl.php?option=domains&amp;ttt=12345">Domains</a>',
            ),
            new Response(302, [
                'Location' =>
                    'https://installer.example.test/session?password=panel-password-secret',
            ]),
            new Response(302, [
                'Location' =>
                    'https://installer.example.test/session/step-two?password=panel-password-secret',
            ]),
            new Response(302, [
                'Location' =>
                    'https://installer.example.test/session/step-three?password=panel-password-secret',
            ]),
            new Response(302, [
                'Location' =>
                    'https://installer.example.test/session/step-four?password=panel-password-secret',
            ]),
        ]);

        $result = $provider->createInstallerSession($this->credentials());

        $this->assertFalse($result->success);
        $this->assertSame(
            'installer_redirect_contains_password',
            $result->code,
        );
        $this->assertStringNotContainsString(
            'panel-password-secret',
            $result->safeMessage,
        );
    }

    public function test_it_consumes_a_credentialed_installer_handoff_server_side_and_only_returns_the_final_session(): void
    {
        config()->set(
            'hospedfree.tools.installer_url',
            'https://installer.example.test',
        );
        $history = [];
        $provider = $this->provider(
            [
                new Response(
                    200,
                    [
                        'Set-Cookie' =>
                            'PHPSESSID=server-session-secret; Path=/; Secure; HttpOnly',
                    ],
                    "document.location.href = 'panel/indexpl.php';",
                ),
                new Response(
                    200,
                    [],
                    '<a href="/panel/indexpl.php?option=domains&amp;ttt=12345">Domains</a>',
                ),
                new Response(302, [
                    'Location' =>
                        'https://installer.example.test/login?user=hf-panel-user&password=panel-password-secret',
                ]),
                new Response(302, [
                    'Location' =>
                        'https://installer.example.test/cpsess123/frontend/jupiter/softaculous/index.live.php',
                ]),
            ],
            $history,
        );

        $result = $provider->createInstallerSession($this->credentials());

        $this->assertTrue($result->success);
        $this->assertSame(
            'https://installer.example.test/cpsess123/frontend/jupiter/softaculous/index.live.php',
            $result->data->url,
        );
        $this->assertCount(4, $history);
        $this->assertStringNotContainsString(
            'panel-password-secret',
            json_encode($result, JSON_THROW_ON_ERROR),
        );
    }

    /**
     * @param array<int, Response|\Throwable> $responses
     * @param array<int, array<string, mixed>> $history
     */
    private function provider(
        array $responses,
        array &$history = [],
    ): MofhHostingPanelProvider {
        $stack = HandlerStack::create(new MockHandler($responses));
        $stack->push(Middleware::history($history));

        return new MofhHostingPanelProvider(new Client(['handler' => $stack]));
    }

    private function credentials(): PanelAccountCredentialsData
    {
        return new PanelAccountCredentialsData(
            username: 'hf-panel-user',
            password: 'panel-password-secret',
        );
    }
}
