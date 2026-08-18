<?php

namespace Tests\Feature\Hosting;

use App\Hosting\Data\HostingDatabaseData;
use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Providers\MofhHostingDatabaseProvider;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Psr7\Response;
use Tests\TestCase;

class MofhHostingDatabaseProviderTest extends TestCase
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

    public function test_it_lists_databases_without_exposing_panel_credentials(): void
    {
        $provider = $this->provider([
            $this->loginResponse(),
            $this->homeResponse(),
            new Response(200, [], $this->databaseTable('epiz_123_blog')),
        ]);

        $result = $provider->listDatabases(
            $this->credentials(),
            'sql.example.test',
        );

        $this->assertTrue($result->success);
        $this->assertCount(1, $result->data);
        $this->assertInstanceOf(HostingDatabaseData::class, $result->data[0]);
        $this->assertSame('epiz_123_blog', $result->data[0]->name);
        $this->assertSame('sql.example.test', $result->data[0]->host);
        $this->assertSame('epiz_123', $result->data[0]->username);
        $this->assertStringNotContainsString(
            'database-panel-password',
            json_encode($result),
        );
    }

    public function test_it_accepts_the_current_opaque_alphanumeric_panel_token(): void
    {
        $history = [];
        $provider = $this->provider(
            [
                $this->loginResponse(),
                new Response(
                    200,
                    [],
                    '{"url":"\\/panel\\/indexpl.php?option=domains\\u0026ttt\\u003Dopaque_Token-2026"},',
                ),
                new Response(200, [], $this->databaseTable()),
            ],
            $history,
        );

        $result = $provider->listDatabases(
            $this->credentials(),
            'sql.example.test',
        );

        $this->assertTrue($result->success);
        $this->assertCount(3, $history);
        $this->assertStringContainsString(
            'ttt=opaque_Token-2026',
            (string) $history[2]['request']->getUri(),
        );
        $this->assertStringNotContainsString(
            'database-panel-password',
            (string) $history[2]['request']->getUri(),
        );
    }

    public function test_it_lists_databases_from_the_current_removal_select(): void
    {
        $provider = $this->provider([
            $this->loginResponse(),
            $this->homeResponse(),
            new Response(200, [], $this->databaseRemovalForm('epiz_123_site')),
        ]);

        $result = $provider->listDatabases(
            $this->credentials(),
            'sql.example.test',
        );

        $this->assertTrue($result->success);
        $this->assertCount(1, $result->data);
        $this->assertSame('epiz_123_site', $result->data[0]->name);
    }

    public function test_it_creates_and_verifies_a_database_over_the_server_only_session(): void
    {
        $history = [];
        $provider = $this->provider(
            [
                $this->loginResponse(),
                $this->homeResponse(),
                new Response(200, [], $this->databaseTable()),
                new Response(200, [], '<div>Request accepted</div>'),
                new Response(
                    200,
                    [],
                    $this->databaseTable('epiz_123_wordpress'),
                ),
            ],
            $history,
        );

        $result = $provider->createDatabase(
            $this->credentials(),
            'sql.example.test',
            'wordpress',
        );

        $this->assertTrue($result->success);
        $this->assertSame('epiz_123_wordpress', $result->data->name);
        $this->assertCount(5, $history);
        $this->assertSame('POST', $history[3]['request']->getMethod());
        $this->assertStringContainsString(
            'option=mysql',
            (string) $history[3]['request']->getUri(),
        );
        $this->assertStringNotContainsString(
            'ttt=',
            (string) $history[3]['request']->getUri(),
        );
        $this->assertStringContainsString(
            'db=wordpress',
            (string) $history[3]['request']->getBody(),
        );
        parse_str((string) $history[3]['request']->getBody(), $form);
        $this->assertSame(['db' => 'wordpress'], $form);
        $this->assertSame(
            'https://panel.example.test',
            $history[3]['request']->getHeaderLine('Origin'),
        );
        $this->assertSame(
            'https://panel.example.test/panel/indexpl.php?option=mysql',
            $history[3]['request']->getHeaderLine('Referer'),
        );
        $this->assertStringNotContainsString(
            'database-panel-password',
            (string) $history[3]['request']->getUri(),
        );
    }

    public function test_it_follows_only_the_safe_panel_redirect_after_creation(): void
    {
        $history = [];
        $provider = $this->provider(
            [
                $this->loginResponse(),
                $this->homeResponse(),
                new Response(200, [], $this->databaseTable()),
                new Response(302, [
                    'Location' => '/panel/indexpl.php?option=mysql&ttt=12345',
                ]),
                new Response(
                    200,
                    [],
                    $this->databaseTable('epiz_123_wordpress'),
                ),
            ],
            $history,
        );

        $result = $provider->createDatabase(
            $this->credentials(),
            'sql.example.test',
            'wordpress',
        );

        $this->assertTrue($result->success);
        $this->assertSame('epiz_123_wordpress', $result->data->name);
        $this->assertCount(5, $history);
        $this->assertSame('GET', $history[4]['request']->getMethod());
        $this->assertSame(
            'panel.example.test',
            $history[4]['request']->getUri()->getHost(),
        );
    }

    public function test_it_rejects_an_external_redirect_after_creation(): void
    {
        $provider = $this->provider([
            $this->loginResponse(),
            $this->homeResponse(),
            new Response(200, [], $this->databaseTable()),
            new Response(302, [
                'Location' => 'https://attacker.example/collect',
            ]),
        ]);

        $result = $provider->createDatabase(
            $this->credentials(),
            'sql.example.test',
            'wordpress',
        );

        $this->assertFalse($result->success);
        $this->assertSame('panel_redirect_invalid', $result->code);
        $this->assertStringNotContainsString(
            'database-panel-password',
            json_encode($result),
        );
    }

    /**
     * @param list<Response> $responses
     * @param array<int, array<string, mixed>> $history
     */
    private function provider(
        array $responses,
        array &$history = [],
    ): MofhHostingDatabaseProvider {
        $stack = HandlerStack::create(new MockHandler($responses));
        $stack->push(Middleware::history($history));

        return new MofhHostingDatabaseProvider(
            new Client(['handler' => $stack]),
        );
    }

    private function loginResponse(): Response
    {
        return new Response(
            200,
            [
                'Set-Cookie' =>
                    'PHPSESSID=database-session-secret; Path=/; Secure; HttpOnly',
            ],
            "document.location.href = 'panel/indexpl.php';",
        );
    }

    private function homeResponse(): Response
    {
        return new Response(
            200,
            [],
            '<a href="/panel/indexpl.php?option=mysql&amp;ttt=12345">MySQL</a>',
        );
    }

    private function databaseTable(?string $name = null): string
    {
        $row = $name ? "<tr><td>{$name}</td></tr>" : '';

        return "<table id=\"sql_db_tbl\"><tr><th>Database</th></tr>{$row}</table>";
    }

    private function databaseRemovalForm(string $name): string
    {
        return <<<HTML
        <form method="post" action="/panel/indexpl.php?option=mysql&amp;cmd=remove">
            <select name="toremove">
                <option value="{$name}">{$name}</option>
            </select>
            <input type="submit" name="Submit2" value="Remove Database">
        </form>
        HTML;
    }

    private function credentials(): PanelAccountCredentialsData
    {
        return new PanelAccountCredentialsData(
            username: 'epiz_123',
            password: 'database-panel-password',
        );
    }
}
