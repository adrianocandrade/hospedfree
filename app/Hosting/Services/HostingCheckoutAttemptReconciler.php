<?php

namespace App\Hosting\Services;

use App\Hosting\Models\HostingCheckoutAttempt;
use Common\Billing\Checkout\CheckoutReference;
use Common\Billing\Gateways\Paypal\Paypal;
use Common\Billing\Gateways\Stripe\Stripe;
use Illuminate\Support\Carbon;
use Stripe\Exception\InvalidRequestException;
use Stripe\Subscription as StripeSubscription;
use Throwable;

class HostingCheckoutAttemptReconciler
{
    public function __construct(
        private Stripe $stripe,
        private Paypal $paypal,
        private HostingCheckoutService $checkout,
        private PendingHostingOrderService $pendingOrders,
    ) {}

    public function reconcileDue(?Carbon $at = null): int
    {
        $at ??= now();
        $processed = 0;

        HostingCheckoutAttempt::query()
            ->whereIn('status', ['pending', 'cancellation_pending'])
            ->where(function ($query) use ($at): void {
                $query
                    ->whereNull('last_checked_at')
                    ->orWhere('last_checked_at', '<=', $at->copy()->subMinutes(5));
            })
            ->select('id')
            ->eachById(function (HostingCheckoutAttempt $attempt) use (
                $at,
                &$processed,
            ): void {
                if ($this->reconcileOne($attempt->id, $at)) {
                    $processed++;
                }
            });

        return $processed;
    }

    public function reconcileOne(int $attemptId, ?Carbon $at = null): bool
    {
        $at ??= now();
        $attempt = HostingCheckoutAttempt::query()
            ->with(['order.user', 'order.price'])
            ->whereKey($attemptId)
            ->whereIn('status', ['pending', 'cancellation_pending'])
            ->first();

        if (!$attempt || !$attempt->order) {
            return false;
        }

        $claimed = HostingCheckoutAttempt::query()
            ->whereKey($attempt->id)
            ->whereIn('status', ['pending', 'cancellation_pending'])
            ->where(function ($query) use ($at): void {
                $query
                    ->whereNull('last_checked_at')
                    ->orWhere('last_checked_at', '<=', $at->copy()->subMinutes(5));
            })
            ->update([
                'last_checked_at' => $at,
                'updated_at' => now(),
            ]);

        if (!$claimed) {
            return false;
        }

        try {
            return match ($attempt->gateway) {
                'stripe' => $this->reconcileStripe($attempt, $at),
                'paypal' => $this->reconcilePaypal($attempt, $at),
                default => $this->markActionRequired(
                    $attempt,
                    'unsupported_checkout_gateway',
                    'The payment attempt uses an unsupported gateway.',
                ),
            };
        } catch (Throwable) {
            HostingCheckoutAttempt::query()
                ->whereKey($attempt->id)
                ->whereIn('status', ['pending', 'cancellation_pending'])
                ->update([
                    'failure_code' => 'gateway_temporarily_unavailable',
                    'updated_at' => now(),
                ]);

            return false;
        }
    }

    private function reconcileStripe(
        HostingCheckoutAttempt $attempt,
        Carbon $at,
    ): bool {
        $remote = $this->stripeSubscription(
            $attempt->gateway_subscription_id,
        );

        if (!$remote) {
            return $this->markActionRequired(
                $attempt,
                'remote_subscription_not_verifiable',
                'The remote payment attempt could not be verified. Billing review is required.',
            );
        }

        if (!$this->stripeIdentityMatches($attempt, $remote)) {
            return $this->markActionRequired(
                $attempt,
                'remote_identity_mismatch',
                'The remote payment identity does not match this hosting order.',
            );
        }

        if ($attempt->status === 'cancellation_pending') {
            return $this->cancelSupersededStripeAttempt(
                $attempt,
                $remote,
                $at,
            );
        }

        if (
            in_array(
                $remote->status,
                [
                    StripeSubscription::STATUS_CANCELED,
                    StripeSubscription::STATUS_INCOMPLETE_EXPIRED,
                ],
                true,
            )
        ) {
            return $this->markTerminal(
                $attempt,
                'remote_' . $remote->status,
                $at,
            );
        }

        $isReady =
            $remote->status === StripeSubscription::STATUS_ACTIVE ||
            ($remote->status === StripeSubscription::STATUS_TRIALING &&
                !$remote->pending_setup_intent);

        if ($isReady) {
            try {
                $this->stripe->subscriptions->sync($remote->id);
            } catch (Throwable) {
                return $this->markActionRequired(
                    $attempt,
                    'paid_subscription_sync_failed',
                    'Payment was confirmed, but hosting activation requires review.',
                );
            }

            return $this->verifyFulfilledOrEscalate($attempt);
        }

        if (!$this->attemptExpired($attempt, $at)) {
            $this->clearTransientFailure($attempt);
            return true;
        }

        $hadPayableHistory = $this->stripeStatusMayHaveBillingHistory(
            $remote->status,
        );

        try {
            $this->stripe->client->subscriptions->cancel($remote->id);
        } catch (InvalidRequestException $e) {
            if ($e->getStripeCode() === 'resource_missing') {
                return $this->markActionRequired(
                    $attempt,
                    'remote_subscription_not_verifiable',
                    'The remote payment attempt could not be verified. Billing review is required.',
                );
            }

            throw $e;
        }

        $cancelled = $this->stripeSubscription($remote->id);
        if (
            !$cancelled ||
            in_array(
                $cancelled->status,
                [
                    StripeSubscription::STATUS_CANCELED,
                    StripeSubscription::STATUS_INCOMPLETE_EXPIRED,
                ],
                true,
            )
        ) {
            if ($hadPayableHistory) {
                return $this->markActionRequired(
                    $attempt,
                    'remote_subscription_cancelled_after_billing_state',
                    'The payment subscription was cancelled, but billing review is required before releasing this order.',
                );
            }

            return $this->markTerminal(
                $attempt,
                'remote_checkout_cancelled',
                $at,
            );
        }

        $this->markCancellationPending($attempt);
        return false;
    }

    private function reconcilePaypal(
        HostingCheckoutAttempt $attempt,
        Carbon $at,
    ): bool {
        $remote = $this->paypal->subscriptions->inspectRemoteSubscription(
            $attempt->gateway_subscription_id,
        );

        if (!$remote) {
            return $this->markActionRequired(
                $attempt,
                'remote_subscription_not_verifiable',
                'The remote payment attempt could not be verified. Billing review is required.',
            );
        }

        if (!$this->paypalIdentityMatches($attempt, $remote)) {
            return $this->markActionRequired(
                $attempt,
                'remote_identity_mismatch',
                'The remote payment identity does not match this hosting order.',
            );
        }

        if ($attempt->status === 'cancellation_pending') {
            return $this->cancelSupersededPaypalAttempt(
                $attempt,
                $remote,
                $at,
            );
        }

        $status = strtoupper((string) ($remote['status'] ?? ''));
        if (in_array($status, ['CANCELLED', 'EXPIRED'], true)) {
            return $this->markTerminal(
                $attempt,
                'remote_' . strtolower($status),
                $at,
            );
        }

        if ($status === 'ACTIVE') {
            try {
                $this->paypal->subscriptions->sync(
                    $attempt->gateway_subscription_id,
                    $attempt->user_id,
                    $attempt->order->uuid,
                );
            } catch (Throwable) {
                return $this->markActionRequired(
                    $attempt,
                    'paid_subscription_sync_failed',
                    'Payment was confirmed, but hosting activation requires review.',
                );
            }

            return $this->verifyFulfilledOrEscalate($attempt);
        }

        if (!$this->attemptExpired($attempt, $at)) {
            $this->clearTransientFailure($attempt);
            return true;
        }

        $hadPayableHistory = in_array(
            $status,
            ['ACTIVE', 'SUSPENDED'],
            true,
        );
        $cancelConfirmed = $this->paypal->subscriptions->cancelPendingHostingAttempt(
            $attempt->gateway_subscription_id,
        );

        if (!$cancelConfirmed) {
            return $this->markActionRequired(
                $attempt,
                'remote_subscription_not_verifiable',
                'The remote payment attempt could not be verified. Billing review is required.',
            );
        }

        $cancelled = $this->paypal->subscriptions->inspectRemoteSubscription(
            $attempt->gateway_subscription_id,
        );

        if (
            !$cancelled ||
            in_array(
                strtoupper((string) ($cancelled['status'] ?? '')),
                ['CANCELLED', 'EXPIRED'],
                true,
            )
        ) {
            if ($hadPayableHistory) {
                return $this->markActionRequired(
                    $attempt,
                    'remote_subscription_cancelled_after_billing_state',
                    'The payment subscription was cancelled, but billing review is required before releasing this order.',
                );
            }

            return $this->markTerminal(
                $attempt,
                'remote_checkout_cancelled',
                $at,
            );
        }

        $this->markCancellationPending($attempt);
        return false;
    }

    private function stripeSubscription(
        string $subscriptionId,
    ): ?StripeSubscription {
        try {
            return $this->stripe->client->subscriptions->retrieve(
                $subscriptionId,
            );
        } catch (InvalidRequestException $e) {
            if ($e->getStripeCode() === 'resource_missing') {
                return null;
            }

            throw $e;
        }
    }

    private function cancelSupersededStripeAttempt(
        HostingCheckoutAttempt $attempt,
        StripeSubscription $remote,
        Carbon $at,
    ): bool {
        $wasPayable = in_array(
            $remote->status,
            ['active', 'trialing', 'past_due', 'unpaid', 'paused'],
            true,
        );

        if (
            !in_array(
                $remote->status,
                [
                    StripeSubscription::STATUS_CANCELED,
                    StripeSubscription::STATUS_INCOMPLETE_EXPIRED,
                ],
                true,
            )
        ) {
            try {
                $this->stripe->client->subscriptions->cancel($remote->id);
            } catch (InvalidRequestException $e) {
                if ($e->getStripeCode() === 'resource_missing') {
                    return $this->markActionRequired(
                        $attempt,
                        'remote_subscription_not_verifiable',
                        'The remote payment attempt could not be verified. Billing review is required.',
                    );
                }

                throw $e;
            }
        }

        $cancelled = $this->stripeSubscription($remote->id);
        $isTerminal =
            !$cancelled ||
            in_array(
                $cancelled->status,
                [
                    StripeSubscription::STATUS_CANCELED,
                    StripeSubscription::STATUS_INCOMPLETE_EXPIRED,
                ],
                true,
            );

        if (!$isTerminal) {
            $this->markCancellationPending($attempt);
            return false;
        }

        if ($wasPayable) {
            return $this->markActionRequired(
                $attempt,
                'duplicate_remote_subscription_cancelled',
                'A second payment subscription was activated and cancelled. Billing review may be required.',
            );
        }

        return $this->markSupersededTerminal($attempt, $at);
    }

    private function cancelSupersededPaypalAttempt(
        HostingCheckoutAttempt $attempt,
        array $remote,
        Carbon $at,
    ): bool {
        $status = strtoupper((string) ($remote['status'] ?? ''));
        $wasPayable = in_array($status, ['ACTIVE', 'SUSPENDED'], true);

        if (!in_array($status, ['CANCELLED', 'EXPIRED'], true)) {
            $cancelConfirmed = $this->paypal->subscriptions->cancelPendingHostingAttempt(
                $attempt->gateway_subscription_id,
            );

            if (!$cancelConfirmed) {
                return $this->markActionRequired(
                    $attempt,
                    'remote_subscription_not_verifiable',
                    'The remote payment attempt could not be verified. Billing review is required.',
                );
            }
        }

        $cancelled = $this->paypal->subscriptions->inspectRemoteSubscription(
            $attempt->gateway_subscription_id,
        );
        $cancelledStatus = strtoupper(
            (string) ($cancelled['status'] ?? ''),
        );

        if (
            $cancelled &&
            !in_array($cancelledStatus, ['CANCELLED', 'EXPIRED'], true)
        ) {
            $this->markCancellationPending($attempt);
            return false;
        }

        if ($wasPayable) {
            return $this->markActionRequired(
                $attempt,
                'duplicate_remote_subscription_cancelled',
                'A second payment subscription was activated and cancelled. Billing review may be required.',
            );
        }

        return $this->markSupersededTerminal($attempt, $at);
    }

    private function stripeIdentityMatches(
        HostingCheckoutAttempt $attempt,
        StripeSubscription $remote,
    ): bool {
        $order = $attempt->order;
        $remotePrice = $remote->items->data[0]->price ?? null;
        $remotePriceId = is_string($remotePrice)
            ? $remotePrice
            : ($remotePrice->id ?? null);
        $remoteCustomer = is_string($remote->customer)
            ? $remote->customer
            : ($remote->customer->id ?? null);

        return $remote->id === $attempt->gateway_subscription_id &&
            CheckoutReference::normalize(
                $remote->metadata['checkout_reference'] ?? null,
            ) === $this->checkout->referenceFor($order) &&
            $order->user?->stripe_id &&
            $remoteCustomer === $order->user->stripe_id &&
            $order->price?->stripe_id &&
            $remotePriceId === $order->price->stripe_id;
    }

    private function paypalIdentityMatches(
        HostingCheckoutAttempt $attempt,
        array $remote,
    ): bool {
        return ($remote['id'] ?? null) ===
                $attempt->gateway_subscription_id &&
            CheckoutReference::normalize($remote['custom_id'] ?? null) ===
                $this->checkout->referenceFor($attempt->order) &&
            $attempt->order->price?->paypal_id &&
            ($remote['plan_id'] ?? null) ===
                $attempt->order->price->paypal_id;
    }

    private function attemptExpired(
        HostingCheckoutAttempt $attempt,
        Carbon $at,
    ): bool {
        $expiresAt = $attempt->expires_at ??
            $attempt->created_at?->copy()->addMinutes(
                max(
                    15,
                    (int) config(
                        'hospedfree.checkout_attempt_grace_minutes',
                        60,
                    ),
                ),
            );

        return $expiresAt?->lte($at) ?? false;
    }

    private function stripeStatusMayHaveBillingHistory(string $status): bool
    {
        return in_array(
            $status,
            ['active', 'trialing', 'past_due', 'unpaid', 'paused'],
            true,
        );
    }

    private function verifyFulfilledOrEscalate(
        HostingCheckoutAttempt $attempt,
    ): bool {
        $fresh = HostingCheckoutAttempt::query()->find($attempt->id);
        if ($fresh?->status === 'fulfilled') {
            return true;
        }

        return $this->markActionRequired(
            $attempt,
            'paid_hosting_fulfillment_failed',
            'Payment was confirmed, but hosting activation requires review.',
        );
    }

    private function markTerminal(
        HostingCheckoutAttempt $attempt,
        string $failureCode,
        Carbon $at,
    ): bool {
        HostingCheckoutAttempt::query()
            ->whereKey($attempt->id)
            ->whereIn('status', ['pending', 'cancellation_pending'])
            ->update([
                'status' => 'failed',
                'failure_code' => $failureCode,
                'updated_at' => now(),
            ]);

        if ($attempt->order->expires_at?->lte($at)) {
            $this->pendingOrders->expireDueForDomain(
                $attempt->order->fqdn,
                $at,
            );
        }

        return true;
    }

    private function markActionRequired(
        HostingCheckoutAttempt $attempt,
        string $failureCode,
        string $safeMessage,
    ): bool {
        HostingCheckoutAttempt::query()
            ->whereKey($attempt->id)
            ->whereIn('status', ['pending', 'cancellation_pending'])
            ->update([
                'status' => 'action_required',
                'failure_code' => $failureCode,
                'updated_at' => now(),
            ]);

        $attempt->order->forceFill([
            'failure_code' => $failureCode,
            'safe_failure_message' => __($safeMessage),
        ])->save();

        return false;
    }

    private function markCancellationPending(
        HostingCheckoutAttempt $attempt,
    ): void {
        HostingCheckoutAttempt::query()
            ->whereKey($attempt->id)
            ->whereIn('status', ['pending', 'cancellation_pending'])
            ->update([
                'failure_code' => 'remote_cancellation_pending',
                'updated_at' => now(),
            ]);
    }

    private function clearTransientFailure(
        HostingCheckoutAttempt $attempt,
    ): void {
        HostingCheckoutAttempt::query()
            ->whereKey($attempt->id)
            ->whereIn('status', ['pending', 'cancellation_pending'])
            ->update([
                'failure_code' => null,
                'updated_at' => now(),
            ]);
    }

    private function markSupersededTerminal(
        HostingCheckoutAttempt $attempt,
        Carbon $at,
    ): bool {
        HostingCheckoutAttempt::query()
            ->whereKey($attempt->id)
            ->whereIn('status', ['pending', 'cancellation_pending'])
            ->update([
                'status' => 'superseded',
                'failure_code' => 'superseded_checkout_cancelled',
                'last_checked_at' => $at,
                'updated_at' => now(),
            ]);

        return true;
    }
}
