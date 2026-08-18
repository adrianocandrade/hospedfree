<?php

namespace App\Hosting\Observers;

use App\Hosting\Enums\HostingAccountNotificationType;
use App\Hosting\Enums\HostingAccountStatus;
use App\Hosting\Models\HostingAccountEvent;
use App\Hosting\Notifications\HostingAccountNotification;

class HostingAccountEventObserver
{
    public function created(HostingAccountEvent $event): void
    {
        $type = $this->notificationType($event);
        if (!$type) {
            return;
        }

        $account = $event->relationLoaded('account')
            ? $event->account
            : $event->account()
                ->with(['user', 'plan.product'])
                ->first();

        if (!$account?->user) {
            return;
        }

        $account->user->notify(new HostingAccountNotification(
            type: $type,
            accountId: $account->id,
            domain: $account->fqdn,
            planName: $account->plan?->product?->name,
            effectiveAt: $account->deletes_at?->toIso8601String(),
        ));
    }

    private function notificationType(HostingAccountEvent $event): ?HostingAccountNotificationType
    {
        if ($event->event === 'password_changed') {
            return HostingAccountNotificationType::PasswordChanged;
        }

        if ($event->event === 'package_changed') {
            return HostingAccountNotificationType::PlanChanged;
        }

        if ($event->event !== 'status_changed') {
            return null;
        }

        if (($event->metadata['notify_customer'] ?? true) === false) {
            return null;
        }

        $from = HostingAccountStatus::tryFrom((string) $event->from_status);
        $to = HostingAccountStatus::tryFrom((string) $event->to_status);

        if ($to === HostingAccountStatus::Active && in_array($from, [
            HostingAccountStatus::Pending,
            HostingAccountStatus::Provisioning,
            HostingAccountStatus::Failed,
        ], true)) {
            return HostingAccountNotificationType::Ready;
        }

        if ($from === HostingAccountStatus::Suspended && $to === HostingAccountStatus::Active) {
            return HostingAccountNotificationType::Reactivated;
        }

        if ($from === HostingAccountStatus::PendingDeletion && in_array($to, [
            HostingAccountStatus::Active,
            HostingAccountStatus::Suspended,
        ], true)) {
            return HostingAccountNotificationType::DeletionCancelled;
        }

        return match ($to) {
            HostingAccountStatus::Failed => HostingAccountNotificationType::ProvisioningFailed,
            HostingAccountStatus::Suspended => HostingAccountNotificationType::Suspended,
            HostingAccountStatus::PendingDowngrade => HostingAccountNotificationType::DowngradeScheduled,
            HostingAccountStatus::PendingDeletion => HostingAccountNotificationType::DeletionScheduled,
            HostingAccountStatus::Deleted => HostingAccountNotificationType::Deleted,
            HostingAccountStatus::ActionRequired => HostingAccountNotificationType::ActionRequired,
            default => null,
        };
    }
}
