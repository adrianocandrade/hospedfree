<?php

namespace App\Hosting\Providers;

use App\Hosting\Contracts\HostingPackageCatalogProvider;
use App\Hosting\Data\HostingProviderPackageData;
use App\Hosting\Data\ProviderResponse;
use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\GuzzleException;
use JsonException;
use Throwable;

class MofhHostingPackageCatalogProvider implements HostingPackageCatalogProvider
{
    public function __construct(private ?ClientInterface $httpClient = null) {}

    public function listPackages(): ProviderResponse
    {
        if (!$this->isConfigured()) {
            return ProviderResponse::failure(
                'provider_not_configured',
                'The hosting provider is not configured.',
            );
        }

        try {
            $response = $this->httpClient()->request(
                'GET',
                $this->packagesEndpoint(),
                [
                    // Unlike most MOFH read endpoints, listpkgs authenticates
                    // with HTTP Basic. Keep credentials out of the query string.
                    'auth' => [
                        (string) config('hospedfree.mofh.username'),
                        (string) config('hospedfree.mofh.password'),
                    ],
                ],
            );
            $payload = json_decode(
                (string) $response->getBody(),
                true,
                512,
                JSON_THROW_ON_ERROR,
            );

            if (!is_array($payload)) {
                return ProviderResponse::failure(
                    'provider_package_lookup_invalid_response',
                    'The hosting provider returned an invalid package catalog.',
                    true,
                );
            }

            $providerError = data_get($payload, 'cpanelresult.error');

            if (filled($providerError)) {
                return ProviderResponse::failure(
                    $this->safeFailureCode((string) $providerError),
                    'The hosting provider rejected the package lookup.',
                );
            }

            $remotePackages =
                $payload['packages'] ?? ($payload['package'] ?? null);

            if (!is_array($remotePackages)) {
                return ProviderResponse::failure(
                    'provider_package_lookup_invalid_response',
                    'The hosting provider returned an invalid package catalog.',
                    true,
                );
            }

            $packages = collect($remotePackages)
                ->filter(fn(mixed $package) => is_array($package))
                ->map(fn(array $package) => $this->normalizePackage($package))
                ->filter()
                ->unique(
                    fn(HostingProviderPackageData $package) => strtolower(
                        $package->name,
                    ),
                )
                ->values()
                ->all();

            return ProviderResponse::ok($packages);
        } catch (GuzzleException) {
            return ProviderResponse::failure(
                'provider_unreachable',
                'The hosting provider did not respond in time.',
                true,
            );
        } catch (JsonException) {
            return ProviderResponse::failure(
                'provider_package_lookup_invalid_response',
                'The hosting provider returned an invalid package catalog.',
                true,
            );
        } catch (Throwable) {
            return ProviderResponse::failure(
                'provider_package_lookup_failed',
                'The hosting package catalog could not be loaded.',
                true,
            );
        }
    }

    /**
     * Only allow fields that are safe and required by the local catalog.
     * The provider payload itself must never leave this adapter.
     *
     * @param array<string, mixed> $package
     */
    private function normalizePackage(
        array $package,
    ): ?HostingProviderPackageData {
        $name = trim(strip_tags((string) ($package['name'] ?? '')));

        if (
            $name === '' ||
            mb_strlen($name) > 120 ||
            preg_match('/[\x00-\x1F\x7F]/u', $name)
        ) {
            return null;
        }

        return new HostingProviderPackageData(
            name: $name,
            diskLimitMb: $this->byteLimitInMb($package['QUOTA'] ?? null),
            bandwidthLimitMb: $this->byteLimitInMb($package['BWLIMIT'] ?? null),
        );
    }

    private function byteLimitInMb(mixed $value): ?int
    {
        if (!is_numeric($value)) {
            return null;
        }

        $value = (int) $value;

        if ($value < 0 || $value === PHP_INT_MAX) {
            return null;
        }

        return (int) ceil($value / 1_048_576);
    }

    private function safeFailureCode(?string $message): string
    {
        $message = strtolower((string) $message);

        return match (true) {
            str_contains($message, 'invalid') &&
                str_contains($message, 'username')
                => 'provider_package_lookup_invalid_username',
            str_contains($message, 'invalid') &&
                (str_contains($message, 'password') ||
                    str_contains($message, 'key'))
                => 'provider_package_lookup_invalid_credentials',
            str_contains($message, 'ip') &&
                (str_contains($message, 'allow') ||
                    str_contains($message, 'access'))
                => 'provider_package_lookup_ip_not_allowed',
            default => 'provider_rejected_package_lookup',
        };
    }

    private function packagesEndpoint(): string
    {
        $parts = parse_url((string) config('hospedfree.mofh.base_url'));

        if (
            !is_array($parts) ||
            ($parts['scheme'] ?? null) !== 'https' ||
            blank($parts['host'] ?? null)
        ) {
            throw new \RuntimeException('The MOFH API URL must be HTTPS.');
        }

        $port = isset($parts['port']) ? ':' . (int) $parts['port'] : '';

        return "https://{$parts['host']}{$port}/json-api/listpkgs";
    }

    private function httpClient(): ClientInterface
    {
        return $this->httpClient ??= new GuzzleClient([
            'connect_timeout' => (int) config(
                'hospedfree.provider.connect_timeout_seconds',
                5,
            ),
            'timeout' => (int) config(
                'hospedfree.provider.timeout_seconds',
                15,
            ),
        ]);
    }

    private function isConfigured(): bool
    {
        return collect(['base_url', 'username', 'password'])->every(
            fn(string $key) => filled(config("hospedfree.mofh.$key")),
        );
    }
}
