<?php

namespace Tests\Unit;

use App\Mail\TestEmailTemplate;
use App\Mail\TestEmailTemplateSender;
use App\Models\User;
use Illuminate\Mail\Transport\ArrayTransport;
use Illuminate\Support\Facades\Mail;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class TestEmailTemplateSenderTest extends TestCase
{
    public function test_email_header_embeds_the_configured_brand_logo(): void
    {
        config()->set([
            'mail.default' => 'array',
            'mail.primary' => 'array',
            'mail.mailers.array' => ['transport' => 'array'],
            'mail.from.address' => 'sender@example.com',
            'mail.from.name' => 'HospedFree',
        ]);
        settings()->set('branding.logo_dark', 'images/logo-1.png');
        settings()->set('branding.site_name', 'HospedFree');
        Mail::purge();

        app(TestEmailTemplateSender::class)->send(
            TestEmailTemplate::MailSetup,
            'recipient@example.com',
            new User([
                'name' => 'Admin',
                'email' => 'admin@example.com',
                'language' => 'en',
            ]),
        );

        $message = Mail::mailer('array')
            ->getSymfonyTransport()
            ->messages()
            ->first()
            ->getOriginalMessage();

        $this->assertStringContainsString('<img', $message->getHtmlBody());
        $this->assertStringContainsString('src="cid:', $message->getHtmlBody());
        $this->assertCount(1, $message->getAttachments());
    }

    #[DataProvider('templateProvider')]
    public function test_each_template_renders_and_sends_with_sample_data(
        TestEmailTemplate $template,
    ): void {
        config()->set([
            'mail.default' => 'array',
            'mail.primary' => 'array',
            'mail.mailers.array' => ['transport' => 'array'],
            'mail.from.address' => 'sender@example.com',
            'mail.from.name' => 'MeuLinkBio',
        ]);
        Mail::purge();

        $actor = new User([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'language' => 'en',
        ]);

        app(TestEmailTemplateSender::class)->send(
            $template,
            'recipient@example.com',
            $actor,
        );

        $transport = Mail::mailer('array')->getSymfonyTransport();

        $this->assertInstanceOf(ArrayTransport::class, $transport);
        $this->assertCount(1, $transport->messages());

        $message = $transport->messages()->first()->getOriginalMessage();
        $this->assertStringStartsWith('[TEST] ', $message->getSubject());
        $this->assertSame(
            'recipient@example.com',
            $message->getTo()[0]->getAddress(),
        );
    }

    public static function templateProvider(): array
    {
        return array_map(
            fn(TestEmailTemplate $template) => [$template],
            TestEmailTemplate::cases(),
        );
    }
}
