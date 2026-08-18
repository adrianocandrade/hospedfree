<?php

namespace Tests\Unit;

use Common\Auth\Models\Oauth;
use Common\Settings\Manager\RedactSensitiveSettings;
use Common\Settings\Validators\GithubLoginValidator;
use Common\Settings\Validators\TwitterLoginValidator;
use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use ReflectionMethod;
use RuntimeException;
use Tests\TestCase;

class SocialAuthenticationConfigurationTest extends TestCase
{
    public function test_github_is_available_as_a_social_login_provider(): void
    {
        Socialite::swap(
            new FakeSocialiteManager(
                'github',
                new FakeSocialiteDriver(
                    redirectResponse: new RedirectResponse(
                        'https://github.com/login/oauth/authorize',
                    ),
                ),
            ),
        );

        $response = app(Oauth::class)->redirect('github');

        $this->assertSame(
            'https://github.com/login/oauth/authorize',
            $response->getTargetUrl(),
        );
        $this->assertSame(
            rtrim((string) config('app.url'), '/') .
                '/secure/auth/social/github/callback',
            config('services.github.redirect'),
        );
    }

    public function test_github_credentials_accept_the_expected_invalid_code_response(): void
    {
        Socialite::swap(
            new FakeSocialiteManager(
                'github',
                new FakeSocialiteDriver(
                    tokenResponse: [
                        'error' => 'bad_verification_code',
                        'error_description' =>
                            'The code passed is incorrect or expired.',
                    ],
                ),
            ),
        );

        $result = app(GithubLoginValidator::class)->fails([
            'github_id' => 'github-client-id',
            'github_secret' => 'github-client-secret',
        ]);

        $this->assertNull($result);
        $this->assertSame(
            'github-client-id',
            config('services.github.client_id'),
        );
        $this->assertSame(
            'github-client-secret',
            config('services.github.client_secret'),
        );
    }

    public function test_github_credentials_reject_provider_authentication_errors(): void
    {
        Socialite::swap(
            new FakeSocialiteManager(
                'github',
                new FakeSocialiteDriver(
                    tokenResponse: [
                        'error' => 'incorrect_client_credentials',
                        'error_description' => 'Incorrect client credentials',
                    ],
                ),
            ),
        );

        $result = app(GithubLoginValidator::class)->fails([
            'github_id' => 'invalid-id',
            'github_secret' => 'invalid-secret',
        ]);

        $this->assertSame(
            ['github_group' => 'As credenciais do GitHub não são válidas.'],
            $result,
        );
    }

    public function test_twitter_oauth_one_error_is_replaced_with_actionable_guidance(): void
    {
        Socialite::swap(
            new FakeSocialiteManager(
                'twitter',
                new FakeSocialiteDriver(
                    redirectException: new RuntimeException(
                        'Received HTTP status code [401] with message code 32.',
                    ),
                ),
            ),
        );

        $result = app(TwitterLoginValidator::class)->fails([
            'twitter_id' => 'consumer-key',
            'twitter_secret' => 'consumer-secret',
        ]);

        $this->assertStringContainsString(
            'OAuth 1.0a',
            $result['twitter_group'],
        );
        $this->assertStringContainsString('API Key', $result['twitter_group']);
    }

    public function test_github_access_tokens_are_not_persisted_for_login_only(): void
    {
        $profile = (new SocialiteUser())
            ->map([
                'id' => 123,
                'name' => 'HospedFree Test',
                'email' => 'social@example.test',
            ])
            ->setToken('temporary-github-token')
            ->setRefreshToken('temporary-refresh-token')
            ->setExpiresIn(3600);

        $method = new ReflectionMethod(
            Oauth::class,
            'transformSocialProfileData',
        );

        $payload = $method->invoke(app(Oauth::class), 'github', $profile, 1);

        $this->assertNull($payload['access_token']);
        $this->assertNull($payload['refresh_token']);
        $this->assertNull($payload['access_expires_at']);
    }

    public function test_github_credentials_are_redacted_from_admin_responses(): void
    {
        $settings = app(RedactSensitiveSettings::class)->execute([
            'server' => [
                'github_id' => 'github-client-id',
                'github_secret' => 'github-client-secret',
            ],
            'client' => [],
        ]);

        $this->assertSame('***********', $settings['server']['github_id']);
        $this->assertSame('***********', $settings['server']['github_secret']);
    }
}

class FakeSocialiteManager
{
    public function __construct(
        private readonly string $provider,
        private readonly FakeSocialiteDriver $driver,
    ) {}

    public function driver(string $provider): FakeSocialiteDriver
    {
        if ($provider !== $this->provider) {
            throw new RuntimeException("Unexpected social provider: $provider");
        }

        return $this->driver;
    }

    public function with(string $provider): FakeSocialiteDriver
    {
        return $this->driver($provider);
    }
}

class FakeSocialiteDriver
{
    public function __construct(
        private readonly ?RedirectResponse $redirectResponse = null,
        private readonly ?array $tokenResponse = null,
        private readonly ?RuntimeException $redirectException = null,
    ) {}

    public function redirect(): RedirectResponse
    {
        if ($this->redirectException) {
            throw $this->redirectException;
        }

        return $this->redirectResponse ?? new RedirectResponse('/');
    }

    public function getAccessTokenResponse(string $code): array
    {
        return $this->tokenResponse ?? [];
    }
}
