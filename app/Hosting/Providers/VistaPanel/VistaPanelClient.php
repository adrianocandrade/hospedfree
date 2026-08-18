<?php

namespace App\Hosting\Providers\VistaPanel;

use App\Hosting\Data\PanelAccountCredentialsData;
use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Cookie\CookieJar;
use GuzzleHttp\Cookie\SetCookie;
use GuzzleHttp\Psr7\Uri;
use GuzzleHttp\Psr7\UriResolver;
use Psr\Http\Message\ResponseInterface;

final class VistaPanelClient
{
    private const MAX_HTML_BYTES = 5_242_880;

    public function __construct(private ?ClientInterface $httpClient = null) {}

    public function isConfigured(): bool
    {
        $url = config('hospedfree.vistapanel.cpanel_url');

        return (bool) config('hospedfree.vistapanel.enabled') &&
            is_string($url) &&
            parse_url($url, PHP_URL_SCHEME) === 'https' &&
            filled(parse_url($url, PHP_URL_HOST));
    }

    public function authenticate(
        PanelAccountCredentialsData $account,
    ): VistaPanelSession {
        if (!$this->isConfigured()) {
            throw new VistaPanelException('panel_not_configured');
        }

        if ($account->username === '' || $account->password === '') {
            throw new VistaPanelException('panel_credentials_unavailable');
        }

        $cookies = new CookieJar();
        $response = $this->request('POST', '/login.php', [
            'cookies' => $cookies,
            'form_params' => [
                'uname' => $account->username,
                'passwd' => $account->password,
                'theme' => 'PaperLantern',
                'seeesurf' => (string) config(
                    'hospedfree.vistapanel.login_seed',
                    '567811917014474432',
                ),
            ],
        ]);

        $this->captureResponseCookies($response, $cookies);
        $body = $this->boundedBody($response);
        $location = $response->getHeaderLine('Location');

        if (
            str_contains($body, 'index_pl_sus.php') ||
            str_contains($location, 'index_pl_sus.php')
        ) {
            throw new VistaPanelException('panel_account_suspended');
        }

        $this->assertStatus($response);

        if (
            $cookies->count() === 0 ||
            (!str_contains($body, 'panel/indexpl.php') &&
                !str_contains($location, 'panel/indexpl.php'))
        ) {
            throw new VistaPanelException('panel_invalid_credentials');
        }

        $home = $this->request('GET', '/panel/indexpl.php', [
            'cookies' => $cookies,
        ]);
        $this->assertSuccessfulHtml($home);
        $html = $this->boundedBody($home);
        $token = $this->extractSessionToken($html);

        if ($token === null) {
            $failureCode = $this->tokenFailureCode($html);

            if ($failureCode !== null) {
                throw new VistaPanelException($failureCode);
            }
        }

        return new VistaPanelSession($cookies, $token, $html);
    }

    /** @param array<string, scalar> $query */
    public function getOption(
        VistaPanelSession $session,
        string $option,
        array $query = [],
    ): string {
        return $this->optionRequest('GET', $session, $option, $query);
    }

    /**
     * @param array<string, scalar> $query
     * @param array<string, scalar> $form
     */
    public function postOption(
        VistaPanelSession $session,
        string $option,
        array $query,
        array $form,
        bool $includeSessionToken = true,
    ): string {
        return $this->optionRequest(
            'POST',
            $session,
            $option,
            $query,
            $form,
            $includeSessionToken,
        );
    }

    /** @param array<string, scalar> $query */
    public function getOptionRedirect(
        VistaPanelSession $session,
        string $option,
        array $query = [],
    ): string {
        if (!preg_match('/^[a-z][a-z0-9_-]{0,40}$/', $option)) {
            throw new VistaPanelException('panel_option_invalid');
        }

        $query = ['option' => $option, ...$query];
        if ($session->token !== null) {
            $query['ttt'] = $session->token;
        }
        $response = $this->request(
            'GET',
            '/panel/indexpl.php?' .
                http_build_query($query, '', '&', PHP_QUERY_RFC3986),
            ['cookies' => $session->cookies],
        );
        $this->boundedBody($response);

        if (
            !in_array(
                $response->getStatusCode(),
                [301, 302, 303, 307, 308],
                true,
            )
        ) {
            throw new VistaPanelException('panel_redirect_missing');
        }

        $location = trim($response->getHeaderLine('Location'));
        if ($location === '' || strlen($location) > 2048) {
            throw new VistaPanelException('panel_redirect_invalid');
        }

        try {
            return (string) UriResolver::resolve(
                new Uri($this->baseUrl() . '/'),
                new Uri($location),
            );
        } catch (\Throwable) {
            throw new VistaPanelException('panel_redirect_invalid');
        }
    }

    /**
     * Consume one external installer handoff without exposing its URL to the
     * browser. The caller must validate both the input and returned URL.
     */
    public function followExternalRedirect(string $url): string
    {
        $response = $this->client()->request('GET', $url, [
            'allow_redirects' => false,
            'connect_timeout' => (int) config(
                'hospedfree.provider.connect_timeout_seconds',
                5,
            ),
            'timeout' => (int) config(
                'hospedfree.provider.timeout_seconds',
                15,
            ),
            'verify' => true,
            'http_errors' => false,
            'headers' => [
                'Accept' =>
                    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'User-Agent' =>
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                    . 'AppleWebKit/537.36 (KHTML, like Gecko) '
                    . 'Chrome/124.0.0.0 Safari/537.36 HospedFree/1.0',
            ],
        ]);
        $this->boundedBody($response);

        if (!$this->isRedirect($response)) {
            throw new VistaPanelException('panel_redirect_missing');
        }

        $location = trim($response->getHeaderLine('Location'));
        if ($location === '' || strlen($location) > 2048) {
            throw new VistaPanelException('panel_redirect_invalid');
        }

        try {
            return (string) UriResolver::resolve(
                new Uri($url),
                new Uri($location),
            );
        } catch (\Throwable) {
            throw new VistaPanelException('panel_redirect_invalid');
        }
    }

    /**
     * @param array<string, scalar> $query
     * @param array<string, scalar> $form
     */
    private function optionRequest(
        string $method,
        VistaPanelSession $session,
        string $option,
        array $query,
        array $form = [],
        bool $includeSessionToken = true,
    ): string {
        if (!preg_match('/^[a-z][a-z0-9_-]{0,40}$/', $option)) {
            throw new VistaPanelException('panel_option_invalid');
        }

        if ($includeSessionToken && $session->token === null) {
            throw new VistaPanelException('panel_token_invalid_response');
        }

        $query = ['option' => $option, ...$query];
        if ($includeSessionToken) {
            $query['ttt'] = $session->token;
        }
        $options = array_filter([
            'cookies' => $session->cookies,
            'form_params' => $form ?: null,
        ]);

        if ($method === 'POST') {
            $options['headers'] = [
                'Origin' => $this->baseUrl(),
                'Referer' => $this->baseUrl()
                    . '/panel/indexpl.php?'
                    . http_build_query(
                        ['option' => $option],
                        '',
                        '&',
                        PHP_QUERY_RFC3986,
                    ),
            ];
        }

        $response = $this->request(
            $method,
            '/panel/indexpl.php?' . http_build_query($query, '', '&', PHP_QUERY_RFC3986),
            $options,
        );

        if ($method === 'POST' && $this->isRedirect($response)) {
            $response = $this->request(
                'GET',
                $this->safePanelRedirectPath($response),
                ['cookies' => $session->cookies],
            );
        }

        $this->assertSuccessfulHtml($response);

        return $this->boundedBody($response);
    }

    private function isRedirect(ResponseInterface $response): bool
    {
        return in_array(
            $response->getStatusCode(),
            [301, 302, 303, 307, 308],
            true,
        );
    }

    private function safePanelRedirectPath(ResponseInterface $response): string
    {
        // VistaPanel commonly confirms form mutations with a 302 back to the
        // option page. Never replay a mutation through a 307/308 redirect.
        if (!in_array($response->getStatusCode(), [301, 302, 303], true)) {
            throw new VistaPanelException('panel_redirect_invalid');
        }

        $location = trim($response->getHeaderLine('Location'));
        if ($location === '' || strlen($location) > 2048) {
            throw new VistaPanelException('panel_redirect_invalid');
        }

        try {
            $base = new Uri($this->baseUrl() . '/');
            $resolved = UriResolver::resolve($base, new Uri($location));
        } catch (\Throwable) {
            throw new VistaPanelException('panel_redirect_invalid');
        }

        if (
            strtolower($resolved->getScheme()) !== strtolower($base->getScheme()) ||
            strtolower($resolved->getHost()) !== strtolower($base->getHost()) ||
            $resolved->getPort() !== $base->getPort() ||
            !str_starts_with($resolved->getPath(), '/panel/')
        ) {
            throw new VistaPanelException('panel_redirect_invalid');
        }

        $path = $resolved->getPath();
        if ($resolved->getQuery() !== '') {
            $path .= '?' . $resolved->getQuery();
        }

        return $path;
    }

    private function request(
        string $method,
        string $path,
        array $options = [],
    ): ResponseInterface {
        return $this->client()->request(
            $method,
            $this->baseUrl() . $path,
            array_replace_recursive(
                [
                    'allow_redirects' => false,
                    'connect_timeout' => (int) config(
                        'hospedfree.provider.connect_timeout_seconds',
                        5,
                    ),
                    'timeout' => (int) config(
                        'hospedfree.provider.timeout_seconds',
                        15,
                    ),
                    'verify' => true,
                    'http_errors' => false,
                    'headers' => [
                        'Accept' =>
                            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        // VistaPanel renders a reduced document for generic API
                        // agents. Use a stable browser-compatible identity like
                        // the reference integration, while keeping the session
                        // fully server-side.
                        'User-Agent' =>
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                            . 'AppleWebKit/537.36 (KHTML, like Gecko) '
                            . 'Chrome/124.0.0.0 Safari/537.36 HospedFree/1.0',
                    ],
                ],
                $options,
            ),
        );
    }

    private function assertSuccessfulHtml(ResponseInterface $response): void
    {
        $this->assertStatus($response);
        $this->boundedBody($response);
    }

    private function assertStatus(ResponseInterface $response): void
    {
        if (
            $response->getStatusCode() >= 500 ||
            $response->getStatusCode() === 429
        ) {
            throw new VistaPanelException('panel_http_error', true);
        }

        if (
            $response->getStatusCode() < 200 ||
            $response->getStatusCode() >= 300
        ) {
            throw new VistaPanelException('panel_invalid_response');
        }
    }

    private function captureResponseCookies(
        ResponseInterface $response,
        CookieJar $cookies,
    ): void {
        $host = (string) parse_url($this->baseUrl(), PHP_URL_HOST);

        foreach ($response->getHeader('Set-Cookie') as $header) {
            $cookie = SetCookie::fromString($header);
            $cookie->setDomain($cookie->getDomain() ?: $host);
            $cookie->setPath($cookie->getPath() ?: '/');
            $cookies->setCookie($cookie);
        }
    }

    private function boundedBody(ResponseInterface $response): string
    {
        $body = (string) $response->getBody();

        if (strlen($body) > self::MAX_HTML_BYTES) {
            throw new VistaPanelException('panel_response_too_large');
        }

        return $body;
    }

    /**
     * VistaPanel currently embeds tool URLs in a JSON object inside the panel
     * document. Older themes emitted regular HTML links. Normalize only the
     * small set of escaping forms used by those two representations and never
     * expose the document outside this server-side client.
     */
    private function extractSessionToken(string $html): ?string
    {
        $normalized = html_entity_decode(
            $html,
            ENT_QUOTES | ENT_HTML5,
            'UTF-8',
        );
        $normalized = str_ireplace(
            ['\\/', '\\u0026', '\\u003d', '\\x26', '\\x3d'],
            ['/', '&', '=', '&', '='],
            $normalized,
        );
        $normalized = rawurldecode($normalized);

        if (
            preg_match(
                '/(?:[?&]|\\b)ttt\s*=\s*["\']?([a-z0-9_-]{1,128})(?![a-z0-9_-])/i',
                $normalized,
                $matches,
            ) === 1
        ) {
            return $matches[1];
        }

        if (
            preg_match(
                '/["\']ttt["\']\s*:\s*["\']?([a-z0-9_-]{1,128})(?![a-z0-9_-])/i',
                $normalized,
                $matches,
            ) === 1
        ) {
            return $matches[1];
        }

        return null;
    }

    private function tokenFailureCode(string $html): ?string
    {
        $lowercase = strtolower($html);

        if (
            str_contains($lowercase, 'name="uname"') ||
            str_contains($lowercase, "name='uname'") ||
            str_contains($lowercase, '/login.php')
        ) {
            return 'panel_session_not_authenticated';
        }

        if (str_contains($lowercase, 'cf-chl-')) {
            return 'panel_security_challenge';
        }

        if (str_contains($lowercase, 'ttt')) {
            return 'panel_token_format_unsupported';
        }

        // Current VistaPanel themes may keep the anti-CSRF token out of the
        // initial document. A tokenless session is only accepted by the
        // redirect-only GET flow; option reads and all mutations still reject
        // it in optionRequest().
        return null;
    }

    private function baseUrl(): string
    {
        return rtrim((string) config('hospedfree.vistapanel.cpanel_url'), '/');
    }

    private function client(): ClientInterface
    {
        return $this->httpClient ??= new GuzzleClient();
    }
}
