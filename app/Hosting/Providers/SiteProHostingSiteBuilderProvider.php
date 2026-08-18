<?php

namespace App\Hosting\Providers;

use App\Hosting\Contracts\HostingSiteBuilderProvider;
use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Data\ProviderResponse;
use App\Hosting\Data\SiteBuilderSessionData;
use App\Hosting\Services\SafeToolUrl;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Throwable;

class SiteProHostingSiteBuilderProvider implements HostingSiteBuilderProvider
{
    public function __construct(private readonly SafeToolUrl $safeToolUrl) {}

    public function createSession(
        PanelAccountCredentialsData $account,
        string $domain,
    ): ProviderResponse {
        $endpoint = $this->requestLoginEndpoint();
        $ftpHost = $this->ftpHost($account);

        if (!$endpoint || !$this->credentialsConfigured() || !$ftpHost) {
            return $this->notConfigured();
        }

        try {
            $response = $this->client()->post($endpoint, [
                'type' => 'external',
                'username' => $account->username,
                'password' => $account->password,
                'domain' => $domain,
                'baseDomain' => $domain,
                'apiUrl' => $ftpHost,
                'uploadDir' => '/htdocs/',
            ]);

            if (!$response->successful()) {
                return ProviderResponse::failure(
                    'site_builder_http_error',
                    'The site builder rejected the session request.',
                    $response->serverError() || $response->status() === 429,
                );
            }

            $url = $this->safeSessionUrl($response->json('url'));
            if (!$url) {
                return ProviderResponse::failure(
                    'site_builder_invalid_response',
                    'The site builder returned an invalid session.',
                );
            }

            return ProviderResponse::ok(
                new SiteBuilderSessionData(
                    domain: $domain,
                    url: $url,
                    expiresAt: is_string($response->json('expires_at'))
                        ? $response->json('expires_at')
                        : null,
                ),
            );
        } catch (ConnectionException) {
            return ProviderResponse::failure(
                'site_builder_unreachable',
                'The site builder did not respond in time.',
                true,
            );
        } catch (Throwable) {
            return ProviderResponse::failure(
                'site_builder_failed',
                'The site builder session could not be created.',
                true,
            );
        }
    }

    public function healthCheck(): ProviderResponse
    {
        $endpoint = $this->requestLoginEndpoint();

        if (!$endpoint || !$this->credentialsConfigured()) {
            return $this->notConfigured();
        }

        try {
            $response = $this->client()->head($endpoint);
            $status = $response->status();

            if (
                $response->successful() ||
                in_array($status, [400, 405, 422], true)
            ) {
                return ProviderResponse::ok(true);
            }

            return ProviderResponse::failure(
                in_array($status, [401, 403], true)
                    ? 'site_builder_invalid_credentials'
                    : 'site_builder_health_failed',
                'The site builder configuration could not be validated.',
                $response->serverError() || $status === 429,
            );
        } catch (ConnectionException) {
            return ProviderResponse::failure(
                'site_builder_unreachable',
                'The site builder did not respond in time.',
                true,
            );
        } catch (Throwable) {
            return ProviderResponse::failure(
                'site_builder_health_failed',
                'The site builder configuration could not be validated.',
                true,
            );
        }
    }

    private function client(): \Illuminate\Http\Client\PendingRequest
    {
        return Http::withBasicAuth(
            (string) config('hospedfree.site_builder.username'),
            (string) config('hospedfree.site_builder.password'),
        )
            ->asJson()
            ->acceptJson()
            ->connectTimeout(
                (int) config('hospedfree.provider.connect_timeout_seconds', 5),
            )
            ->timeout((int) config('hospedfree.provider.timeout_seconds', 15));
    }

    private function requestLoginEndpoint(): ?string
    {
        $base = $this->safeToolUrl->validate(
            config('hospedfree.site_builder.endpoint'),
        );

        if (!$base) {
            return null;
        }

        return str_ends_with(
            strtolower(rtrim((string) parse_url($base, PHP_URL_PATH), '/')),
            '/api/requestlogin',
        )
            ? $base
            : $this->safeToolUrl->validate(
                rtrim($base, '/') . '/api/requestLogin',
            );
    }

    private function safeSessionUrl(mixed $url): ?string
    {
        $url = is_string($url) ? $this->safeToolUrl->validate($url) : null;
        $base = $this->safeToolUrl->validate(
            config('hospedfree.site_builder.endpoint'),
        );

        if (!$url || !$base) {
            return null;
        }

        $parts = parse_url($url);
        if (isset($parts['fragment'])) {
            return null;
        }

        $host = strtolower((string) ($parts['host'] ?? ''));
        $allowedHosts = collect([
            strtolower((string) parse_url($base, PHP_URL_HOST)),
            ...config('hospedfree.site_builder.allowed_redirect_hosts', []),
        ])
            ->filter()
            ->unique()
            ->values()
            ->all();

        if (!in_array($host, $allowedHosts, true)) {
            return null;
        }

        if (!isset($parts['query'])) {
            return $url;
        }

        parse_str($parts['query'], $query);

        if (
            array_keys($query) !== ['login_hash'] ||
            !is_string($query['login_hash']) ||
            blank($query['login_hash']) ||
            strlen($query['login_hash']) > 2048
        ) {
            return null;
        }

        return $url;
    }

    private function credentialsConfigured(): bool
    {
        return filled(config('hospedfree.site_builder.username')) &&
            filled(config('hospedfree.site_builder.password'));
    }

    private function ftpHost(PanelAccountCredentialsData $account): ?string
    {
        $host = trim(
            $account->ftpHost ?: (string) config('hospedfree.mofh.ftp_host'),
        );

        $valid =
            filter_var($host, FILTER_VALIDATE_IP) ||
            filter_var($host, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME);

        return $valid ? $host : null;
    }

    private function notConfigured(): ProviderResponse
    {
        return ProviderResponse::failure(
            'site_builder_not_configured',
            'The site builder is not configured.',
        );
    }
}
