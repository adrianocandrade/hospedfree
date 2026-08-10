<?php

namespace App\Links\Actions;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class FetchSafeRemoteHtml
{
    public const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;

    private const MAX_REDIRECTS = 3;

    /**
     * @return array{
     *   ok: bool,
     *   reason: 'ok'|'unsafe'|'network'|'http_error'|'blocked'|'not_html'|'too_large',
     *   final_url: string,
     *   content_type: string|null,
     *   body: string|null
     * }
     */
    public function execute(
        string $url,
        int $maxBytes = self::DEFAULT_MAX_BYTES,
    ): array {
        $currentUrl = $url;
        $deadline = microtime(true) + 8;

        for ($redirects = 0; $redirects <= self::MAX_REDIRECTS; $redirects++) {
            $remainingSeconds = $deadline - microtime(true);
            if ($remainingSeconds <= 0) {
                return $this->failure('network', $currentUrl);
            }

            $target = $this->inspectUrl($currentUrl);
            if (!$target) {
                return $this->failure('unsafe', $currentUrl);
            }

            try {
                $response = $this->request(
                    $currentUrl,
                    $target,
                    $maxBytes,
                    $remainingSeconds,
                );
            } catch (RuntimeException $exception) {
                return $this->failure(
                    $exception->getMessage() === 'remote_body_too_large'
                        ? 'too_large'
                        : 'network',
                    $currentUrl,
                );
            } catch (\Throwable) {
                return $this->failure('network', $currentUrl);
            }

            if ($response->redirect()) {
                $location = $response->header('location');
                if (
                    !is_string($location) ||
                    $location === '' ||
                    $redirects === self::MAX_REDIRECTS
                ) {
                    return $this->failure('http_error', $currentUrl);
                }

                $currentUrl =
                    $this->absoluteHttpUrl($location, $currentUrl) ?? '';

                continue;
            }

            if (in_array($response->status(), [401, 403, 429], true)) {
                return $this->failure('blocked', $currentUrl);
            }

            if (!$response->successful()) {
                return $this->failure('http_error', $currentUrl);
            }

            $contentType = Str::lower(
                trim(
                    Str::before(
                        (string) $response->header('content-type'),
                        ';',
                    ),
                ),
            );
            if (
                !in_array(
                    $contentType,
                    ['text/html', 'application/xhtml+xml'],
                    true,
                )
            ) {
                return $this->failure(
                    'not_html',
                    $currentUrl,
                    $contentType ?: null,
                );
            }

            $contentLength = (int) ($response->header('content-length') ?? 0);
            if ($contentLength > $maxBytes) {
                return $this->failure('too_large', $currentUrl, $contentType);
            }

            $body = $response->body();
            if (strlen($body) > $maxBytes) {
                return $this->failure('too_large', $currentUrl, $contentType);
            }

            return [
                'ok' => true,
                'reason' => 'ok',
                'final_url' => $currentUrl,
                'content_type' => $contentType,
                'body' => $body,
            ];
        }

        return $this->failure('http_error', $currentUrl);
    }

    /**
     * @return array{host: string, port: int, ips: list<string>}|null
     */
    public function inspectUrl(string $url): ?array
    {
        $parts = parse_url($url);
        if (!is_array($parts)) {
            return null;
        }

        $scheme = Str::lower((string) ($parts['scheme'] ?? ''));
        $host = Str::lower(rtrim((string) ($parts['host'] ?? ''), '.'));
        if (
            !in_array($scheme, ['http', 'https'], true) ||
            $host === '' ||
            isset($parts['user']) ||
            isset($parts['pass'])
        ) {
            return null;
        }

        if (
            $host === 'localhost' ||
            Str::endsWith($host, [
                '.localhost',
                '.local',
                '.internal',
                '.test',
                '.invalid',
            ])
        ) {
            return null;
        }

        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return $this->isPublicIp($host)
                ? [
                    'host' => $host,
                    'port' => $this->port($scheme, $parts),
                    'ips' => [$host],
                ]
                : null;
        }

        $records = $this->resolveHostRecords($host);
        if (!is_array($records) || $records === []) {
            return null;
        }

        $ips = [];
        foreach ($records as $record) {
            $ip = $record['ip'] ?? ($record['ipv6'] ?? null);
            if (!is_string($ip) || !$this->isPublicIp($ip)) {
                return null;
            }
            $ips[] = $ip;
        }

        $ips = array_values(array_unique($ips));

        return $ips === []
            ? null
            : [
                'host' => $host,
                'port' => $this->port($scheme, $parts),
                'ips' => $ips,
            ];
    }

    protected function resolveHostRecords(string $host): array
    {
        $records = @dns_get_record($host, DNS_A | DNS_AAAA);

        return is_array($records) ? $records : [];
    }

    /**
     * @param array{host: string, port: int, ips: list<string>} $target
     */
    private function request(
        string $url,
        array $target,
        int $maxBytes,
        float $timeoutSeconds,
    ): Response {
        $options = [
            'allow_redirects' => false,
            'progress' => function (
                int $downloadTotal,
                int $downloadedBytes,
                int $uploadTotal,
                int $uploadedBytes,
            ) use ($maxBytes): void {
                if (
                    $downloadTotal > $maxBytes ||
                    $downloadedBytes > $maxBytes
                ) {
                    throw new RuntimeException('remote_body_too_large');
                }
            },
        ];

        if (defined('CURLOPT_RESOLVE')) {
            $options['curl'] = [
                CURLOPT_RESOLVE => array_map(
                    fn(string $ip) => sprintf(
                        '%s:%d:%s',
                        $target['host'],
                        $target['port'],
                        str_contains($ip, ':') ? "[$ip]" : $ip,
                    ),
                    $target['ips'],
                ),
            ];
        }

        return Http::connectTimeout(min(3, $timeoutSeconds))
            ->timeout($timeoutSeconds)
            ->accept('text/html,application/xhtml+xml')
            ->withUserAgent($this->userAgent())
            ->withOptions($options)
            ->get($url);
    }

    private function port(string $scheme, array $parts): int
    {
        return isset($parts['port'])
            ? (int) $parts['port']
            : ($scheme === 'https'
                ? 443
                : 80);
    }

    private function isPublicIp(string $ip): bool
    {
        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE,
        ) !== false;
    }

    private function absoluteHttpUrl(string $value, string $baseUrl): ?string
    {
        $value = trim($value);
        if ($value === '') {
            return null;
        }

        if (Str::startsWith($value, '//')) {
            $value = 'https:' . $value;
        } elseif (!preg_match('/^https?:\/\//i', $value)) {
            $base = parse_url($baseUrl);
            if (!is_array($base) || empty($base['host'])) {
                return null;
            }

            $origin =
                ($base['scheme'] ?? 'https') .
                '://' .
                $base['host'] .
                (isset($base['port']) ? ':' . $base['port'] : '');

            if (Str::startsWith($value, '/')) {
                $value = $origin . $value;
            } else {
                $path = (string) ($base['path'] ?? '/');
                $directory = rtrim(str_replace('\\', '/', dirname($path)), '/');
                $value =
                    $origin .
                    ($directory === '' || $directory === '.'
                        ? '/'
                        : $directory . '/') .
                    $value;
            }
        }

        return filter_var($value, FILTER_VALIDATE_URL) ? $value : null;
    }

    private function userAgent(): string
    {
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36 MeuLinkBioMetadata/1.0';
    }

    /**
     * @return array{
     *   ok: false,
     *   reason: 'unsafe'|'network'|'http_error'|'blocked'|'not_html'|'too_large',
     *   final_url: string,
     *   content_type: string|null,
     *   body: null
     * }
     */
    private function failure(
        string $reason,
        string $url,
        ?string $contentType = null,
    ): array {
        return [
            'ok' => false,
            'reason' => $reason,
            'final_url' => $url,
            'content_type' => $contentType,
            'body' => null,
        ];
    }
}
