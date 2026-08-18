<?php

namespace App\Hosting\Providers;

use App\Hosting\Contracts\HostingProvider;
use App\Hosting\Data\CreateHostingAccountData;
use App\Hosting\Data\ProviderResult;
use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\GuzzleException;
use InfinityFree\MofhClient\Client as MofhClient;
use InfinityFree\MofhClient\Exception\MofhClientHttpException;
use InfinityFree\MofhClient\Message\AbstractResponse;
use InfinityFree\MofhClient\Message\AvailabilityResponse;
use InfinityFree\MofhClient\Message\CreateAccountResponse;
use Illuminate\Support\Str;
use Throwable;

class MofhHostingProvider implements HostingProvider
{
    private ?MofhClient $client = null;

    public function __construct(private ?ClientInterface $httpClient = null) {}

    public function key(): string
    {
        return 'mofh';
    }

    public function healthCheck(): ProviderResult
    {
        if (!$this->isConfigured()) {
            return $this->notConfigured();
        }

        return $this->execute(
            fn(): ProviderResult => $this->healthResult(
                $this->client()->availability('example.com'),
            ),
        );
    }

    public function checkDomainAvailability(string $domain): ProviderResult
    {
        if (!$this->isConfigured()) {
            return $this->notConfigured();
        }

        return $this->execute(
            fn(): ProviderResult => $this->availabilityResult(
                $this->client()->availability($domain),
                'Domain is available.',
            ),
        );
    }

    public function createAccount(CreateHostingAccountData $data): ProviderResult
    {
        if (!$this->isConfigured()) {
            return $this->notConfigured();
        }

        $providerUsername = $this->providerUsername($data->idempotencyKey);

        return $this->execute(function () use ($data, $providerUsername): ProviderResult {
            $response = $this->client()->createAccount(
                $providerUsername,
                $data->password,
                $data->email,
                $data->domain,
                Str::lower($data->remotePackage),
            );

            if (!$response->isSuccessful()) {
                return ProviderResult::failure(
                    'provider_rejected_operation',
                    $this->safeMessage(
                        $response->getMessage() ?: 'The hosting provider rejected account creation.',
                        [$data->password],
                    ),
                );
            }

            return ProviderResult::ok(
                message: 'Account creation accepted.',
                remoteAccountId: $providerUsername,
                status: $this->normalizeCreateStatus($response),
                username: $response->getVpUsername() ?: $providerUsername,
                controlPanelUrl: $this->configuredToolUrl('control_panel_url'),
                webftpUrl: $this->configuredToolUrl('webftp_url'),
                installerUrl: $this->configuredToolUrl('installer_url'),
                ftpHost: $this->configuredFtpHost(),
            );
        });
    }

    public function getAccount(
        string $remoteAccountId,
        ?string $panelUsername = null,
    ): ProviderResult
    {
        if (!$this->isConfigured()) {
            return $this->notConfigured();
        }

        return $this->execute(function () use ($remoteAccountId, $panelUsername): ProviderResult {
            $response = $this->client()->getUserDomains(
                $panelUsername ?: $remoteAccountId,
            );

            if (!$response->isSuccessful()) {
                $status = $this->normalizeErrorStatus($response->getMessage());

                if ($status) {
                    return ProviderResult::ok(
                        message: 'Account state synchronized.',
                        remoteAccountId: $remoteAccountId,
                        status: $status,
                    );
                }

                return ProviderResult::failure(
                    'provider_rejected_operation',
                    $this->safeMessage($response->getMessage() ?: 'The hosting provider rejected account lookup.'),
                );
            }

            return ProviderResult::ok(
                message: 'Account synchronized.',
                remoteAccountId: $remoteAccountId,
                status: $this->normalizeStatus($response->getStatus()),
                controlPanelUrl: $this->configuredToolUrl('control_panel_url'),
                webftpUrl: $this->configuredToolUrl('webftp_url'),
                installerUrl: $this->configuredToolUrl('installer_url'),
                ftpHost: $this->configuredFtpHost(),
            );
        });
    }

    public function suspendAccount(string $remoteAccountId, ?string $reason = null): ProviderResult
    {
        if (!$this->isConfigured()) {
            return $this->notConfigured();
        }

        return $this->execute(function () use ($remoteAccountId, $reason): ProviderResult {
            $response = $this->client()->suspend(
                $remoteAccountId,
                $reason ?: 'Administrative suspension.',
                false,
            );

            return $this->actionResult(
                $response,
                $remoteAccountId,
                successMessage: 'Account suspended.',
                successStatus: 'suspended',
                fallbackStatus: $response->getStatus() ? $this->normalizeStatus($response->getStatus()) : null,
            );
        });
    }

    public function unsuspendAccount(string $remoteAccountId): ProviderResult
    {
        if (!$this->isConfigured()) {
            return $this->notConfigured();
        }

        return $this->execute(function () use ($remoteAccountId): ProviderResult {
            $response = $this->client()->unsuspend($remoteAccountId);

            return $this->actionResult(
                $response,
                $remoteAccountId,
                successMessage: 'Account active.',
                successStatus: 'active',
                fallbackStatus: $response->getStatus() ? $this->normalizeStatus($response->getStatus()) : null,
            );
        });
    }

    public function deleteAccount(string $remoteAccountId): ProviderResult
    {
        return $this->rawAccountAction(
            'removeacct',
            $remoteAccountId,
            successMessage: 'Account deletion accepted.',
            successStatus: 'deleted',
        );
    }

    public function changePassword(string $remoteAccountId, string $password): ProviderResult
    {
        if (!$this->isConfigured()) {
            return $this->notConfigured();
        }

        return $this->execute(function () use ($remoteAccountId, $password): ProviderResult {
            $response = $this->client()->password($remoteAccountId, $password);

            return $this->actionResult(
                $response,
                $remoteAccountId,
                successMessage: 'Password changed.',
                successStatus: 'active',
                fallbackStatus: $response->getStatus() ? $this->normalizeStatus($response->getStatus()) : null,
                extraSecrets: [$password],
            );
        });
    }

    public function changePackage(string $remoteAccountId, string $remotePackage): ProviderResult
    {
        return $this->rawAccountAction(
            'changepackage',
            $remoteAccountId,
            ['pkg' => Str::lower($remotePackage)],
            'Package change accepted.',
            'active',
        );
    }

    public function toolLinks(string $remoteAccountId): ProviderResult
    {
        return ProviderResult::ok(
            message: 'Tool links loaded.',
            remoteAccountId: $remoteAccountId,
            toolLinks: array_filter([
                'control_panel' => $this->configuredToolUrl('control_panel_url'),
                'webftp' => $this->configuredToolUrl('webftp_url'),
                'installer' => $this->configuredToolUrl('installer_url'),
            ]),
        );
    }

    private function availabilityResult(AvailabilityResponse $response, string $successMessage): ProviderResult
    {
        if (!$response->isSuccessful()) {
            return $this->availabilityFailure($response);
        }

        if (!$response->isAvailable()) {
            return ProviderResult::failure(
                'domain_unavailable',
                'This domain is not available.',
            );
        }

        return ProviderResult::ok($successMessage, status: 'available');
    }

    private function healthResult(AvailabilityResponse $response): ProviderResult
    {
        if (!$response->isSuccessful()) {
            return $this->availabilityFailure($response);
        }

        // A valid availability response proves connectivity even when the
        // arbitrary probe domain is already in use.
        return ProviderResult::ok('Provider is reachable.', status: 'ready');
    }

    private function availabilityFailure(AvailabilityResponse $response): ProviderResult
    {
        $message = strtolower((string) $response->getMessage());

        if (
            Str::contains($message, [
                'does not match the allowed ip',
                'does not match allowed ip',
                'ip address is not allowed',
                'ip is not allowed',
            ])
        ) {
            return ProviderResult::failure(
                'provider_ip_not_allowed',
                'The server outbound IP is not allowed by the hosting provider.',
            );
        }

        if (
            Str::contains($message, [
                'could not authenticate',
                'authentication failed',
                'invalid credentials',
                'access denied',
            ])
        ) {
            return ProviderResult::failure(
                'provider_authentication_failed',
                'The hosting provider credentials were rejected.',
            );
        }

        return ProviderResult::failure(
            'provider_invalid_response',
            'The hosting provider returned an invalid availability response.',
            retryable: true,
        );
    }

    private function actionResult(
        AbstractResponse $response,
        string $remoteAccountId,
        string $successMessage,
        string $successStatus,
        ?string $fallbackStatus = null,
        array $extraSecrets = [],
    ): ProviderResult {
        if (!$response->isSuccessful()) {
            return ProviderResult::failure(
                'provider_rejected_operation',
                $this->safeMessage($response->getMessage() ?: 'The hosting provider rejected the operation.', $extraSecrets),
            );
        }

        return ProviderResult::ok(
            message: $successMessage,
            remoteAccountId: $remoteAccountId,
            status: $fallbackStatus ?: $successStatus,
            username: $remoteAccountId,
        );
    }

    private function rawAccountAction(
        string $function,
        string $remoteAccountId,
        array $payload = [],
        string $successMessage = 'Operation accepted.',
        string $successStatus = 'active',
    ): ProviderResult {
        if (!$this->isConfigured()) {
            return $this->notConfigured();
        }

        return $this->execute(function () use ($function, $remoteAccountId, $payload, $successMessage, $successStatus): ProviderResult {
            $response = $this->httpClient()->request('POST', $this->apiUrl() . $function, [
                'auth' => [
                    (string) config('hospedfree.mofh.username'),
                    (string) config('hospedfree.mofh.password'),
                ],
                'form_params' => [
                    'user' => $remoteAccountId,
                    ...$payload,
                ],
                'connect_timeout' => (int) config('hospedfree.provider.connect_timeout_seconds', 5),
                'timeout' => (int) config('hospedfree.provider.timeout_seconds', 15),
            ]);

            $body = trim((string) $response->getBody());
            $data = $this->parseXmlBody($body);
            $status = $data['result']['status'] ?? $data['passwd']['status'] ?? null;
            $message = $data['result']['statusmsg'] ?? $data['passwd']['statusmsg'] ?? $body;

            if (!in_array($status, [1, '1', true], true)) {
                return ProviderResult::failure(
                    'provider_rejected_operation',
                    $this->safeMessage($message ?: 'The hosting provider rejected the operation.'),
                );
            }

            return ProviderResult::ok(
                message: $successMessage,
                remoteAccountId: $remoteAccountId,
                status: $successStatus,
                username: $remoteAccountId,
            );
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function parseXmlBody(string $body): array
    {
        $xml = @simplexml_load_string($body, \SimpleXMLElement::class, LIBXML_NOERROR);

        if (!$xml) {
            return [];
        }

        return json_decode(json_encode($xml, JSON_THROW_ON_ERROR), true, flags: JSON_THROW_ON_ERROR);
    }

    private function execute(callable $callback): ProviderResult
    {
        try {
            return $callback();
        } catch (MofhClientHttpException|GuzzleException) {
            return ProviderResult::failure(
                'provider_unreachable',
                'The hosting provider did not respond in time.',
                retryable: true,
            );
        } catch (Throwable) {
            return ProviderResult::failure(
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
            $this->apiUrl(),
            $this->httpClient(),
        );
    }

    private function httpClient(): ClientInterface
    {
        return $this->httpClient ??= new GuzzleClient([
            'connect_timeout' => (int) config('hospedfree.provider.connect_timeout_seconds', 5),
            'timeout' => (int) config('hospedfree.provider.timeout_seconds', 15),
        ]);
    }

    private function apiUrl(): string
    {
        return rtrim((string) config('hospedfree.mofh.base_url'), '/') . '/';
    }

    private function providerUsername(string $idempotencyKey): string
    {
        return 'hf' . substr(hash('sha256', $idempotencyKey), 0, 6);
    }

    private function normalizeCreateStatus(CreateAccountResponse $response): string
    {
        return $response->getVpUsername() ? 'pending' : 'provisioning';
    }

    private function normalizeStatus(?string $status): string
    {
        return match (strtolower(trim((string) $status))) {
            '1', 'a', 'active', 'activated', 'reactivate' => 'active',
            'x', 'suspended' => 'suspended',
            'r', 'reactivating', 'pending', '' => 'provisioning',
            'c', 'closing', 'deleting' => 'deleting',
            'd', 'deleted', 'terminated' => 'deleted',
            default => 'action_required',
        };
    }

    private function normalizeErrorStatus(?string $message): ?string
    {
        $message = strtolower((string) $message);

        if (Str::contains($message, ['res_close', 'terminated', 'deleted', 'not found'])) {
            return 'deleted';
        }

        if (Str::contains($message, ['suspended', 'deactivated'])) {
            return 'suspended';
        }

        if (Str::contains($message, ['pending', 'reactivating'])) {
            return 'provisioning';
        }

        return null;
    }

    private function safeMessage(string $message, array $extraSecrets = []): string
    {
        $message = strip_tags($message);

        foreach (['username', 'password'] as $key) {
            $secret = (string) config("hospedfree.mofh.$key");
            if ($secret !== '') {
                $message = str_replace($secret, '[redacted]', $message);
            }
        }

        foreach ($extraSecrets as $secret) {
            if (is_string($secret) && $secret !== '') {
                $message = str_replace($secret, '[redacted]', $message);
            }
        }

        $message = preg_replace('/(pass(word)?|token|secret|api[_ -]?key)\s*[:=]\s*\S+/i', '$1=[redacted]', $message) ?? '';

        return Str::limit(trim($message), 500, '');
    }

    private function nullableConfiguredString(string $key): ?string
    {
        $value = config($key);

        return is_string($value) && $value !== '' ? $value : null;
    }

    private function configuredToolUrl(string $key): ?string
    {
        return $this->nullableConfiguredString("hospedfree.tools.$key");
    }

    private function configuredFtpHost(): ?string
    {
        return $this->nullableConfiguredString('hospedfree.mofh.ftp_host');
    }

    private function isConfigured(): bool
    {
        return collect(['base_url', 'username', 'password'])
            ->every(fn(string $key) => filled(config("hospedfree.mofh.$key")));
    }

    private function notConfigured(): ProviderResult
    {
        return ProviderResult::failure(
            'provider_not_configured',
            'The hosting provider is not configured.',
        );
    }
}
