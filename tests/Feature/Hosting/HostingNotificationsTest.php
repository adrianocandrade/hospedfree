<?php

namespace Tests\Feature\Hosting;

use App\Hosting\Enums\HostingAccountNotificationType;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Models\HostingAccountEvent;
use App\Hosting\Models\HostingPlan;
use App\Hosting\Notifications\HostingAccountNotification;
use App\Hosting\Observers\HostingAccountEventObserver;
use App\Models\User;
use Common\Billing\Models\Product;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class HostingNotificationsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        app()->setLocale('pt-BR');
        config()->set('app.url', 'https://hospedfree.test');
    }

    public function test_password_changed_email_uses_the_global_mail_message_without_credentials(): void
    {
        $user = new User(['name' => 'Adriano']);
        $notification = new HostingAccountNotification(
            HostingAccountNotificationType::PasswordChanged,
            12,
            'site.hsite.top',
        );

        $mail = $notification->toMail($user);
        $payload = $notification->toArray($user);
        $content = json_encode([
            $mail->subject,
            $mail->introLines,
            $mail->outroLines,
            $payload,
        ], JSON_THROW_ON_ERROR);

        $this->assertSame('A senha da sua hospedagem foi alterada', $mail->subject);
        $this->assertSame('https://hospedfree.test/dashboard/hosting/12', $mail->actionUrl);
        $this->assertStringNotContainsString('credential_secret', strtolower($content));
        $this->assertStringNotContainsString('"password":', strtolower($content));
        $this->assertStringNotContainsString('senha:', strtolower($content));
        $this->assertStringNotContainsString('mofh', strtolower($content));
        $this->assertNull($mail->view);
        $this->assertSame('notifications::email', $mail->markdown);
        $this->assertStringContainsString(
            "@component('mail::message')",
            file_get_contents(resource_path('views/vendor/notifications/email.blade.php')),
        );
    }

    public function test_retryable_intermediate_failure_does_not_email_the_customer(): void
    {
        Notification::fake();
        [$user, $account] = $this->accountFixture();
        $event = new HostingAccountEvent([
            'event' => 'status_changed',
            'from_status' => 'provisioning',
            'to_status' => 'failed',
            'metadata' => ['notify_customer' => false],
        ]);
        $event->setRelation('account', $account);

        app(HostingAccountEventObserver::class)->created($event);

        Notification::assertNothingSentTo($user);
    }

    public function test_hosting_events_dispatch_the_expected_customer_notifications(): void
    {
        Notification::fake();
        [$user, $account] = $this->accountFixture();
        $observer = app(HostingAccountEventObserver::class);

        $events = [
            ['status_changed', 'provisioning', 'active', HostingAccountNotificationType::Ready],
            ['status_changed', 'active', 'suspended', HostingAccountNotificationType::Suspended],
            ['status_changed', 'suspended', 'active', HostingAccountNotificationType::Reactivated],
            ['status_changed', 'active', 'pending_deletion', HostingAccountNotificationType::DeletionScheduled],
            ['status_changed', 'pending_deletion', 'active', HostingAccountNotificationType::DeletionCancelled],
            ['status_changed', 'deleting', 'deleted', HostingAccountNotificationType::Deleted],
            ['status_changed', 'active', 'pending_downgrade', HostingAccountNotificationType::DowngradeScheduled],
            ['status_changed', 'active', 'action_required', HostingAccountNotificationType::ActionRequired],
            ['password_changed', null, null, HostingAccountNotificationType::PasswordChanged],
            ['package_changed', null, null, HostingAccountNotificationType::PlanChanged],
        ];

        foreach ($events as [$eventName, $from, $to, $expected]) {
            $event = new HostingAccountEvent([
                'event' => $eventName,
                'from_status' => $from,
                'to_status' => $to,
            ]);
            $event->setRelation('account', $account);
            $observer->created($event);

            Notification::assertSentTo(
                $user,
                HostingAccountNotification::class,
                fn(HostingAccountNotification $notification) => $notification->type === $expected,
            );
        }
    }

    private function accountFixture(): array
    {
        $user = new User(['name' => 'Cliente', 'email' => 'cliente@example.test']);
        $user->id = 7;

        $product = new Product(['name' => 'Hospedagem Free']);
        $plan = new HostingPlan();
        $plan->setRelation('product', $product);

        $account = new HostingAccount([
            'fqdn' => 'site.hsite.top',
            'deletes_at' => now()->addDays(7),
        ]);
        $account->id = 12;
        $account->setRelation('user', $user);
        $account->setRelation('plan', $plan);

        return [$user, $account];
    }
}
