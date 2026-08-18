<?php

namespace App\Hosting\Providers;

use App\Hosting\Contracts\HostingDatabaseProvider;
use App\Hosting\Data\HostingDatabaseData;
use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Data\ProviderResponse;
use App\Hosting\Providers\VistaPanel\VistaPanelClient;
use App\Hosting\Providers\VistaPanel\VistaPanelException;
use DOMDocument;
use DOMXPath;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\GuzzleException;
use Throwable;

final class MofhHostingDatabaseProvider implements HostingDatabaseProvider
{
    private ?VistaPanelClient $panelClient = null;

    public function __construct(private ?ClientInterface $httpClient = null) {}

    public function listDatabases(
        PanelAccountCredentialsData $account,
        string $host,
    ): ProviderResponse {
        return $this->execute(function () use ($account, $host): ProviderResponse {
            $session = $this->client()->authenticate($account);
            $databases = $this->parseDatabases(
                $this->client()->getOption($session, 'mysql'),
                $host,
                $account->username,
            );

            return ProviderResponse::ok($databases);
        });
    }

    public function createDatabase(
        PanelAccountCredentialsData $account,
        string $host,
        string $name,
    ): ProviderResponse {
        return $this->execute(function () use (
            $account,
            $host,
            $name,
        ): ProviderResponse {
            $session = $this->client()->authenticate($account);
            $existing = $this->parseDatabases(
                $this->client()->getOption($session, 'mysql'),
                $host,
                $account->username,
            );
            $database = $this->findDatabase($existing, $name);

            if ($database) {
                return ProviderResponse::ok($database);
            }

            $response = $this->client()->postOption(
                $session,
                'mysql',
                ['cmd' => 'create'],
                ['db' => $name],
                includeSessionToken: false,
            );
            $database = $this->findDatabase(
                $this->parseDatabases(
                    $response,
                    $host,
                    $account->username,
                ),
                $name,
            );

            if (!$database) {
                $database = $this->findDatabase(
                    $this->parseDatabases(
                        $this->client()->getOption($session, 'mysql'),
                        $host,
                        $account->username,
                    ),
                    $name,
                );
            }

            return $database
                ? ProviderResponse::ok($database)
                : ProviderResponse::failure(
                    'panel_database_change_rejected',
                    'The hosting panel did not confirm the database creation.',
                );
        });
    }

    /** @return list<HostingDatabaseData> */
    private function parseDatabases(
        string $html,
        string $host,
        string $username,
    ): array {
        $document = new DOMDocument();
        $previous = libxml_use_internal_errors(true);

        try {
            $document->loadHTML(
                $html,
                LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING,
            );
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }

        $xpath = new DOMXPath($document);
        $rows = $xpath->query("//table[@id='sql_db_tbl']//tr");
        $databases = [];

        foreach ($rows ?: [] as $row) {
            $name = trim((string) $xpath->evaluate('string(.//td[1])', $row));

            if ($this->isDatabaseName($name)) {
                $databases[strtolower($name)] = new HostingDatabaseData(
                    name: $name,
                    host: $host,
                    username: $username,
                );
            }
        }

        // Current VistaPanel themes keep the authoritative database names in
        // the removal selector instead of rendering rows in sql_db_tbl. Keep
        // support for both layouts because reseller themes are not uniform.
        $options = $xpath->query("//select[@name='toremove']/option");

        foreach ($options ?: [] as $option) {
            $name = trim((string) $option->getAttribute('value'));

            if ($name === '') {
                $name = trim((string) $option->textContent);
            }

            if ($this->isDatabaseName($name)) {
                $databases[strtolower($name)] = new HostingDatabaseData(
                    name: $name,
                    host: $host,
                    username: $username,
                );
            }
        }

        return array_values($databases);
    }

    private function isDatabaseName(string $name): bool
    {
        return $name !== '' &&
            preg_match('/^[a-zA-Z0-9_]{1,128}$/', $name) === 1;
    }

    /** @param list<HostingDatabaseData> $databases */
    private function findDatabase(array $databases, string $requested): ?HostingDatabaseData
    {
        $requested = strtolower($requested);

        foreach ($databases as $database) {
            $name = strtolower($database->name);

            if ($name === $requested || str_ends_with($name, "_{$requested}")) {
                return $database;
            }
        }

        return null;
    }

    private function execute(callable $callback): ProviderResponse
    {
        try {
            return $callback();
        } catch (VistaPanelException $exception) {
            return ProviderResponse::failure(
                $exception->getMessage(),
                $this->safeFailureMessage($exception->getMessage()),
                retryable: $exception->retryable,
            );
        } catch (GuzzleException) {
            return ProviderResponse::failure(
                'panel_unreachable',
                'The hosting panel did not respond in time.',
                retryable: true,
            );
        } catch (Throwable) {
            return ProviderResponse::failure(
                'panel_database_request_failed',
                'The database operation could not be completed.',
                retryable: true,
            );
        }
    }

    private function safeFailureMessage(string $code): string
    {
        return match ($code) {
            'panel_not_configured'
                => 'The hosting panel integration is not configured.',
            'panel_credentials_unavailable'
                => 'Hosting panel credentials are not available.',
            'panel_account_suspended'
                => 'The hosting panel account is suspended.',
            'panel_invalid_credentials'
                => 'The hosting panel credentials were rejected.',
            default => 'The hosting panel returned an invalid database response.',
        };
    }

    private function client(): VistaPanelClient
    {
        return $this->panelClient ??= new VistaPanelClient($this->httpClient);
    }
}
