<?php

namespace Common\Core\Install;

use Common\Pages\CustomPage;

class CreateDefaultCustomPages
{
    public function execute(): void
    {
        CustomPage::firstOrCreate(
            [
                'slug' => 'privacy-policy',
            ],
            [
                'title' => 'Política de Privacidade',
                'slug' => 'privacy-policy',
                'body' => $this->replacePlaceholders(
                    file_get_contents(
                        app('path.common') .
                            '/resources/defaults/privacy-policy.html',
                    ),
                ),
                'meta' => [
                    'description' => 'Entenda como a HospedFree coleta, usa, protege e compartilha dados pessoais para prestar o serviço de hospedagem.',
                ],
                'type' => 'default',
            ],
        );

        CustomPage::firstOrCreate(
            [
                'slug' => 'terms-of-service',
            ],
            [
                'title' => 'Termos de Uso',
                'slug' => 'terms-of-service',
                'body' => $this->replacePlaceholders(
                    file_get_contents(
                        app('path.common') .
                            '/resources/defaults/terms-of-service.html',
                    ),
                ),
                'meta' => [
                    'description' => 'Conheça as regras de uso da hospedagem gratuita e dos planos pagos da HospedFree.',
                ],
                'type' => 'default',
            ],
        );

        CustomPage::firstOrCreate(
            [
                'slug' => 'cookies',
            ],
            [
                'title' => 'Política de Cookies',
                'slug' => 'cookies',
                'body' => file_get_contents(
                    app('path.common') . '/resources/defaults/cookies.html',
                ),
                'meta' => [
                    'description' => 'Saiba quais cookies a HospedFree usa e controle suas preferências de analytics.',
                ],
                'type' => 'default',
            ],
        );

        CustomPage::firstOrCreate(
            [
                'slug' => 'about-us',
            ],
            [
                'title' => 'Example About Us',
                'slug' => 'about-us',
                'body' => file_get_contents(
                    app('path.common') . '/resources/defaults/lorem.html',
                ),
                'type' => 'default',
            ],
        );
    }

    protected function replacePlaceholders(string $text): string
    {
        return str_replace(
            [
                '[Website Name]',
                '[Website URL]',
                '[Contact Email]',
                '[Your Country/State]',
            ],
            [
                config('app.name'),
                url('/'),
                settings('mail.contact_page_address'),
                'Brasil',
            ],
            $text,
        );
    }
}
