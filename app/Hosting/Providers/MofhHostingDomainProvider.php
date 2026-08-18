<?php

namespace App\Hosting\Providers;

use App\Hosting\Contracts\HostingDomainProvider;
use App\Hosting\Data\HostingDomainData;
use App\Hosting\Data\DnsInstructionData;
use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Data\ProviderResponse;
use App\Hosting\Providers\VistaPanel\VistaPanelClient;
use App\Hosting\Providers\VistaPanel\VistaPanelException;
use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\GuzzleException;
use InfinityFree\MofhClient\Client as MofhClient;
use InfinityFree\MofhClient\Exception\MofhClientHttpException;
use Throwable;

class MofhHostingDomainProvider implements HostingDomainProvider
{
    private ?MofhClient $client = null;
    private ?VistaPanelClient $panelClient = null;

    public function __construct(private ?ClientInterface $httpClient = null) {}

    public function listDomains(
        string $remoteAccountId,
        string $primaryDomain,
    ): ProviderResponse {
        if (!$this->isConfigured()) {
            return $this->notConfigured();
        }

        return $this->execute(function () use (
            $remoteAccountId,
            $primaryDomain,
        ): ProviderResponse {
            $response = $this->client()->getUserDomains($remoteAccountId);

            if (!$response->isSuccessful()) {
                return ProviderResponse::failure(
                    'provider_rejected_operation',
                    'The hosting provider rejected the domain lookup.',
                );
            }

            $status = $this->normalizeStatus($response->getStatus());
            $domains = collect($response->getDomains())
                ->filter(
                    fn(mixed $domain) => is_string($domain) &&
                        $this->isValidDomain($domain),
                )
                ->map(
                    fn(string $domain) => new HostingDomainData(
                        domain: strtolower($domain),
                        type: strcasecmp($domain, $primaryDomain) === 0
                            ? 'primary'
                            : $this->domainType($domain),
                        status: $status,
                        isPrimary: strcasecmp($domain, $primaryDomain) === 0,
                    ),
                )
                ->unique(fn(HostingDomainData $domain) => $domain->domain)
                ->values()
                ->all();

            return ProviderResponse::ok($domains);
        });
    }

    public function checkDomain(
        string $remoteAccountId,
        string $domain,
    ): ProviderResponse {
        if (!$this->isConfigured()) {
            return $this->notConfigured();
        }

        return $this->execute(function () use (
            $remoteAccountId,
            $domain,
        ): ProviderResponse {
            $response = $this->client()->getDomainUser($domain);

            if (!$response->isSuccessful()) {
                return ProviderResponse::failure(
                    'provider_rejected_operation',
                    'The hosting provider rejected the domain verification.',
                );
            }

            $expectedUsername = $remoteAccountId;
            $belongsToAccount =
                $response->isFound() &&
                hash_equals(
                    strtolower($expectedUsername),
                    strtolower((string) $response->getUsername()),
                );

            return ProviderResponse::ok(
                new HostingDomainData(
                    domain: strtolower($domain),
                    type: 'custom',
                    status: $belongsToAccount
                        ? $this->normalizeStatus($response->getStatus())
                        : 'pending_verification',
                ),
            );
        });
    }

    public function domainVerificationInstructions(
        string $remoteAccountId,
        string $domain,
    ): ProviderResponse {
        if (!$this->isConfigured()) {
            return $this->notConfigured();
        }

        $target = $this->normalizeHostname(
            (string) config('hospedfree.domains.cname_target'),
        );

        if (!$target) {
            return ProviderResponse::failure(
                'domain_cname_target_not_configured',
                'The domain verification target is not configured.',
            );
        }

        return $this->execute(function () use (
            $remoteAccountId,
            $domain,
            $target,
        ): ProviderResponse {
            $response = $this->client()->getCname($domain);

            if (!$response->isSuccessful()) {
                return ProviderResponse::failure(
                    'provider_rejected_domain_verification',
                    'The hosting provider rejected the domain verification request.',
                );
            }

            $label = strtolower(trim((string) $response->getCname()));

            if (!preg_match('/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/', $label)) {
                return ProviderResponse::failure(
                    'provider_invalid_domain_verification',
                    'The hosting provider returned an invalid domain verification instruction.',
                );
            }

            return ProviderResponse::ok([
                new DnsInstructionData(
                    type: 'CNAME',
                    name: "{$label}.{$domain}",
                    value: $target,
                    ttl: 300,
                ),
            ]);
        });
    }

    public function addCustomDomain(
        PanelAccountCredentialsData $account,
        string $domain,
    ): ProviderResponse {
        return ProviderResponse::failure(
            'custom_domain_mutation_not_verified',
            'Custom domain changes are not available until the provider contract is verified.',
        );
    }

    public function addSubdomain(
        PanelAccountCredentialsData $account,
        string $label,
        string $zone,
    ): ProviderResponse {
        return $this->executePanel(function () use (
            $account,
            $label,
            $zone,
        ): ProviderResponse {
            $session = $this->panel()->authenticate($account);
            $html = $this->panel()->postOption(
                $session,
                'subdomains',
                ['create' => 1],
                [
                    'subdomain' => $label,
                    'domain' => $zone,
                    'create' => 'Create Subdomain',
                ],
            );

            if (!$this->containsPanelSuccess($html, 'subdomain created successfully')) {
                return ProviderResponse::failure(
                    'panel_domain_change_rejected',
                    'The hosting panel rejected the subdomain change.',
                );
            }

            return ProviderResponse::ok(
                new HostingDomainData(
                    domain: strtolower("{$label}.{$zone}"),
                    type: 'subdomain',
                    status: 'active',
                ),
            );
        });
    }

    public function deleteDomain(
        PanelAccountCredentialsData $account,
        string $domain,
        string $type,
    ): ProviderResponse {
        if ($type !== 'subdomain') {
            return ProviderResponse::failure(
                'custom_domain_mutation_not_verified',
                'Custom domain changes are not available until the provider contract is verified.',
            );
        }

        [$label, $zone] = $this->splitAllowedSubdomain($domain);

        if (!$label || !$zone) {
            return ProviderResponse::failure(
                'panel_domain_invalid',
                'The subdomain could not be matched to an allowed domain zone.',
            );
        }

        return $this->executePanel(function () use (
            $account,
            $domain,
            $label,
            $zone,
        ): ProviderResponse {
            $session = $this->panel()->authenticate($account);
            $html = $this->panel()->postOption(
                $session,
                'subdomains',
                ['delete' => 1],
                [
                    'subdomain' => $label,
                    'domain' => $zone,
                    'delete' => 'Delete Subdomain',
                ],
            );

            if (!$this->containsPanelSuccess($html, 'subdomain deleted successfully')) {
                return ProviderResponse::failure(
                    'panel_domain_change_rejected',
                    'The hosting panel rejected the subdomain removal.',
                );
            }

            return ProviderResponse::ok(true);
        });
    }

    private function execute(callable $callback): ProviderResponse
    {
        try {
            return $callback();
        } catch (MofhClientHttpException | GuzzleException) {
            return ProviderResponse::failure(
                'provider_unreachable',
                'The hosting provider did not respond in time.',
                retryable: true,
            );
        } catch (Throwable) {
            return ProviderResponse::failure(
                'provider_request_failed',
                'The hosting provider request could not be completed.',
                retryable: true,
            );
        }
    }

    private function client(): MofhClient
    {
        return $this->client ??= new MofhClient(
            (string) config('hospedfree.mofh.username'),
            (string) config('hospedfree.mofh.password'),
            rtrim((string) config('hospedfree.mofh.base_url'), '/') . '/',
            $this->httpClient(),
        );
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
            'verify' => true,
        ]);
    }

    private function isConfigured(): bool
    {
        return collect(['base_url', 'username', 'password'])->every(
            fn(string $key) => filled(config("hospedfree.mofh.$key")),
        );
    }

    private function notConfigured(): ProviderResponse
    {
        return ProviderResponse::failure(
            'provider_not_configured',
            'The hosting provider is not configured.',
        );
    }

    private function executePanel(callable $callback): ProviderResponse
    {
        try {
            return $callback();
        } catch (VistaPanelException $exception) {
            return ProviderResponse::failure(
                $exception->getMessage(),
                $this->safePanelFailureMessage($exception->getMessage()),
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

    private function safePanelFailureMessage(string $code): string
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
            'panel_response_too_large'
                => 'The hosting panel response exceeded the safe size limit.',
            default => 'The hosting panel returned an invalid response.',
        };
    }

    private function containsPanelSuccess(string $html, string $message): bool
    {
        $text = strtolower(
            preg_replace('/\s+/', ' ', strip_tags(html_entity_decode($html))) ?:
                '',
        );

        return str_contains($text, strtolower($message));
    }

    private function domainType(string $domain): string
    {
        return $this->splitAllowedSubdomain($domain)[0]
            ? 'subdomain'
            : 'custom';
    }

    /** @return array{?string, ?string} */
    private function splitAllowedSubdomain(string $domain): array
    {
        $domain = strtolower(trim($domain));

        foreach ((array) config('hospedfree.allowed_domains', []) as $zone) {
            $zone = strtolower(trim((string) $zone));
            $suffix = ".{$zone}";

            if (
                $zone !== '' &&
                str_ends_with($domain, $suffix) &&
                substr_count(substr($domain, 0, -strlen($suffix)), '.') === 0
            ) {
                return [substr($domain, 0, -strlen($suffix)), $zone];
            }
        }

        return [null, null];
    }

    private function panel(): VistaPanelClient
    {
        return $this->panelClient ??= new VistaPanelClient($this->httpClient);
    }

    private function normalizeStatus(?string $status): string
    {
        return match (strtolower(trim((string) $status))) {
            'active', '1', 'a' => 'active',
            'suspended', 'x' => 'suspended',
            default => 'action_required',
        };
    }

    private function isValidDomain(string $domain): bool
    {
        $ascii = function_exists('idn_to_ascii')
            ? idn_to_ascii(strtolower(trim($domain)))
            : strtolower(trim($domain));

        return (bool) filter_var(
            $ascii ?: $domain,
            FILTER_VALIDATE_DOMAIN,
            FILTER_FLAG_HOSTNAME,
        );
    }

    private function normalizeHostname(string $hostname): ?string
    {
        $hostname = strtolower(trim(rtrim($hostname, '.')));

        return filter_var(
            $hostname,
            FILTER_VALIDATE_DOMAIN,
            FILTER_FLAG_HOSTNAME,
        )
            ? $hostname
            : null;
    }
}
