<?php

namespace App\Hosting\Services;

use Afosto\Acme\Client;
use Afosto\Acme\Data\Authorization;
use Afosto\Acme\Data\Certificate;
use Afosto\Acme\Data\Challenge;
use Afosto\Acme\Data\Order;
use Afosto\Acme\Helper;
use GuzzleHttp\Client as HttpClient;
use RuntimeException;

class HardenedAcmeClient extends Client
{
    public function authorize(Order $order): array
    {
        $authorizations = [];

        foreach ($order->getAuthorizationURLs() as $authorizationUrl) {
            $response = $this->request(
                $authorizationUrl,
                $this->signPayloadKid(null, $authorizationUrl),
            );
            $data = json_decode(
                (string) $response->getBody(),
                true,
                512,
                JSON_THROW_ON_ERROR,
            );
            $authorization = new Authorization(
                $data['identifier']['value'],
                $data['expires'],
                $this->getDigest(),
            );

            foreach ($data['challenges'] ?? [] as $challengeData) {
                if (
                    !is_array($challengeData) ||
                    !isset(
                        $challengeData['type'],
                        $challengeData['status'],
                        $challengeData['url'],
                        $challengeData['token'],
                    )
                ) {
                    continue;
                }

                $authorization->addChallenge(
                    new Challenge(
                        $authorizationUrl,
                        $challengeData['type'],
                        $challengeData['status'],
                        $challengeData['url'],
                        $challengeData['token'],
                    ),
                );
            }

            $authorizations[] = $authorization;
        }

        return $authorizations;
    }

    public function getCertificate(Order $order): Certificate
    {
        $privateKey = $this->generatePrivateKey();
        $csr = Helper::getCsr($order->getDomains(), $privateKey);
        $der = Helper::toDer($csr);
        $response = $this->request(
            $order->getFinalizeURL(),
            $this->signPayloadKid(
                ['csr' => Helper::toSafeString($der)],
                $order->getFinalizeURL(),
            ),
        );
        $data = json_decode(
            (string) $response->getBody(),
            true,
            512,
            JSON_THROW_ON_ERROR,
        );
        $certificateUrl = $data['certificate'] ?? null;

        if (!$certificateUrl && ($data['status'] ?? null) === 'processing') {
            $retryAfter = $response->getHeaderLine('Retry-After');
            sleep(is_numeric($retryAfter) ? (int) $retryAfter : 1);
            $attempts = 15;

            do {
                $order = $this->getOrder($order->getId());

                if ($order->getStatus() === 'valid') {
                    $certificateUrl = $order->getCertificateURL();
                    break;
                }

                $attempts--;
                sleep(1);
            } while ($attempts > 0);
        }

        if (!is_string($certificateUrl) || $certificateUrl === '') {
            throw new RuntimeException(
                'Certificate download link could not be retrieved.',
            );
        }

        $certificateResponse = $this->request(
            $certificateUrl,
            $this->signPayloadKid(null, $certificateUrl),
        );
        $chain = preg_replace(
            '/^[ \t]*[\r\n]+/m',
            '',
            (string) $certificateResponse->getBody(),
        );

        return new Certificate($privateKey, $csr, (string) $chain);
    }

    protected function init()
    {
        $directoryUrl = (string) $this->getOption('directory_url');
        $response = $this->getHttpClient()->get($directoryUrl);
        $directories = json_decode((string) $response->getBody(), true);

        if (!is_array($directories)) {
            throw new \RuntimeException('Invalid ACME directory response.');
        }

        $this->directories = $directories;
        $this->loadKeys();
        $this->tosAgree();
        $this->account = $this->getAccount();
    }

    protected function getHttpClient()
    {
        if ($this->httpClient === null) {
            $this->httpClient = new HttpClient([
                'verify' => true,
                'timeout' => (float) config(
                    'hospedfree.provider.timeout_seconds',
                    15,
                ),
                'connect_timeout' => (float) config(
                    'hospedfree.provider.connect_timeout_seconds',
                    5,
                ),
                'allow_redirects' => false,
                'headers' => [
                    'User-Agent' => 'HospedFree-ACME/1.0',
                ],
            ]);
        }

        return $this->httpClient;
    }

    protected function getSelfTestDNSClient()
    {
        return new HttpClient([
            'base_uri' => 'https://cloudflare-dns.com',
            'verify' => true,
            'timeout' => (float) config(
                'hospedfree.provider.timeout_seconds',
                15,
            ),
            'connect_timeout' => (float) config(
                'hospedfree.provider.connect_timeout_seconds',
                5,
            ),
            'allow_redirects' => false,
            'headers' => [
                'Accept' => 'application/dns-json',
                'User-Agent' => 'HospedFree-DNS-Check/1.0',
            ],
        ]);
    }

    protected function loadKeys()
    {
        if (!$this->getFilesystem()->has($this->getPath('account.pem'))) {
            $this->getFilesystem()->write(
                $this->getPath('account.pem'),
                $this->generatePrivateKey(),
            );
        }

        $privateKey = openssl_pkey_get_private(
            $this->getFilesystem()->read($this->getPath('account.pem')),
        );
        if ($privateKey === false) {
            throw new RuntimeException('The ACME account key is invalid.');
        }

        $details = openssl_pkey_get_details($privateKey);
        if ($details === false) {
            throw new RuntimeException(
                'The ACME account key could not be read.',
            );
        }

        $this->privateKeyDetails = $details;
    }

    protected function generatePrivateKey(): string
    {
        $options = [
            'private_key_bits' => (int) $this->getOption('key_length', 4096),
            'private_key_type' => OPENSSL_KEYTYPE_RSA,
        ];
        $opensslConfig = $this->opensslConfigPath();
        if ($opensslConfig) {
            $options['config'] = $opensslConfig;
        }

        $randomFile = storage_path('app/private/hospedfree/acme/.rnd');
        putenv('RANDFILE=' . $randomFile);

        $key = openssl_pkey_new($options);
        if ($key === false) {
            throw new RuntimeException(
                'OpenSSL could not generate a private key.',
            );
        }

        $exportOptions = $opensslConfig ? ['config' => $opensslConfig] : [];
        if (!openssl_pkey_export($key, $pem, null, $exportOptions)) {
            throw new RuntimeException(
                'OpenSSL could not export a private key.',
            );
        }

        return $pem;
    }

    private function opensslConfigPath(): ?string
    {
        $configured = trim((string) config('hospedfree.acme.openssl_config'));
        if ($configured !== '') {
            if (!is_file($configured)) {
                throw new RuntimeException(
                    'The configured OpenSSL configuration file does not exist.',
                );
            }

            return $configured;
        }

        $candidates = array_filter([
            getenv('OPENSSL_CONF') ?: null,
            dirname(PHP_BINARY) . '/extras/ssl/openssl.cnf',
            '/etc/ssl/openssl.cnf',
            '/etc/pki/tls/openssl.cnf',
        ]);

        foreach ($candidates as $candidate) {
            if (is_file($candidate)) {
                return $candidate;
            }
        }

        return null;
    }
}
