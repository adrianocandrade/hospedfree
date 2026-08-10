<?php

namespace Tests\Feature;

use App\Mail\TestEmailTemplate;
use App\Mail\TestEmailTemplateSender;
use App\Models\User;
use Common\Auth\Middleware\OptionalAuthenticate;
use Common\Auth\Middleware\VerifyApiAccessMiddleware;
use Common\Permissions\Models\Permission;
use Illuminate\Support\Collection;
use Tests\TestCase;

class SendTestEmailTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->app['router']->aliasMiddleware(
            'optionalAuth',
            OptionalAuthenticate::class,
        );
        $this->app['router']->aliasMiddleware(
            'verifyApiAccess',
            VerifyApiAccessMiddleware::class,
        );
    }

    public function test_authorized_admin_can_send_selected_template(): void
    {
        $user = $this->userWithPermissions([
            'api.access',
            'settings.update',
        ]);
        $this->actingAs($user, 'sanctum');

        $sender = new class extends TestEmailTemplateSender {
            public array $calls = [];

            public function send(
                TestEmailTemplate $template,
                string $recipient,
                User $actor,
            ): void {
                $this->calls[] = [$template, $recipient, $actor];
            }
        };
        $this->app->instance(TestEmailTemplateSender::class, $sender);

        $this
            ->postJson('/api/v1/settings/email/send-test', [
                'recipient' => 'recipient@example.com',
                'template' => 'booking_confirmation',
            ])
            ->assertNoContent();

        $this->assertCount(1, $sender->calls);
        $this->assertSame(
            TestEmailTemplate::BookingConfirmation,
            $sender->calls[0][0],
        );
        $this->assertSame('recipient@example.com', $sender->calls[0][1]);
        $this->assertSame($user, $sender->calls[0][2]);
    }

    public function test_request_rejects_invalid_recipient_and_template(): void
    {
        $this->actingAs(
            $this->userWithPermissions(['api.access', 'settings.update']),
            'sanctum',
        );

        $this
            ->postJson('/api/v1/settings/email/send-test', [
                'recipient' => 'not-an-email',
                'template' => 'unknown',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['recipient', 'template']);
    }

    public function test_user_without_settings_permission_cannot_send_test_email(): void
    {
        $this->actingAs(
            $this->userWithPermissions(['api.access']),
            'sanctum',
        );

        $this
            ->postJson('/api/v1/settings/email/send-test', [
                'recipient' => 'recipient@example.com',
                'template' => 'mail_setup',
            ])
            ->assertForbidden();
    }

    private function userWithPermissions(array $names): User
    {
        $user = new User([
            'id' => 1,
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'email_verified_at' => now(),
            'language' => 'en',
        ]);
        $user->exists = true;
        $user->setRelation(
            'permissions',
            new Collection(
                array_map(
                    fn(string $name) => new Permission(['name' => $name]),
                    $names,
                ),
            ),
        );
        $user->setRelation('roles', new Collection());

        return $user;
    }
}
