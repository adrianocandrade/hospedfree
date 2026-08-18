<?php

namespace App\Hosting\Actions;

use App\Hosting\Contracts\HostingProvider;
use App\Hosting\Enums\HostingAccountStatus;
use App\Hosting\Enums\HostingOrderStatus;
use App\Hosting\Jobs\ProvisionHostingOrder;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Models\HostingOrder;
use App\Hosting\Services\HostingCheckoutService;
use Common\Billing\Subscription;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FulfillPendingHostingOrder
{
    public function __construct(
        private HostingProvider $provider,
        private HostingCheckoutService $checkout,
    ) {}

    public function execute(Subscription $subscription): ?HostingAccount
    {
        if (!$subscription->valid()) {
            return null;
        }

        $orderUuid = $this->checkout->orderUuidFromReference(
            $subscription->checkout_reference,
        );

        if (!$orderUuid) {
            return null;
        }

        $account = DB::transaction(function () use (
            $orderUuid,
            $subscription,
        ): ?HostingAccount {
            $lockedSubscription = Subscription::query()
                ->lockForUpdate()
                ->find($subscription->id);

            if (
                !$lockedSubscription ||
                !$lockedSubscription->valid() ||
                $this->checkout->orderUuidFromReference(
                    $lockedSubscription->checkout_reference,
                ) !== $orderUuid
            ) {
                return null;
            }

            $order = HostingOrder::query()
                ->with(['plan.providerPackages'])
                ->lockForUpdate()
                ->where('uuid', $orderUuid)
                ->first();

            $hasMatchingPendingAttempt =
                $order &&
                $order
                    ->checkoutAttempts()
                    ->where('gateway', $lockedSubscription->gateway_name)
                    ->where(
                        'gateway_subscription_id',
                        $lockedSubscription->gateway_id,
                    )
                    ->where('status', 'pending')
                    ->exists();

            if (
                $order &&
                ($order->status === HostingOrderStatus::Cancelled ||
                    ($order->expires_at &&
                        $order->expires_at->isPast() &&
                        !$hasMatchingPendingAttempt)) &&
                $order->user_id === $lockedSubscription->user_id &&
                $order->product_id === $lockedSubscription->product_id &&
                $order->price_id === $lockedSubscription->price_id
            ) {
                $this->checkout->markLatePaymentActionRequired(
                    $order,
                    $lockedSubscription,
                );

                return null;
            }

            if (
                !$order ||
                $order->status !== HostingOrderStatus::AwaitingPayment ||
                $order->subscription_id ||
                $order->account()->exists() ||
                ($order->expires_at &&
                    $order->expires_at->isPast() &&
                    !$hasMatchingPendingAttempt) ||
                $order->user_id !== $lockedSubscription->user_id ||
                $order->product_id !== $lockedSubscription->product_id ||
                $order->price_id !== $lockedSubscription->price_id ||
                HostingOrder::query()
                    ->where('subscription_id', $lockedSubscription->id)
                    ->whereKeyNot($order->id)
                    ->exists() ||
                HostingAccount::query()
                    ->where('subscription_id', $lockedSubscription->id)
                    ->exists() ||
                !$order->plan->packageFor($this->provider->key())
            ) {
                return null;
            }

            $order->fill([
                'subscription_id' => $lockedSubscription->id,
                'paid_at' => now(),
            ])->save();
            $order->transitionTo(HostingOrderStatus::Paid);

            $account = HostingAccount::create([
                'uuid' => (string) Str::uuid7(),
                'hosting_order_id' => $order->id,
                'workspace_id' => $order->workspace_id,
                'user_id' => $order->user_id,
                'hosting_plan_id' => $order->hosting_plan_id,
                'product_id' => $order->product_id,
                'price_id' => $order->price_id,
                'subscription_id' => $lockedSubscription->id,
                'hosting_zone_id' => $order->hosting_zone_id,
                'provider' => $this->provider->key(),
                'fqdn' => $order->fqdn,
                'active_domain' => $order->fqdn,
                'free_slot' => null,
                'status' => HostingAccountStatus::Pending,
                'desired_status' => HostingAccountStatus::Active,
            ]);

            $this->checkout->markFulfilled($order, $lockedSubscription);

            return $account;
        }, attempts: 3);

        if ($account) {
            ProvisionHostingOrder::dispatch($account->hosting_order_id)
                ->afterCommit();
        }

        return $account;
    }
}
