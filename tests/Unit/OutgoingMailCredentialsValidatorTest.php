<?php

namespace Tests\Unit;

use Common\Settings\DotEnvEditor;
use Common\Settings\Validators\MailCredentials\OutgoingMailCredentialsValidator;
use Illuminate\Auth\GenericUser;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class OutgoingMailCredentialsValidatorTest extends TestCase
{
    public function test_fallback_is_not_exercised_when_primary_delivery_succeeds(): void
    {
        $dotEnvEditor = new class extends DotEnvEditor {
            public array $writes = [];

            public function write(array|Collection $values = []): void
            {
                $this->writes[] = $values;
            }
        };

        $this->app->instance(DotEnvEditor::class, $dotEnvEditor);
        Auth::setUser(new GenericUser(['email' => 'admin@example.com']));

        config()->set('mail.mailers.sendmail.path', '/usr/sbin/sendmail -bs -i');

        $result = app(OutgoingMailCredentialsValidator::class)->fails([
            'mail_mailer' => 'array',
            'mail_fallback_mailer' => 'sendmail',
            'mail_from_address' => 'admin@example.com',
            'mail_from_name' => 'MeuLinkBio',
        ]);

        $this->assertNull($result);
        $this->assertSame([['MAIL_SETUP' => true]], $dotEnvEditor->writes);
    }
}
