<?php

namespace App\Hosting\Services;

use App\Hosting\Enums\HostingOrderStatus;
use App\Hosting\Models\HostingCheckoutAttempt;
use App\Hosting\Models\HostingOrder;
use Common\Billing\Checkout\CheckoutReference;
use Common\Billing\Subscription;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class HostingCheckoutService
{
    public const REFERENCE_CONTEXT = 'hosting_order';

    public function resolvePendingOrder(
        string $uuid,
        int $userId,
        int $productId,
        int $priceId,
    ): HostingOrder {
        $order = HostingOrder::query()->where('uuid', $uuid)->first();

        if (
            !$order ||
            $order->user_id !== $userId ||
            $order->product_id !== $productId ||
            $order->price_id !== $priceId ||
            $order->status !== HostingOrderStatus::AwaitingPayment ||
            $order->subscription_id ||
            $order->account()->exists() ||
            ($order->expires_at &&
                $order->expires_at->isPast() &&
                !$order
                    ->checkoutAttempts()
                    ->whereIn('status', [
                        'pending',
                        'cancellation_pending',
                        'action_required',
                    ])
                    ->exists())
        ) {
            throw ValidationException::withMessages([
                'hosting_order' => __('This hosting checkout is no longer available.'),
            ]);
        }

        return $order;
    }

    public function referenceFor(HostingOrder $order): string
    {
        return CheckoutReference::make(self::REFERENCE_CONTEXT, $order->uuid);
    }

    public function orderUuidFromReference(mixed $reference): ?string
    {
        return CheckoutReference::identifierFor(
            $reference,
            self::REFERENCE_CONTEXT,
        );
    }

    public function assertSubscriptionMatchesOrder(
        Subscription $subscription,
        string $orderUuid,
        int $userId,
    ): HostingOrder {
        $order = HostingOrder::query()
            ->with('account')
            ->where('uuid', $orderUuid)
            ->first();
        $alreadyLinked =
            $order &&
            ($order->subscription_id === $subscription->id ||
                $order->account?->subscription_id === $subscription->id);

        if (
            !$order ||
            $order->user_id !== $userId ||
            $subscription->user_id !== $userId ||
            (!$alreadyLinked &&
                ($order->product_id !== $subscription->product_id ||
                    $order->price_id !== $subscription->price_id)) ||
            ($order->subscription_id &&
                $order->subscription_id !== $subscription->id) ||
            $this->orderUuidFromReference(
                $subscription->checkout_reference,
            ) !== $orderUuid
        ) {
            throw ValidationException::withMessages([
                'hosting_order' => __('This payment does not belong to this hosting order.'),
            ]);
        }

        return $order;
    }

    public function recordAttempt(
        HostingOrder $order,
        string $gateway,
        string $gatewaySubscriptionId,
    ): HostingCheckoutAttempt {
        return DB::transaction(function () use (
            $order,
            $gateway,
            $gatewaySubscriptionId,
        ): HostingCheckoutAttempt {
            $lockedOrder = HostingOrder::query()
                ->lockForUpdate()
                ->findOrFail($order->id);

            if (
                $lockedOrder->status !== HostingOrderStatus::AwaitingPayment ||
                $lockedOrder->subscription_id ||
                $lockedOrder->account()->exists() ||
                ($lockedOrder->expires_at && $lockedOrder->expires_at->isPast())
            ) {
                throw ValidationException::withMessages([
                    'hosting_order' => __('This hosting checkout is no longer available.'),
                ]);
            }

            $existing = HostingCheckoutAttempt::query()
                ->where('gateway', $gateway)
                ->where('gateway_subscription_id', $gatewaySubscriptionId)
                ->lockForUpdate()
                ->first();

            if ($existing && $existing->hosting_order_id !== $lockedOrder->id) {
                throw ValidationException::withMessages([
                    'hosting_order' => __('This payment attempt cannot be used for this hosting order.'),
                ]);
            }

            if ($existing && $existing->status !== 'pending') {
                throw ValidationException::withMessages([
                    'hosting_order' => __(
                        'This payment attempt is closed. Start a new checkout to continue.',
                    ),
                ]);
            }

            return $existing ?: HostingCheckoutAttempt::create([
                'hosting_order_id' => $lockedOrder->id,
                'user_id' => $lockedOrder->user_id,
                'gateway' => $gateway,
                'gateway_subscription_id' => $gatewaySubscriptionId,
                'status' => 'pending',
                'expires_at' => now()->addMinutes(
                    max(
                        15,
                        (int) config(
                            'hospedfree.checkout_attempt_grace_minutes',
                            60,
                        ),
                    ),
                ),
            ]);
        }, attempts: 3);
    }

    public function markLatePaymentActionRequired(
        HostingOrder $order,
        Subscription $subscription,
    ): void {
        $order->forceFill([
            'failure_code' => 'paid_after_checkout_closed',
            'safe_failure_message' => __(
                'Payment was received after this hosting checkout closed. Manual recovery or refund is required.',
            ),
        ])->save();

        HostingCheckoutAttempt::query()
            ->where('hosting_order_id', $order->id)
            ->where('gateway', $subscription->gateway_name)
            ->where('gateway_subscription_id', $subscription->gateway_id)
            ->update([
                'subscription_id' => $subscription->id,
                'status' => 'action_required',
                'updated_at' => now(),
            ]);
    }

    public function markFulfilled(
        HostingOrder $order,
        Subscription $subscription,
    ): void {
        HostingCheckoutAttempt::query()
            ->where('hosting_order_id', $order->id)
            ->where('gateway', $subscription->gateway_name)
            ->where('gateway_subscription_id', $subscription->gateway_id)
            ->update([
                'subscription_id' => $subscription->id,
                'status' => 'fulfilled',
                'updated_at' => now(),
            ]);

        HostingCheckoutAttempt::query()
            ->where('hosting_order_id', $order->id)
            ->where('status', 'pending')
            ->update([
                // A second remote approval URL may still be live. Keep it in the
                // reconciliation queue until the provider confirms cancellation.
                'status' => 'cancellation_pending',
                'expires_at' => now(),
                'failure_code' => 'superseded_checkout_requires_cancellation',
                'updated_at' => now(),
            ]);
    }
}
