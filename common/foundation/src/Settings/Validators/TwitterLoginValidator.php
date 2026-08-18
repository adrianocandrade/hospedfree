<?php

namespace Common\Settings\Validators;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class TwitterLoginValidator implements SettingsValidator
{
    public const KEYS = ['twitter_id', 'twitter_secret'];

    public function fails($values): ?array
    {
        $this->setConfigDynamically($values);

        try {
            Socialite::driver('twitter')->redirect();
        } catch (Throwable $e) {
            return $this->getErrorMessage($e);
        }

        return null;
    }

    private function setConfigDynamically(array $settings): void
    {
        if ($twitterId = Arr::get($settings, 'twitter_id')) {
            Config::set('services.twitter.client_id', $twitterId);
        }

        if ($twitterSecret = Arr::get($settings, 'twitter_secret')) {
            Config::set('services.twitter.client_secret', $twitterSecret);
        }
    }

    private function getErrorMessage(Throwable $e): array
    {
        if (
            Str::contains($e->getMessage(), [
                'status code [401]',
                'code":32',
                'code 32',
                'Could not authenticate you',
            ])
        ) {
            return [
                'twitter_group' =>
                    'O X rejeitou as credenciais. Este login usa OAuth 1.0a: informe a API Key (Consumer Key) e a API Key Secret, não o Client ID/Secret do OAuth 2.0. Confirme também se “Sign in with X” está ativo e se a Callback URL cadastrada é exatamente ' .
                    config('services.twitter.redirect') .
                    '.',
            ];
        }

        if (Str::contains($e->getMessage(), 'code="415"')) {
            return [
                'twitter_group' =>
                    'Cadastre exatamente esta Callback URL no aplicativo do X: ' .
                    config('services.twitter.redirect') .
                    '.',
            ];
        }

        return $this->getDefaultError();
    }

    private function getDefaultError(): array
    {
        return [
            'twitter_group' =>
                'Não foi possível validar o login com X. Confirme a API Key e a API Key Secret do OAuth 1.0a, a permissão de leitura e a Callback URL.',
        ];
    }
}
