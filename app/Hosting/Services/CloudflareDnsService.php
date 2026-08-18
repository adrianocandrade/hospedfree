<?php

namespace App\Hosting\Services;

use App\Hosting\Data\CloudflareDnsRecordData;
use App\Hosting\Data\ProviderResponse;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Throwable;

class CloudflareDnsService
{
    public function __construct(private readonly HostingSecretStore $secrets) {}

    /** @return ProviderResponse<array{zone_name: string}> */
    public function health(): ProviderResponse
    {
        if (!$this->isConfigured()) {
            return ProviderResponse::failure(
                'cloudflare_not_configured',
                'Cloudflare DNS is not configured.',
            );
        }

        try {
            $response = $this->client()->get($this->zonePath());

            if (!$response->successful() || $response->json('success') !== true) {
                return ProviderResponse::failure(
                    'cloudflare_invalid_credentials',
                    'Cloudflare rejected the configured credentials.',
                    $response->serverError(),
                );
            }

            $zoneName = strtolower(trim((string) $response->json('result.name')));

            if (!$this->validHostname($zoneName)) {
                return ProviderResponse::failure(
                    'cloudflare_invalid_response',
                    'Cloudflare returned an invalid zone response.',
                );
            }

            return ProviderResponse::ok(['zone_name' => $zoneName]);
        } catch (ConnectionException) {
            return ProviderResponse::failure(
                'cloudflare_unreachable',
                'Cloudflare did not respond in time.',
                true,
            );
        } catch (Throwable) {
            return ProviderResponse::failure(
                'cloudflare_request_failed',
                'Cloudflare could not be checked safely.',
                true,
            );
        }
    }

    /** @return ProviderResponse<CloudflareDnsRecordData> */
    public function createTxtRecord(string $name, string $value, int $ttl = 120): ProviderResponse
    {
        if (!$this->isConfigured() || !$this->validHostname($name) || !$this->validTxtValue($value)) {
            return ProviderResponse::failure(
                'cloudflare_not_configured',
                'Automatic DNS validation is not configured.',
            );
        }

        try {
            $response = $this->client()->post($this->zonePath('/dns_records'), [
                'type' => 'TXT',
                'name' => strtolower($name),
                'content' => $value,
                'ttl' => max(60, min($ttl, 86400)),
                'proxied' => false,
                'comment' => 'HospedFree ACME DNS-01 validation',
            ]);

            if (!$response->successful() || $response->json('success') !== true) {
                return ProviderResponse::failure(
                    'cloudflare_record_failed',
                    'Cloudflare could not create the DNS validation record.',
                    $response->serverError(),
                );
            }

            $id = trim((string) $response->json('result.id'));

            if ($id === '') {
                return ProviderResponse::failure(
                    'cloudflare_invalid_response',
                    'Cloudflare returned an invalid DNS record response.',
                );
            }

            return ProviderResponse::ok(new CloudflareDnsRecordData(
                id: $id,
                type: 'TXT',
                name: strtolower($name),
                value: $value,
                ttl: max(60, min($ttl, 86400)),
            ));
        } catch (ConnectionException) {
            return ProviderResponse::failure(
                'cloudflare_unreachable',
                'Cloudflare did not respond in time.',
                true,
            );
        } catch (Throwable) {
            return ProviderResponse::failure(
                'cloudflare_request_failed',
                'The DNS validation record could not be created safely.',
                true,
            );
        }
    }

    /** @return ProviderResponse<bool> */
    public function deleteRecord(string $recordId): ProviderResponse
    {
        if (!$this->isConfigured() || !preg_match('/^[A-Za-z0-9_-]{8,128}$/', $recordId)) {
            return ProviderResponse::failure(
                'cloudflare_record_invalid',
                'The managed DNS record could not be identified.',
            );
        }

        try {
            $response = $this->client()->delete(
                $this->zonePath('/dns_records/' . rawurlencode($recordId)),
            );

            if (!$response->successful() || $response->json('success') !== true) {
                return ProviderResponse::failure(
                    'cloudflare_record_cleanup_failed',
                    'The managed DNS validation record could not be removed.',
                    $response->serverError(),
                );
            }

            return ProviderResponse::ok(true);
        } catch (Throwable) {
            return ProviderResponse::failure(
                'cloudflare_record_cleanup_failed',
                'The managed DNS validation record could not be removed.',
                true,
            );
        }
    }

    public function isConfigured(): bool
    {
        return (bool) config('hospedfree.cloudflare.enabled') &&
            filled($this->apiToken()) &&
            filled(config('hospedfree.cloudflare.zone_id'));
    }

    private function client(): PendingRequest
    {
        return Http::baseUrl('https://api.cloudflare.com/client/v4')
            ->withToken($this->apiToken())
            ->acceptJson()
            ->asJson()
            ->connectTimeout((int) config('hospedfree.provider.connect_timeout_seconds', 5))
            ->timeout((int) config('hospedfree.provider.timeout_seconds', 15))
            ->retry(
                (int) config('hospedfree.provider.retries', 2),
                250,
                throw: false,
            );
    }

    private function zonePath(string $suffix = ''): string
    {
        return '/zones/' . rawurlencode((string) config('hospedfree.cloudflare.zone_id')) . $suffix;
    }

    private function validHostname(string $host): bool
    {
        return (bool) preg_match(
            '/^(?=.{1,253}$)(?:[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?\.)+[a-z]{2,63}$/i',
            $host,
        );
    }

    private function validTxtValue(string $value): bool
    {
        return $value !== '' && strlen($value) <= 1024 && !preg_match('/[\x00-\x1F\x7F]/', $value);
    }

    private function apiToken(): string
    {
        return (string) $this->secrets->get(
            'cloudflare_api_token',
            config('hospedfree.cloudflare.api_token'),
        );
    }
}
