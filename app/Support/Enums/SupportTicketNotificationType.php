<?php

namespace App\Support\Enums;

enum SupportTicketNotificationType: string
{
    case Created = 'ticket_created';
    case Reply = 'ticket_reply';
    case StatusChanged = 'ticket_status_changed';
    case StaffActivity = 'ticket_staff_activity';
}
