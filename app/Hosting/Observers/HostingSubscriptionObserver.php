<?php

namespace App\Hosting\Observers;

use App\Hosting\Actions\FulfillPendingHostingOrder;
use App\Hosting\Enums\HostingAccountStatus;
use App\Hosting\Enums\HostingPlanType;
use App\Hosting\Enums\ProviderOperationType;
use App\Hosting\Jobs\RunHostingAccountOperation;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Models\HostingPlan;
use App\Hosting\Services\HostingFreeSlot;
use App\Hosting\Services\HostingPremiumSubdomainService;
use Common\Billing\Subscription;

class HostingSubscriptionObserver
{
    public function __construct(
        private FulfillPendingHostingOrder $fulfillPendingOrder,
        private HostingFreeSlot $freeSlots,
        private HostingPremiumSubdomainService $premiumSubdomains,
    ) {}

    public function saved(Subscription $subscription): void
    {
        $this->premiumSubdomains->reconcileSubscription($subscription);

        $account = HostingAccount::query()
            ->where('subscription_id', $subscription->id)
            ->first();

        if (!$account) {
            $this->fulfillPendingOrder->execute($subscription);
            return;
        }

        $target = HostingPlan::query()
            ->where('product_id', $subscription->product_id)
            ->where('type', HostingPlanType::Paid)
            ->where('is_active', true)
            ->first();

        if (
            $subscription->valid() &&
            $target &&
            $account->hosting_plan_id !== $target->id
        ) {
            RunHostingAccountOperation::dispatch(
                $account->id,
                ProviderOperationType::ChangePackage,
                "package:{$account->uuid}:subscription:{$subscription->id}:product:{$target->product_id}",
                $target->id,
            );
            return;
        }

        if ($subscription->ended()) {
            $this->downgradeToFree($account, $subscription->id);
        }
    }

    public function deleting(Subscription $subscription): void
    {
        $this->premiumSubdomains->subscriptionDeleting($subscription);

        $account = HostingAccount::query()
            ->where('subscription_id', $subscription->id)
            ->first();

        if ($account) {
            $this->downgradeToFree($account, $subscription->id);
        }
    }

    private function downgradeToFree(
        HostingAccount $account,
        int $subscriptionId,
    ): void {
        $freePlan = HostingPlan::query()
            ->where('type', HostingPlanType::Free)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->first();

        if (!$freePlan || $account->hosting_plan_id === $freePlan->id) {
            return;
        }

        $freeSlot = $this->freeSlots->nextAvailable(
            $account->workspace_id,
            $freePlan->max_accounts_per_workspace,
            $account->id,
        );

        if (!$freeSlot) {
            if ($account->status !== HostingAccountStatus::PendingDowngrade) {
                $account->transitionTo(
                    HostingAccountStatus::PendingDowngrade,
                    safeMessage: 'Paid access ended; downgrade review queued.',
                );
            }
            $account->transitionTo(
                HostingAccountStatus::ActionRequired,
                safeMessage: 'The workspace already uses its Free hosting slot. The paid site was preserved for operational review.',
                metadata: [
                    'code' => 'free_slot_already_used',
                    'notify_customer' => true,
                ],
            );
            return;
        }

        if (
            !in_array(
                $account->status,
                [
                    HostingAccountStatus::Active,
                    HostingAccountStatus::Suspended,
                    HostingAccountStatus::ActionRequired,
                    HostingAccountStatus::PendingDowngrade,
                ],
                true,
            )
        ) {
            return;
        }

        if ($account->free_slot !== $freeSlot) {
            $account->free_slot = $freeSlot;
            $account->save();
        }

        if ($account->status !== HostingAccountStatus::PendingDowngrade) {
            $account->transitionTo(
                HostingAccountStatus::PendingDowngrade,
                safeMessage: 'Paid access ended; downgrade to Free queued.',
            );
        }

        RunHostingAccountOperation::dispatch(
            $account->id,
            ProviderOperationType::ChangePackage,
            "downgrade:{$account->uuid}:subscription:{$subscriptionId}",
            $freePlan->id,
        );
    }
}
