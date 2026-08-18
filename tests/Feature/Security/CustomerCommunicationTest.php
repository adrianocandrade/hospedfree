<?php

namespace Tests\Feature\Security;

use App\Hosting\Enums\HostingAccountNotificationType;
use App\Hosting\Notifications\HostingAccountNotification;
use App\Models\User;
use App\Security\Controllers\CustomerCommunicationsController;
use App\Security\Controllers\CustomerSecurityEventsController;
use App\Security\Controllers\EmailChangeController;
use App\Security\CustomerCommunicationSubscriber;
use App\Security\Models\CustomerCommunication;
use App\Security\Models\CustomerSecurityEvent;
use App\Security\Notifications\EmailChangedNotice;
use Common\Auth\Notifications\VerifyEmailWithOtp;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Notifications\Events\NotificationSending;
use Illuminate\Notifications\Events\NotificationSent;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Illuminate\Support\Str;
use Tests\TestCase;

class CustomerCommunicationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');
        DB::reconnect('sqlite');

        Schema::create('users', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('pending_email')->nullable();
            $table->string('pending_email_verification_hash')->nullable();
            $table->timestamp('pending_email_requested_at')->nullable();
            $table->timestamps();
        });
        Schema::create('customer_communications', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedInteger('user_id')->index();
            $table->uuid('notification_id')->nullable()->index();
            $table->string('notification_type');
            $table->string('kind', 120)->index();
            $table->string('channel', 32)->default('mail')->index();
            $table->string('status', 32)->default('sending')->index();
            $table->string('subject')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamps();
            $table->unique(['notification_id', 'user_id', 'channel']);
        });
        Schema::create('customer_security_events', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedInteger('user_id')->index();
            $table->string('event', 80)->index();
            $table->string('ip_address', 80)->nullable();
            $table->timestamp('created_at')->nullable();
        });
        Schema::create('personal_access_tokens', function (Blueprint $table): void {
            $table->id();
            $table->string('tokenable_type');
            $table->unsignedInteger('tokenable_id');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
        Schema::create('user_sessions', function (Blueprint $table): void {
            $table->id();
            $table->unsignedInteger('user_id')->index();
            $table->string('browser')->nullable();
            $table->string('platform')->nullable();
            $table->string('device')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->timestamps();
        });
    }

    public function test_it_records_only_safe_customer_mail_metadata(): void
    {
        $user = $this->user('cliente@example.test');
        $notification = new VerifyEmailWithOtp('918273');
        $notification->id = (string) Str::uuid();
        $subscriber = app(CustomerCommunicationSubscriber::class);

        $subscriber->sending(new NotificationSending($user, $notification, 'mail'));
        $subscriber->sent(new NotificationSent($user, $notification, 'mail'));

        $record = CustomerCommunication::query()->sole();
        $this->assertSame($user->id, $record->user_id);
        $this->assertSame('security.verification_code', $record->kind);
        $this->assertSame('sent', $record->status);
        $this->assertNotNull($record->sent_at);
        $this->assertStringNotContainsString('918273', $record->subject);
        $this->assertArrayNotHasKey('notification_type', $record->toArray());
    }

    public function test_customer_history_is_scoped_to_the_authenticated_user(): void
    {
        $owner = $this->user('owner@example.test');
        $other = $this->user('other@example.test');
        $subscriber = app(CustomerCommunicationSubscriber::class);

        foreach ([$owner, $other] as $index => $user) {
            $notification = new HostingAccountNotification(
                HostingAccountNotificationType::Ready,
                $index + 1,
                "site-{$index}.hsite.top",
                'Hospedagem Free',
            );
            $notification->id = (string) Str::uuid();
            $subscriber->sent(new NotificationSent($user, $notification, 'mail'));
        }
        $ownerCommunication = CustomerCommunication::query()
            ->where('user_id', $owner->id)
            ->sole();

        $request = Request::create('/api/v1/account/communications');
        $request->setUserResolver(fn() => $owner);
        $response = app(CustomerCommunicationsController::class)($request)
            ->response()
            ->getData(true);

        $this->assertCount(1, $response['data']);
        $this->assertSame($ownerCommunication->id, $response['data'][0]['id']);
        $this->assertStringNotContainsString('site-1.hsite.top', json_encode($response));
    }

    public function test_unrelated_legacy_notifications_are_not_added_to_customer_history(): void
    {
        $user = $this->user('legacy@example.test');
        $notification = new class extends Notification {};
        $notification->id = (string) Str::uuid();

        app(CustomerCommunicationSubscriber::class)->sending(
            new NotificationSending($user, $notification, 'mail'),
        );

        $this->assertDatabaseCount('customer_communications', 0);
    }

    public function test_email_change_sent_to_pending_address_is_linked_to_the_user_safely(): void
    {
        NotificationFacade::fake();
        $user = $this->user('current@example.test');
        $request = Request::create('/api/v1/account/email-change', 'POST', [
            'email' => 'new@example.test',
            'current_password' => 'password',
        ]);
        $request->setUserResolver(fn() => $user);

        app(EmailChangeController::class)->requestChange($request);

        $record = CustomerCommunication::query()->sole();
        $this->assertSame($user->id, $record->user_id);
        $this->assertSame('security.email_change', $record->kind);
        $this->assertSame('sent', $record->status);
        $this->assertNotEmpty($user->pending_email_verification_hash);
        $this->assertStringNotContainsString('new@example.test', (string) $record->subject);
        $this->assertDatabaseHas('customer_security_events', [
            'user_id' => $user->id,
            'event' => 'email_change_requested',
        ]);
    }

    public function test_confirmed_email_change_notifies_the_previous_address_without_exposing_the_new_one(): void
    {
        NotificationFacade::fake();
        $user = $this->user('previous@example.test');
        $user->forceFill([
            'pending_email' => 'new@example.test',
            'pending_email_verification_hash' => bcrypt('918273'),
            'pending_email_requested_at' => now(),
        ])->save();
        $request = Request::create('/api/v1/account/email-change/confirm', 'POST', [
            'code' => '918273',
        ]);
        $request->server->set('REMOTE_ADDR', '203.0.113.42');
        $request->setUserResolver(fn() => $user);

        app(EmailChangeController::class)->confirm($request);

        NotificationFacade::assertSentOnDemand(
            EmailChangedNotice::class,
            fn($notification, $channels, $notifiable) =>
                $notifiable->routes['mail'] === 'previous@example.test' &&
                !str_contains(
                    $notification->toMail($notifiable)->render(),
                    'new@example.test',
                ),
        );
        $this->assertSame('new@example.test', $user->fresh()->email);
        $this->assertDatabaseHas('customer_security_events', [
            'user_id' => $user->id,
            'event' => 'email_changed',
            'ip_address' => '203.0.113.xxx',
        ]);
        $this->assertDatabaseHas('customer_communications', [
            'user_id' => $user->id,
            'kind' => 'security.email_changed_notice',
            'status' => 'sent',
        ]);
    }

    public function test_security_event_history_is_scoped_and_contains_only_safe_fields(): void
    {
        $owner = $this->user('security-owner@example.test');
        $other = $this->user('security-other@example.test');
        CustomerSecurityEvent::query()->create([
            'uuid' => (string) Str::uuid7(),
            'user_id' => $owner->id,
            'event' => 'password_changed',
            'ip_address' => '198.51.100.xxx',
        ]);
        CustomerSecurityEvent::query()->create([
            'uuid' => (string) Str::uuid7(),
            'user_id' => $other->id,
            'event' => 'login_succeeded',
            'ip_address' => '203.0.113.xxx',
        ]);
        $request = Request::create('/api/v1/account/security-events');
        $request->setUserResolver(fn() => $owner);

        $response = app(CustomerSecurityEventsController::class)($request)
            ->response()
            ->getData(true);

        $this->assertCount(1, $response['data']);
        $this->assertSame('password_changed', $response['data'][0]['event']);
        $this->assertEqualsCanonicalizing(
            ['id', 'event', 'ip_address', 'created_at'],
            array_keys($response['data'][0]),
        );
        $this->assertStringNotContainsString('203.0.113', json_encode($response));
    }

    private function user(string $email): User
    {
        return User::withoutEvents(fn() => User::create([
            'name' => 'Cliente',
            'email' => $email,
            'email_verified_at' => now(),
            'password' => bcrypt('password'),
        ]));
    }
}
