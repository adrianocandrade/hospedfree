<?php

namespace Common\Settings\Validators\MailCredentials;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Aws\Ses\Exception\SesException;
use Common\CommonServiceProvider;
use Common\Settings\DotEnvEditor;
use Common\Settings\Mail\OutgoingMailConfiguration;
use Common\Settings\Validators\SettingsValidator;
use Exception;
use GuzzleHttp\Exception\ClientException;
use Illuminate\Mail\MailServiceProvider;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class OutgoingMailCredentialsValidator implements SettingsValidator
{
    const KEYS = [
        'mail_mailer',
        'mail_fallback_mailer',
        'mail_from_address',
        'mail_from_name',
        'mail_host',
        'mail_username',
        'mail_password',
        'mail_port',
        'mail_encryption', // SMTP
        'mailgun_domain',
        'mailgun_secret', // Mailgun
        'mailgun_endpoint',
        'ses_key',
        'ses_secret', // Amazon SES
        'ses_region',
        'postmark_token',
        'resend_api_key',
    ];

    public function fails($values)
    {
        $selection = $this->setConfigDynamically($values);
        $mailer = $selection['default'];

        foreach (
            array_unique([...$selection['failover_mailers'], $mailer])
            as $configuredMailer
        ) {
            Mail::purge($configuredMailer);
        }

        try {
            Mail::mailer($mailer)
                ->to(Auth::user()->email)
                ->send(new MailCredentialsMailable($selection['primary']));
        } catch (Exception $e) {
            app(DotEnvEditor::class)->write(['MAIL_SETUP' => false]);
            return $this->getErrorMessage($e, $mailer);
        }

        app(DotEnvEditor::class)->write(['MAIL_SETUP' => true]);
    }

    private function setConfigDynamically(array $settings): array
    {
        foreach ($settings as $key => $value) {
            if ($key === 'mail_mailer' || $key === 'mail_fallback_mailer') {
                continue;
            }

            if ($key === 'resend_api_key') {
                config()->set('services.resend.key', $value);
                continue;
            }

            if ($key === 'postmark_token') {
                config()->set('services.postmark.key', $value);
                continue;
            }

            //mail_host => mail.host
            $key = str_replace('_', '.', $key);

            // "mail.*" credentials go into "mail.php" config
            // file, other credentials go into "services.php"
            if ($key === 'mail.mailer') {
                $key = 'mail.default';
            } elseif ($key === 'mail.from.address') {
                $key = 'mail.from.address';
            } elseif ($key === 'mail.from.name') {
                $key = 'mail.from.name';
            } elseif (!Str::startsWith($key, 'mail.')) {
                $key = "services.$key";
            } else {
                $key = str_replace('mail.', 'mail.mailers.smtp.', $key);
            }

            config()->set($key, $value);
        }

        $selection = OutgoingMailConfiguration::resolve(
            $settings['mail_mailer'] ?? config('mail.primary'),
            array_key_exists('mail_fallback_mailer', $settings)
                ? $settings['mail_fallback_mailer']
                : config('mail.fallback'),
        );

        config()->set([
            'mail.primary' => $selection['primary'],
            'mail.fallback' => $selection['fallback'],
            'mail.default' => $selection['default'],
            'mail.mailers.failover.mailers' => $selection['failover_mailers'],
        ]);

        // make sure laravel uses newly set config
        (new MailServiceProvider(app()))->register();
        (new CommonServiceProvider(app()))->registerCustomMailDrivers();

        return $selection;
    }

    /**
     * @param Exception|ClientException $e
     * @return array
     */
    private function getErrorMessage(Exception $e, string $mailer): array
    {
        $message = null;
        if ($mailer === 'smtp') {
            $message = $this->getSmtpMessage($e);
        } elseif ($mailer === 'mailgun' && $e instanceof ClientException) {
            $message = $this->getMailgunMessage($e);
        } elseif ($mailer === 'ses' && $e instanceof SesException) {
            $message = $this->getSesMessage($e);
        } elseif ($mailer === 'resend') {
            $message = $this->getResendMessage($e);
        }

        return $message ?: $this->getDefaultMessage($e, $mailer);
    }

    private function getSesMessage(SesException $e)
    {
        return ['mail_group' => $e->getAwsErrorMessage()];
    }

    private function getMailgunMessage(ClientException $e)
    {
        $originalContents = $e->getResponse()->getBody()->getContents();
        $errResponse = json_decode($originalContents, true);
        if (is_null($errResponse) && is_string($originalContents)) {
            $errResponse = $originalContents;
        }
        $message = strtolower(Arr::get($errResponse, 'message', $errResponse));

        if (Str::contains($message, 'domain not found')) {
            return [
                'server.mailgun_domain' => 'This mailgun domain is not valid.',
            ];
        } elseif (Str::contains($message, 'forbidden')) {
            return [
                'server.mailgun_secret' => 'This mailgun API Key is not valid.',
            ];
        }

        return [
            'mail_group' =>
                'Could not validate mailgun credentials. Please double check them.',
        ];
    }

    private function getSmtpMessage(Exception $e): ?array
    {
        if (Str::contains($e->getMessage(), 'Connection timed out #110')) {
            return [
                'mail_group' =>
                    'Connection to mail server timed out. This usually indicates incorrect mail credentials. Please double check them.',
            ];
        }

        return null;
    }

    private function getResendMessage(Exception $e): array
    {
        $message = strtolower($e->getMessage());

        if (Str::contains($message, ['api key', 'unauthorized', 'forbidden'])) {
            return [
                'server.resend_api_key' =>
                    'This Resend API key could not be validated.',
            ];
        }

        if (Str::contains($message, ['domain is not verified', 'sender'])) {
            return [
                'server.mail_from_address' =>
                    'Resend is not authorized to use this sender address. Verify its domain in Resend first.',
            ];
        }

        return [
            'mail_group' =>
                'Could not validate Resend credentials. Please check the API key and sender domain.',
        ];
    }

    private function getDefaultMessage(Exception $e, string $mailer): array
    {
        return [
            'mail_group' => "Could not validate {$mailer} mail credentials: {$e->getMessage()}",
        ];
    }
}
