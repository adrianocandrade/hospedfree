<?php

namespace App\Hosting\Providers;

use Afosto\Acme\Client;
use Afosto\Acme\Data\Authorization;
use Afosto\Acme\Data\Order;
use App\Hosting\Contracts\HostingSslProvider;
use App\Hosting\Data\DnsInstructionData;
use App\Hosting\Data\HostingSslOrderData;
use App\Hosting\Data\ProviderResponse;
use App\Hosting\Services\AcmeClientFactory;
use App\Hosting\Services\CloudflareDnsService;
use GuzzleHttp\Exception\ConnectException;
use Throwable;

class AcmeHostingSslProvider implements HostingSslProvider
{
    public function __construct(
        private readonly AcmeClientFactory $clients,
        private readonly CloudflareDnsService $cloudflare,
    ) {}

    public function requestCertificate(
        string $remoteAccountId,
        string $domain,
    ): ProviderResponse {
        if (!(bool) config('hospedfree.acme.enabled')) {
            return $this->notConfigured();
        }

        try {
            $client = $this->clients->make();
            $order = $client->createOrder([$domain]);
            $authorization = $this->authorization($client, $order);
            $record = $authorization->getTxtRecord();

            if ($record === false) {
                return ProviderResponse::failure(
                    'acme_dns_challenge_unavailable',
                    'The certificate issuer did not provide a DNS challenge.',
                );
            }

            $managed = false;
            $managedRecordId = null;

            if ($this->cloudflare->isConfigured()) {
                $created = $this->cloudflare->createTxtRecord(
                    $record->getName(),
                    $record->getValue(),
                );

                if (!$created->success) {
                    return $created;
                }

                $managed = true;
                $managedRecordId = $created->data->id;
            }

            return ProviderResponse::ok(new HostingSslOrderData(
                status: 'pending_validation',
                remoteOrderId: $order->getId(),
                dnsInstructions: [new DnsInstructionData(
                    type: 'TXT',
                    name: $record->getName(),
                    value: $record->getValue(),
                    managed: $managed,
                    providerRecordId: $managedRecordId,
                )],
            ));
        } catch (ConnectException) {
            return ProviderResponse::failure(
                'acme_unreachable',
                'The certificate issuer did not respond in time.',
                true,
            );
        } catch (Throwable) {
            return ProviderResponse::failure(
                'acme_request_failed',
                'The certificate request could not be completed safely.',
                true,
            );
        }
    }

    public function certificateStatus(
        string $remoteAccountId,
        string $remoteOrderId,
    ): ProviderResponse {
        try {
            $order = $this->clients->make()->getOrder($remoteOrderId);

            return ProviderResponse::ok(new HostingSslOrderData(
                status: $this->normalizeStatus($order->getStatus()),
                remoteOrderId: $remoteOrderId,
            ));
        } catch (Throwable) {
            return ProviderResponse::failure(
                'acme_status_failed',
                'The certificate status could not be checked safely.',
                true,
            );
        }
    }

    public function validateCertificate(
        string $remoteAccountId,
        string $remoteOrderId,
        ?string $managedDnsRecordId = null,
    ): ProviderResponse {
        try {
            $client = $this->clients->make();
            $order = $client->getOrder($remoteOrderId);
            $authorization = $this->authorization($client, $order);

            if (!$client->selfTest($authorization, Client::VALIDATION_DNS, 1)) {
                return ProviderResponse::failure(
                    'acme_dns_not_propagated',
                    'The DNS validation record was not found yet.',
                    true,
                );
            }

            $challenge = $authorization->getDnsChallenge();
            if ($challenge === false || !$client->validate($challenge, 3)) {
                return ProviderResponse::failure(
                    'acme_validation_failed',
                    'The certificate issuer did not accept the DNS challenge.',
                    true,
                );
            }

            $order = $client->getOrder($remoteOrderId);
            if (!in_array($order->getStatus(), ['ready', 'processing'], true)) {
                return ProviderResponse::failure(
                    'acme_order_not_ready',
                    'The certificate order is not ready for issuance yet.',
                    true,
                );
            }

            $certificate = $client->getCertificate($order);

            if ($managedDnsRecordId) {
                $this->cloudflare->deleteRecord($managedDnsRecordId);
            }

            return ProviderResponse::ok(new HostingSslOrderData(
                status: 'issued',
                remoteOrderId: $remoteOrderId,
                validUntil: $certificate->getExpiryDate()->format(DATE_ATOM),
                privateKey: $certificate->getPrivateKey(),
                csr: $certificate->getCsr(),
                certificate: $certificate->getCertificate(false),
                caCertificate: $certificate->getIntermediate(),
            ));
        } catch (ConnectException) {
            return ProviderResponse::failure(
                'acme_unreachable',
                'The certificate issuer did not respond in time.',
                true,
            );
        } catch (Throwable) {
            return ProviderResponse::failure(
                'acme_issuance_failed',
                'The certificate could not be issued safely.',
                true,
            );
        }
    }

    public function revokeCertificate(
        string $remoteAccountId,
        string $remoteOrderId,
    ): ProviderResponse {
        return ProviderResponse::failure(
            'acme_revocation_not_supported',
            'Remote revocation is not supported by the configured ACME adapter.',
        );
    }

    private function authorization(Client $client, Order $order): Authorization
    {
        $authorizations = $client->authorize($order);
        $authorization = $authorizations[0] ?? null;

        if (!$authorization instanceof Authorization) {
            throw new \RuntimeException('Invalid ACME authorization response.');
        }

        return $authorization;
    }

    private function normalizeStatus(string $status): string
    {
        return match ($status) {
            'valid' => 'issued',
            'ready', 'processing' => 'verifying',
            'invalid', 'expired', 'revoked' => 'failed',
            default => 'pending_validation',
        };
    }

    private function notConfigured(): ProviderResponse
    {
        return ProviderResponse::failure(
            'acme_not_configured',
            'ACME certificate issuance is not configured.',
        );
    }
}
