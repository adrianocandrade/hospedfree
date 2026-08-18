<?php

namespace App\Support;

use App\Support\Enums\SupportTicketNotificationType;
use App\Support\Enums\SupportTicketStatus;
use App\Support\Models\SupportTicket;
use App\Support\Notifications\SupportTicketNotification;
use Illuminate\Support\Facades\Notification;

class SupportTicketNotificationDispatcher
{
    public function __construct(
        private SupportNotificationRecipients $recipients,
    ) {}

    public function ticketCreated(SupportTicket $ticket): void
    {
        $ticket->loadMissing('user');
        $ticket->user?->notify($this->notification(
            $ticket,
            SupportTicketNotificationType::Created,
        ));

        $this->notifyStaff($ticket, 'created');
    }

    public function customerReplied(SupportTicket $ticket): void
    {
        $this->notifyStaff($ticket, 'customer_reply');
    }

    public function supportReplied(SupportTicket $ticket): void
    {
        $ticket->loadMissing('user');
        $ticket->user?->notify($this->notification(
            $ticket,
            SupportTicketNotificationType::Reply,
        ));
    }

    public function statusChanged(
        SupportTicket $ticket,
        SupportTicketStatus $previous,
    ): void {
        $ticket->loadMissing('user');
        if ($previous === $ticket->status || !in_array($ticket->status, [
            SupportTicketStatus::Resolved,
            SupportTicketStatus::Closed,
        ], true)) {
            return;
        }

        $ticket->user?->notify($this->notification(
            $ticket,
            SupportTicketNotificationType::StatusChanged,
        ));
    }

    private function notifyStaff(SupportTicket $ticket, string $activity): void
    {
        $recipients = $this->recipients->all();
        if ($recipients->isEmpty()) {
            return;
        }

        Notification::send($recipients, $this->notification(
            $ticket,
            SupportTicketNotificationType::StaffActivity,
            $activity,
        ));
    }

    private function notification(
        SupportTicket $ticket,
        SupportTicketNotificationType $type,
        ?string $activity = null,
    ): SupportTicketNotification {
        return new SupportTicketNotification(
            type: $type,
            ticketId: $ticket->id,
            status: $ticket->status->value,
            activity: $activity,
        );
    }
}
