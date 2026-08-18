<?php

namespace Common\Billing\Gateways\Paypal;

use App\Hosting\Models\HostingOrder;
use App\Hosting\Models\HostingPremiumSubdomainPurchase;
use App\Hosting\Services\HostingCheckoutService;
use App\Hosting\Services\HostingPremiumSubdomainService;
use App\Models\User;
use Common\Billing\Checkout\CheckoutReference;
use Common\Billing\Gateways\Stripe\FormatsMoney;
use Common\Billing\Invoices\Invoice;
use Common\Billing\Models\Price;
use Common\Billing\Models\Product;
use Common\Billing\Notifications\NewInvoiceAvailable;
use Common\Billing\Subscription;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PaypalSubscriptions
{
    use InteractsWithPaypalRestApi, FormatsMoney;

    public function __construct(
        private HostingCheckoutService $hostingCheckout,
        private HostingPremiumSubdomainService $premiumSubdomains,
    ) {}

    public function isIncomplete(Subscription $subscription): bool
    {
        return $subscription->gateway_status === 'APPROVAL_PENDING' ||
            $subscription->gateway_status === 'APPROVED';
    }

    public function isPastDue(Subscription $subscription): bool
    {
        // no way to check this via PayPal API
        return false;
    }

    public function sync(
        string $paypalSubscriptionId,
        ?int $userId = null,
        ?string $expectedHostingOrderUuid = null,
        ?string $expectedPremiumPurchaseUuid = null,
    ): Subscription {
        $response = $this->remoteSubscription($paypalSubscriptionId);

        $price = Price::where('paypal_id', $response['plan_id'])->firstOrFail();
        $checkoutReference = CheckoutReference::normalize(
            $response['custom_id'] ?? null,
        );
        $hostingOrderUuid = $this->hostingCheckout->orderUuidFromReference(
            $checkoutReference,
        );
        $premiumPurchaseUuid = $this->premiumSubdomains->purchaseUuidFromReference(
            $checkoutReference,
        );

        if ($expectedHostingOrderUuid && $expectedPremiumPurchaseUuid) {
            throw ValidationException::withMessages([
                'checkout' => __(
                    'A checkout cannot contain two billing references.',
                ),
            ]);
        }

        if (
            $expectedHostingOrderUuid &&
            $hostingOrderUuid !== $expectedHostingOrderUuid
        ) {
            throw ValidationException::withMessages([
                'hosting_order' => __(
                    'This payment does not belong to this hosting order.',
                ),
            ]);
        }
        if (
            $expectedPremiumPurchaseUuid &&
            $premiumPurchaseUuid !== $expectedPremiumPurchaseUuid
        ) {
            throw ValidationException::withMessages([
                'premium_purchase' => __(
                    'This payment does not belong to this premium address checkout.',
                ),
            ]);
        }

        return DB::transaction(function () use (
            $response,
            $price,
            $checkoutReference,
            $hostingOrderUuid,
            $premiumPurchaseUuid,
            $userId,
        ): Subscription {
            $subscription = Subscription::query()
                ->where('gateway_name', 'paypal')
                ->where('gateway_id', $response['id'])
                ->lockForUpdate()
                ->first();

            if (
                $subscription &&
                $userId &&
                $subscription->user_id !== $userId
            ) {
                throw ValidationException::withMessages([
                    'paypal_subscription_id' => __(
                        'This PayPal subscription belongs to another account.',
                    ),
                ]);
            }

            if ($premiumPurchaseUuid) {
                $user = $this->premiumSubdomains->resolvePurchaseOwnerForPayment(
                    $premiumPurchaseUuid,
                    $price,
                    $userId,
                    $subscription,
                );
            } elseif ($hostingOrderUuid) {
                $order = $this->validateHostingOrderIdentity(
                    $hostingOrderUuid,
                    $price,
                    $userId,
                    $subscription,
                );
                $user = $order->user;
            } elseif ($subscription) {
                $user = $subscription->user;
            } else {
                $user = $this->resolveGenericCheckoutUser($response, $userId);
            }

            $payerId = Arr::get($response, 'subscriber.payer_id');
            if (!is_string($payerId) || $payerId === '') {
                throw ValidationException::withMessages([
                    'paypal_subscription_id' => __(
                        'PayPal did not return a verified payer for this subscription.',
                    ),
                ]);
            }

            $payerOwner = User::query()
                ->where('paypal_id', $payerId)
                ->whereKeyNot($user->id)
                ->exists();

            if (
                $payerOwner ||
                ($user->paypal_id && $user->paypal_id !== $payerId)
            ) {
                throw ValidationException::withMessages([
                    'paypal_subscription_id' => __(
                        'This PayPal payer is already linked to another account.',
                    ),
                ]);
            }

            if (!$user->paypal_id) {
                $user->forceFill(['paypal_id' => $payerId])->save();
            }

            $subscription ??= $user->subscriptions()->make([
                'gateway_name' => 'paypal',
                'gateway_id' => $response['id'],
            ]);

            if (
                $subscription->exists &&
                $subscription->checkout_reference &&
                $checkoutReference &&
                $subscription->checkout_reference !== $checkoutReference
            ) {
                throw new \DomainException(
                    'The checkout reference for this subscription cannot be changed.',
                );
            }

            $isOnTrial =
                // subscription has 2 cycles, first is trial, second is regular
                count(
                    Arr::get($response, 'billing_info.cycle_executions', []),
                ) === 2 &&
                // first cycle is trial
                Arr::get(
                    $response,
                    'billing_info.cycle_executions.0.tenure_type',
                ) === 'TRIAL' &&
                // trial cycle has been completed
                Arr::get(
                    $response,
                    'billing_info.cycle_executions.0.cycles_completed',
                ) === 1 &&
                // regular cycle has not completed yet
                Arr::get(
                    $response,
                    'billing_info.cycle_executions.1.cycles_completed',
                ) === 0;

            $nextBillingTime = Arr::get(
                $response,
                'billing_info.next_billing_time',
                null,
            );

            $trialEndsAt =
                $isOnTrial && $nextBillingTime
                    ? Carbon::parse($nextBillingTime)
                    : null;

            $data = [
                'price_id' => $price->id,
                'product_id' => $price->product_id,
                'gateway_name' => 'paypal',
                'gateway_id' => $paypalSubscriptionId,
                'gateway_status' => $response['status'],
                'trial_ends_at' => $trialEndsAt,
                'renews_at' =>
                    $response['status'] === 'ACTIVE' && $nextBillingTime
                        ? Carbon::parse($nextBillingTime)
                        : null,
            ];

            if ($response['status'] === 'ACTIVE') {
                $data['ends_at'] = null;
            }

            if (
                in_array(
                    $response['status'],
                    ['CANCELLED', 'EXPIRED', 'SUSPENDED'],
                    true,
                )
            ) {
                $data['ends_at'] = $subscription->renews_at;
                $data['renews_at'] = null;
            }

            if ($checkoutReference) {
                $data['checkout_reference'] = $checkoutReference;
            }

            $subscription->fill($data)->save();

            $this->createOrUpdateInvoice($subscription, $response);

            return $subscription;
        }, attempts: 3);
    }

    public function validateHostingAttempt(
        string $paypalSubscriptionId,
        string $hostingOrderUuid,
        int $userId,
    ): HostingOrder {
        $response = $this->remoteSubscription($paypalSubscriptionId);
        $price = Price::where('paypal_id', $response['plan_id'])->firstOrFail();
        $reference = CheckoutReference::normalize(
            $response['custom_id'] ?? null,
        );

        if (
            $this->hostingCheckout->orderUuidFromReference($reference) !==
            $hostingOrderUuid
        ) {
            throw ValidationException::withMessages([
                'hosting_order' => __(
                    'This payment attempt does not belong to this hosting order.',
                ),
            ]);
        }

        return $this->hostingCheckout->resolvePendingOrder(
            $hostingOrderUuid,
            $userId,
            $price->product_id,
            $price->id,
        );
    }

    public function validatePremiumSubdomainAttempt(
        string $paypalSubscriptionId,
        string $premiumPurchaseUuid,
        int $userId,
    ): HostingPremiumSubdomainPurchase {
        $response = $this->remoteSubscription($paypalSubscriptionId);
        $price = Price::where('paypal_id', $response['plan_id'])->firstOrFail();
        $reference = CheckoutReference::normalize(
            $response['custom_id'] ?? null,
        );

        if (
            $this->premiumSubdomains->purchaseUuidFromReference($reference) !==
            $premiumPurchaseUuid
        ) {
            throw ValidationException::withMessages([
                'premium_purchase' => __(
                    'This payment attempt does not belong to this premium address checkout.',
                ),
            ]);
        }

        return $this->premiumSubdomains->resolvePendingPurchase(
            $premiumPurchaseUuid,
            $userId,
            $price->product_id,
            $price->id,
        );
    }

    public function inspectRemoteSubscription(
        string $paypalSubscriptionId,
    ): ?array {
        $response = $this->paypal()->get(
            "billing/subscriptions/$paypalSubscriptionId",
        );

        if ($response->status() === 404) {
            return null;
        }

        $response->throw();

        $payload = $response->json();

        if (
            !is_array($payload) ||
            ($payload['id'] ?? null) !== $paypalSubscriptionId ||
            !is_string($payload['plan_id'] ?? null)
        ) {
            throw ValidationException::withMessages([
                'paypal_subscription_id' => __(
                    'PayPal returned an invalid subscription response.',
                ),
            ]);
        }

        return $payload;
    }

    public function cancelPendingHostingAttempt(
        string $paypalSubscriptionId,
    ): bool {
        $response = $this->paypal()->post(
            "billing/subscriptions/$paypalSubscriptionId/cancel",
            ['reason' => 'Hosting checkout expired before approval.'],
        );

        if ($response->status() === 404) {
            // A missing resource is ambiguous when merchant credentials or
            // sandbox/live mode changed. The caller must keep the local
            // reservation blocked for manual verification.
            return false;
        }

        $response->throw();

        return $response->successful();
    }

    private function remoteSubscription(string $paypalSubscriptionId): array
    {
        $payload = $this->inspectRemoteSubscription($paypalSubscriptionId);

        if (!$payload) {
            throw ValidationException::withMessages([
                'paypal_subscription_id' => __(
                    'The PayPal subscription could not be found.',
                ),
            ]);
        }

        return $payload;
    }

    private function validateHostingOrderIdentity(
        string $orderUuid,
        Price $price,
        ?int $requestedUserId,
        ?Subscription $subscription,
    ): HostingOrder {
        $order = HostingOrder::query()
            ->with(['user', 'account'])
            ->where('uuid', $orderUuid)
            ->lockForUpdate()
            ->first();

        $alreadyLinked =
            $subscription &&
            ($order?->subscription_id === $subscription->id ||
                $order?->account?->subscription_id === $subscription->id);

        if (
            !$order ||
            ($requestedUserId && $order->user_id !== $requestedUserId) ||
            ($subscription && $subscription->user_id !== $order->user_id) ||
            ($order->subscription_id && !$alreadyLinked) ||
            ($order->account && !$alreadyLinked) ||
            (!$alreadyLinked &&
                ($order->product_id !== $price->product_id ||
                    $order->price_id !== $price->id))
        ) {
            throw ValidationException::withMessages([
                'hosting_order' => __(
                    'This payment does not belong to this hosting order.',
                ),
            ]);
        }

        return $order;
    }

    private function resolveGenericCheckoutUser(
        array $response,
        ?int $requestedUserId,
    ): User {
        $payerId = Arr::get($response, 'subscriber.payer_id');

        if (!$requestedUserId) {
            return User::query()
                ->where('paypal_id', $payerId)
                ->lockForUpdate()
                ->firstOrFail();
        }

        $user = User::query()->lockForUpdate()->findOrFail($requestedUserId);
        $payerEmail = Str::lower(
            trim((string) Arr::get($response, 'subscriber.email_address', '')),
        );

        if (
            (!$user->paypal_id || $user->paypal_id !== $payerId) &&
            (!$payerEmail || $payerEmail !== Str::lower($user->email))
        ) {
            throw ValidationException::withMessages([
                'paypal_subscription_id' => __(
                    'The PayPal payer could not be verified for this account.',
                ),
            ]);
        }

        return $user;
    }

    public function createOrUpdateInvoice(
        Subscription $subscription,
        array $paypalSubscription,
    ): void {
        // subscription is no longer active, no need to update invoice
        if (!isset($paypalSubscription['billing_info']['next_billing_time'])) {
            return;
        }

        $startTime = Carbon::parse($paypalSubscription['start_time']);
        $renewsAt = Carbon::parse(
            $paypalSubscription['billing_info']['next_billing_time'],
        );

        $status =
            $paypalSubscription['status'] === 'ACTIVE'
                ? Invoice::STATUS_PAID
                : Invoice::STATUS_DRAFT;
        $amountPaid = $subscription->onTrial()
            ? 0
            : $this->priceToCents($subscription->price);

        $invoice = Invoice::query()
            ->where('subscription_id', $subscription->id)
            ->whereBetween('created_at', [$startTime, $renewsAt])
            ->first();

        if ($invoice) {
            // paid invoices should never be set to unpaid,
            // this could happen if webhooks arrive out of order
            if ($invoice->status !== Invoice::STATUS_PAID) {
                $invoice->update([
                    'status' => $status,
                ]);
            }

            if ($amountPaid > $invoice->amount_paid) {
                $invoice->update([
                    'amount_paid' => $amountPaid,
                    'currency' => $subscription->price->currency,
                ]);
            }
        } else {
            $invoice = Invoice::create([
                'subscription_id' => $subscription->id,
                'status' => $status,
                'amount_paid' => $amountPaid,
                'currency' => $subscription->price->currency,
                'uuid' => Str::random(10),
            ]);
        }

        if ($invoice->status === Invoice::STATUS_PAID && !$invoice->notified) {
            $subscription->user->notify(new NewInvoiceAvailable($invoice));
            $invoice->update(['notified' => true]);
        }
    }

    public function changePlan(
        Subscription $subscription,
        Product $newProduct,
        Price $newPrice,
    ): bool {
        $this->paypal()->post(
            "billing/subscriptions/$subscription->gateway_id/revise",
            [
                'plan_id' => $newPrice->paypal_id,
            ],
        );

        $this->sync($subscription->gateway_id, $subscription->user_id);

        return true;
    }

    public function cancel(
        Subscription $subscription,
        $atPeriodEnd = true,
    ): bool {
        if ($atPeriodEnd) {
            $this->paypal()->post(
                "billing/subscriptions/$subscription->gateway_id/suspend",
                ['reason' => 'User requested cancellation.'],
            );
        } else {
            $this->paypal()->post(
                "billing/subscriptions/$subscription->gateway_id/cancel",
                ['reason' => 'Subscription deleted locally.'],
            );
        }

        $this->sync($subscription->gateway_id, $subscription->user_id);

        return true;
    }

    public function resume(Subscription $subscription, array $params): bool
    {
        $this->paypal()->post(
            "billing/subscriptions/$subscription->gateway_id/activate",
            ['reason' => 'Subscription resumed by user.'],
        );

        $this->sync($subscription->gateway_id, $subscription->user_id);

        return true;
    }
}
