<?php

namespace App\Hosting\Providers;

use App\Hosting\Contracts\HostingPanelProvider;
use App\Hosting\Contracts\HostingCertificateInstaller;
use App\Hosting\Data\HostingStatsData;
use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Data\PanelSessionData;
use App\Hosting\Data\ProviderResponse;
use App\Hosting\Providers\VistaPanel\VistaPanelClient;
use App\Hosting\Providers\VistaPanel\VistaPanelException;
use DOMDocument;
use DOMXPath;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\GuzzleException;
use Throwable;

class MofhHostingPanelProvider implements HostingPanelProvider, HostingCertificateInstaller
{
    private ?VistaPanelClient $panelClient = null;

    public function __construct(
        private ?ClientInterface $httpClient = null,
    ) {}

    public function key(): string
    {
        return 'mofh-panel';
    }

    public function createPanelSession(
        PanelAccountCredentialsData $account,
    ): ProviderResponse {
        return ProviderResponse::failure(
            'panel_sso_not_supported',
            'A secure hosting panel session is not available.',
        );
    }

    public function createInstallerSession(
        PanelAccountCredentialsData $account,
    ): ProviderResponse {
        try {
            $session = $this->client()->authenticate($account);
            $url = $this->client()->getOptionRedirect($session, 'installer');
            $url = $this->resolveInstallerRedirect($url, $account);

            return ProviderResponse::ok(
                new PanelSessionData(
                    tool: 'installer',
                    url: $url,
                    expiresAt: now()->addMinutes(5)->toIso8601String(),
                ),
                'Installer session created.',
            );
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
                'installer_request_failed',
                'The application installer could not be opened.',
                retryable: true,
            );
        }
    }

    public function stats(
        PanelAccountCredentialsData $account,
    ): ProviderResponse {
        try {
            $session = $this->client()->authenticate($account);
            $stats = $this->parseStats($session->dashboardHtml);

            if ($this->hasNoMetrics($stats)) {
                return ProviderResponse::failure(
                    'panel_stats_invalid_response',
                    'The hosting panel returned an invalid statistics response.',
                    retryable: true,
                );
            }

            return ProviderResponse::ok($stats);
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
                'panel_request_failed',
                'The hosting panel request could not be completed.',
                retryable: true,
            );
        }
    }

    public function installCertificate(
        PanelAccountCredentialsData $account,
        string $domain,
        string $privateKey,
        string $certificate,
        ?string $caCertificate = null,
    ): ProviderResponse {
        return ProviderResponse::failure(
            'panel_ssl_install_not_supported',
            'The hosting panel does not expose a verified certificate installation contract.',
        );
    }

    private function parseStats(string $html): HostingStatsData
    {
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
        $rows = $this->statRows($xpath);
        [$inodesUsed, $inodesLimit] = $this->inodeValues(
            $xpath,
            $rows['inodes used'] ?? null,
        );

        return new HostingStatsData(
            diskUsedBytes: $this->storageBytes(
                $xpath,
                'storage-used',
                $rows['disk space used'] ?? null,
            ),
            diskLimitBytes: $this->storageBytes(
                $xpath,
                'storage-total',
                $rows['disk quota'] ?? null,
            ),
            bandwidthUsedBytes: $this->storageBytes(
                $xpath,
                'bandwidth-used',
                $rows['bandwidth used'] ?? null,
            ),
            bandwidthLimitBytes: $this->storageBytes(
                $xpath,
                'bandwidth-total',
                $rows['bandwidth'] ?? null,
            ),
            inodesUsed: $inodesUsed,
            inodesLimit: $inodesLimit,
            domainCount: $this->usedCount($rows, [
                'sub-domains',
                'add-on domains',
                'parked domains',
            ]),
            databaseCount: $this->usedCount($rows, ['mysql databases']),
        );
    }

    /**
     * @return array<string, string>
     */
    private function statRows(DOMXPath $xpath): array
    {
        $rows = [];

        foreach ($xpath->query('//td') ?: [] as $cell) {
            if (!($cell instanceof \DOMElement)) {
                continue;
            }

            $classes = preg_split('/\s+/', trim($cell->getAttribute('class')));
            if (!in_array('stats_left', $classes ?: [], true)) {
                continue;
            }

            $label = strtolower(rtrim(trim($cell->textContent), ':'));
            $row = $cell->parentNode;
            if ($label !== '' && $row) {
                $valueCell = $cell->nextSibling;
                while ($valueCell && !($valueCell instanceof \DOMElement)) {
                    $valueCell = $valueCell->nextSibling;
                }
                $rows[$label] = trim(
                    preg_replace(
                        '/\s+/',
                        ' ',
                        $valueCell?->textContent ?? $row->textContent,
                    ) ?? '',
                );
            }
        }

        return $rows;
    }

    private function storageBytes(
        DOMXPath $xpath,
        string $class,
        ?string $rowText = null,
    ): ?int
    {
        $node = $xpath
            ->query(
                "//*[contains(concat(' ', normalize-space(@class), ' '), ' $class ')]",
            )
            ->item(0);

        $text = $node ? trim($node->textContent) : (string) $rowText;

        if (
            !preg_match(
                '/([0-9][0-9.,]*)\s*(B|KB|MB|GB|TB|KIB|MIB|GIB|TIB)\b/i',
                $text,
                $matches,
            )
        ) {
            return null;
        }

        $value = $this->decimalValue($matches[1]);
        $unit = strtoupper($matches[2]);
        $power = match ($unit) {
            'KB', 'KIB' => 1,
            'MB', 'MIB' => 2,
            'GB', 'GIB' => 3,
            'TB', 'TIB' => 4,
            default => 0,
        };

        return (int) round($value * 1024 ** $power);
    }

    /** @return array{?int, ?int} */
    private function inodeValues(DOMXPath $xpath, ?string $rowText): array
    {
        $node = $xpath
            ->query(
                "//*[contains(concat(' ', normalize-space(@class), ' '), ' inodes-info ')]",
            )
            ->item(0);
        $text = $node ? trim($node->textContent) : (string) $rowText;

        if (
            !preg_match(
                '/(?:\(|\b)([0-9,]+)\s*(?:\/|of)\s*([0-9,]+)(?:\)|\b)/i',
                $text,
                $matches,
            )
        ) {
            return [null, null];
        }

        return [
            (int) str_replace(',', '', $matches[1]),
            (int) str_replace(',', '', $matches[2]),
        ];
    }

    /**
     * @param array<string, string> $rows
     * @param array<int, string> $labels
     */
    private function usedCount(array $rows, array $labels): ?int
    {
        $found = false;
        $total = 0;

        foreach ($labels as $label) {
            if (
                isset($rows[$label]) &&
                preg_match('/^\s*([0-9,]+)/', $rows[$label], $matches)
            ) {
                $found = true;
                $total += (int) str_replace(',', '', $matches[1]);
            }
        }

        return $found ? $total : null;
    }

    private function decimalValue(string $value): float
    {
        $value = trim($value);

        if (str_contains($value, ',') && str_contains($value, '.')) {
            $decimalSeparator =
                strrpos($value, ',') > strrpos($value, '.') ? ',' : '.';
            $thousandsSeparator = $decimalSeparator === ',' ? '.' : ',';
            $value = str_replace($thousandsSeparator, '', $value);
            $value = str_replace($decimalSeparator, '.', $value);
        } elseif (str_contains($value, ',')) {
            $value = str_replace(',', '.', $value);
        }

        return (float) $value;
    }

    private function hasNoMetrics(HostingStatsData $stats): bool
    {
        return collect([
            $stats->diskUsedBytes,
            $stats->diskLimitBytes,
            $stats->bandwidthUsedBytes,
            $stats->bandwidthLimitBytes,
            $stats->inodesUsed,
            $stats->inodesLimit,
        ])->every(fn(?int $value) => $value === null);
    }

    private function safeFailureMessage(string $code): string
    {
        return match ($code) {
            'panel_account_suspended'
                => 'The hosting panel account is suspended.',
            'panel_invalid_credentials'
                => 'The hosting panel credentials were rejected.',
            'panel_response_too_large'
                => 'The hosting panel response exceeded the safe size limit.',
            'panel_not_configured', 'panel_credentials_unavailable'
                => 'The hosting panel is not configured for this account.',
            'panel_redirect_missing', 'panel_redirect_invalid'
                => 'The application installer returned an invalid redirect.',
            'installer_redirect_https_required'
                => 'The application installer redirect must use HTTPS.',
            'installer_redirect_userinfo_not_allowed'
                => 'The application installer redirect included forbidden user information.',
            'installer_redirect_contains_username'
                => 'The application installer redirect included the account username.',
            'installer_redirect_contains_password'
                => 'The application installer redirect included the account password.',
            'installer_redirect_host_not_allowed'
                => 'The application installer redirect is not authorized.',
            default => 'The hosting panel returned an invalid response.',
        };
    }

    private function validateInstallerRedirect(
        string $url,
        PanelAccountCredentialsData $account,
    ): string {
        $parts = parse_url($url);

        if (!filter_var($url, FILTER_VALIDATE_URL) || !is_array($parts)) {
            throw new VistaPanelException('panel_redirect_invalid');
        }

        if (strtolower((string) ($parts['scheme'] ?? '')) !== 'https') {
            throw new VistaPanelException(
                'installer_redirect_https_required',
            );
        }

        if (empty($parts['host'])) {
            throw new VistaPanelException('panel_redirect_invalid');
        }

        if (isset($parts['user']) || isset($parts['pass'])) {
            throw new VistaPanelException(
                'installer_redirect_userinfo_not_allowed',
            );
        }

        $decoded = rawurldecode($url);
        if (
            $account->password !== '' &&
            str_contains($decoded, $account->password)
        ) {
            throw new VistaPanelException(
                'installer_redirect_contains_password',
            );
        }

        if (
            $account->username !== '' &&
            str_contains($decoded, $account->username)
        ) {
            throw new VistaPanelException(
                'installer_redirect_contains_username',
            );
        }

        if (!$this->installerHostIsAllowed((string) $parts['host'])) {
            throw new VistaPanelException(
                'installer_redirect_host_not_allowed',
            );
        }

        return $url;
    }

    private function resolveInstallerRedirect(
        string $url,
        PanelAccountCredentialsData $account,
    ): string {
        for ($attempt = 0; $attempt < 3; $attempt++) {
            $decoded = rawurldecode($url);
            $containsCredential =
                ($account->password !== '' &&
                    str_contains($decoded, $account->password)) ||
                ($account->username !== '' &&
                    str_contains($decoded, $account->username));

            if (!$containsCredential) {
                return $this->validateInstallerRedirect($url, $account);
            }

            $this->validateInstallerHandoff($url);
            $url = $this->client()->followExternalRedirect($url);
        }

        return $this->validateInstallerRedirect($url, $account);
    }

    private function validateInstallerHandoff(string $url): void
    {
        $parts = parse_url($url);

        if (
            !filter_var($url, FILTER_VALIDATE_URL) ||
            !is_array($parts) ||
            strtolower((string) ($parts['scheme'] ?? '')) !== 'https' ||
            empty($parts['host']) ||
            isset($parts['user']) ||
            isset($parts['pass'])
        ) {
            throw new VistaPanelException('panel_redirect_invalid');
        }

        if (!$this->installerHostIsAllowed((string) $parts['host'])) {
            throw new VistaPanelException(
                'installer_redirect_host_not_allowed',
            );
        }
    }

    private function installerHostIsAllowed(string $host): bool
    {
        $allowedHosts = collect([
            config('hospedfree.vistapanel.cpanel_url'),
            config('hospedfree.tools.installer_url'),
            ...config('hospedfree.tools.installer_allowed_hosts', []),
        ])
            ->filter(fn(mixed $configured): bool => is_string($configured))
            ->map(
                fn(string $configured): string => strtolower((string) (
                    parse_url($configured, PHP_URL_HOST) ?: $configured
                )),
            )
            ->filter()
            ->unique()
            ->values()
            ->all();
        $host = strtolower($host);

        return collect($allowedHosts)->contains(
            fn(string $allowed): bool =>
                $host === $allowed || str_ends_with($host, ".{$allowed}"),
        );
    }

    private function client(): VistaPanelClient
    {
        return $this->panelClient ??= new VistaPanelClient($this->httpClient);
    }
}
