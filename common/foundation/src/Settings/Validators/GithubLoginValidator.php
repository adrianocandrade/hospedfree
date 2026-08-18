<?php

namespace Common\Settings\Validators;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GithubLoginValidator implements SettingsValidator
{
    public const KEYS = ['github_id', 'github_secret'];

    public function fails($values): ?array
    {
        $this->setConfigDynamically($values);

        try {
            $response = Socialite::driver('github')->getAccessTokenResponse(
                Str::random(48),
            );
        } catch (Throwable) {
            return $this->getDefaultError();
        }

        // GitHub validates the client credentials before reporting that our
        // intentionally random authorization code is invalid.
        if (Arr::get($response, 'error') === 'bad_verification_code') {
            return null;
        }

        return $this->getDefaultError();
    }

    private function setConfigDynamically(array $settings): void
    {
        if ($githubId = Arr::get($settings, 'github_id')) {
            Config::set('services.github.client_id', $githubId);
        }

        if ($githubSecret = Arr::get($settings, 'github_secret')) {
            Config::set('services.github.client_secret', $githubSecret);
        }
    }

    private function getDefaultError(): array
    {
        return [
            'github_group' => 'As credenciais do GitHub não são válidas.',
        ];
    }
}
