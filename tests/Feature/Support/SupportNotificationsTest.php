<?php

namespace Tests\Feature\Support;

use App\Models\User;
use App\Support\Enums\SupportTicketNotificationType;
use App\Support\Enums\SupportTicketStatus;
use App\Support\Models\SupportTicket;
use App\Support\Notifications\SupportTicketNotification;
use App\Support\SupportNotificationRecipients;
use App\Support\SupportTicketNotificationDispatcher;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class SupportNotificationsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        app()->setLocale('pt-BR');
        config()->set('app.url', 'https://hospedfree.test');
    }

    public function test_ticket_creation_notifies_customer_and_support_without_message_content(): void
    {
        Notification::fake();
        $customer = $this->user(1, 'Cliente');
        $admin = $this->user(2, 'Suporte');
        $ticket = $this->ticket($customer);
        $dispatcher = new SupportTicketNotificationDispatcher(
            new class($admin) extends SupportNotificationRecipients {
                public function __construct(private User $admin) {}

                public function all(): Collection
                {
                    return new Collection([$this->admin]);
                }
            },
        );

        $dispatcher->ticketCreated($ticket);

        Notification::assertSentTo(
            $customer,
            SupportTicketNotification::class,
            fn(SupportTicketNotification $notification) =>
                $notification->type === SupportTicketNotificationType::Created,
        );
        Notification::assertSentTo(
            $admin,
            SupportTicketNotification::class,
            function (SupportTicketNotification $notification) use ($admin): bool {
                $payload = json_encode([
                    $notification->toArray($admin),
                    $notification->toMail($admin)->introLines,
                ], JSON_THROW_ON_ERROR);

                return $notification->type === SupportTicketNotificationType::StaffActivity
                    && !str_contains($payload, 'CONTEUDO-SENSIVEL');
            },
        );
    }

    public function test_customer_receives_support_reply_and_terminal_status_updates(): void
    {
        Notification::fake();
        $customer = $this->user(1, 'Cliente');
        $ticket = $this->ticket($customer);
        $dispatcher = new SupportTicketNotificationDispatcher(
            new class extends SupportNotificationRecipients {
                public function all(): Collection
                {
                    return new Collection();
                }
            },
        );

        $dispatcher->supportReplied($ticket);
        $previous = $ticket->status;
        $ticket->status = SupportTicketStatus::Resolved;
        $dispatcher->statusChanged($ticket, $previous);

        Notification::assertSentTo(
            $customer,
            SupportTicketNotification::class,
            fn(SupportTicketNotification $notification) =>
                $notification->type === SupportTicketNotificationType::Reply,
        );
        Notification::assertSentTo(
            $customer,
            SupportTicketNotification::class,
            fn(SupportTicketNotification $notification) =>
                $notification->type === SupportTicketNotificationType::StatusChanged
                && $notification->status === SupportTicketStatus::Resolved->value,
        );
    }

    private function user(int $id, string $name): User
    {
        $user = new User(['name' => $name, 'email' => strtolower($name) . '@example.test']);
        $user->id = $id;
        return $user;
    }

    private function ticket(User $customer): SupportTicket
    {
        $ticket = new SupportTicket([
            'subject' => 'CONTEUDO-SENSIVEL',
            'status' => SupportTicketStatus::Open,
        ]);
        $ticket->id = 41;
        $ticket->setRelation('user', $customer);
        return $ticket;
    }
}
