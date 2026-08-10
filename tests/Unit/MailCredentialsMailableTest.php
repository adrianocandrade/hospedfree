<?php

namespace Tests\Unit;

use Common\Settings\Validators\MailCredentials\MailCredentialsMailable;
use Tests\TestCase;

class MailCredentialsMailableTest extends TestCase
{
    public function test_it_labels_the_validated_transport_without_overriding_the_laravel_mailer_property(): void
    {
        config()->set('app.name', 'MeuLinkBio');

        $mailable = new MailCredentialsMailable('resend');
        $mailable->build();

        $this->assertNull($mailable->mailer);
        $this->assertSame(
            'MeuLinkBio resend Mail Set Up Successfully!',
            $mailable->subject,
        );
    }
}
