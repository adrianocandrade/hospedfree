<?php

namespace App\Hosting\Services;

use App\Hosting\Enums\HostingAccountStatus;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Models\HostingPlan;
use App\Hosting\Models\HostingPremiumSubdomain;
use App\Hosting\Models\HostingPremiumSubdomainPurchase;
use App\Hosting\Models\HostingZone;
use App\Models\User;
use Common\Billing\Checkout\CheckoutReference;
use Common\Billing\Models\Price;
use Common\Billing\Subscription;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class HostingPremiumSubdomainService
{
    public const STANDARD_MIN_LENGTH = 5;
    public const REFERENCE_CONTEXT = 'premium_subdomain_purchase';

    public function isPremiumLabel(string $label): bool
    {
        return strlen($label) < self::STANDARD_MIN_LENGTH;
    }

    /** @return array<string, mixed> */
    public function inspect(User $user, string $label, HostingZone $zone): array
    {
        if (!$this->isPremiumLabel($label)) {
            return $this->standardDecision();
        }

        return DB::transaction(function () use ($user, $label, $zone): array {
            $offer = $this->lockedOffer($label, $zone);
            $this->releaseExpiredReservation($offer);

            if ($offer->assigned_user_id) {
                if ($offer->assigned_user_id !== $user->id) {
                    return $this->unavailableDecision($offer);
                }

                if ($this->hasCurrentEntitlement($offer, $user)) {
                    return $this->authorizedDecision(
                        $offer,
                        $offer->subscription_id
                            ? 'subscription'
                            : 'complimentary',
                    );
                }

                return $this->purchaseDecision($offer, $user);
            }

            if (
                $offer->reserved_user_id &&
                $offer->reserved_user_id !== $user->id
            ) {
                return $this->unavailableDecision($offer);
            }

            return $this->purchaseDecision($offer, $user);
        });
    }

    public function claimForUse(
        User $user,
        string $label,
        HostingZone $zone,
    ): ?HostingPremiumSubdomain {
        if (!$this->isPremiumLabel($label)) {
            return null;
        }

        if (DB::transactionLevel() === 0) {
            return DB::transaction(
                fn() => $this->claimForUse($user, $label, $zone),
            );
        }

        $offer = $this->lockedOffer($label, $zone);
        $this->releaseExpiredReservation($offer);

        if (
            $offer->assigned_user_id &&
            $offer->assigned_user_id !== $user->id
        ) {
            $this->notAvailable();
        }

        if (!$this->hasCurrentEntitlement($offer, $user)) {
            throw ValidationException::withMessages([
                'subdomain' => __(
                    'This premium address requires an active annual subscription or an administrator grant.',
                ),
            ]);
        }

        return $offer;
    }

    /** @return array<string, mixed> */
    public function reserveForPurchase(
        User $user,
        string $label,
        HostingZone $zone,
    ): array {
        if (!$this->isPremiumLabel($label)) {
            throw ValidationException::withMessages([
                'subdomain' => __(
                    'Only premium addresses need a purchase reservation.',
                ),
            ]);
        }

        return DB::transaction(function () use ($user, $label, $zone): array {
            $offer = $this->lockedOffer($label, $zone);
            $this->releaseExpiredReservation($offer);

            if (
                $offer->assigned_user_id &&
                $offer->assigned_user_id !== $user->id
            ) {
                $this->notAvailable();
            }

            if ($this->hasCurrentEntitlement($offer, $user)) {
                throw ValidationException::withMessages([
                    'subdomain' => __(
                        'This premium address is already active for your account.',
                    ),
                ]);
            }

            if (
                $offer->reserved_user_id &&
                $offer->reserved_user_id !== $user->id
            ) {
                $this->notAvailable();
            }

            if (!$this->priceIsPurchasable($offer->annualPrice)) {
                throw ValidationException::withMessages([
                    'subdomain' => __(
                        'Checkout is not configured for this premium address.',
                    ),
                ]);
            }

            $expiresAt = now()->addMinutes(
                max(
                    15,
                    (int) config('hospedfree.premium_reservation_minutes', 30),
                ),
            );
            $offer
                ->forceFill([
                    'reserved_user_id' => $user->id,
                    'reservation_expires_at' => $expiresAt,
                ])
                ->save();

            $purchase = HostingPremiumSubdomainPurchase::query()
                ->where('premium_subdomain_id', $offer->id)
                ->where('user_id', $user->id)
                ->where('price_id', $offer->annual_price_id)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->latest('id')
                ->first();

            if ($purchase) {
                $purchase
                    ->forceFill([
                        'expires_at' => $expiresAt,
                        'failure_code' => null,
                    ])
                    ->save();
            } else {
                $purchase = HostingPremiumSubdomainPurchase::create([
                    'uuid' => (string) Str::uuid7(),
                    'premium_subdomain_id' => $offer->id,
                    'user_id' => $user->id,
                    'price_id' => $offer->annual_price_id,
                    'status' => 'pending',
                    'expires_at' => $expiresAt,
                ]);
            }

            $decision = $this->publicDecision(
                $this->purchaseDecision(
                    $offer->fresh(['annualPrice.product']),
                    $user,
                ),
            );
            $decision['purchase'] = ['uuid' => $purchase->uuid];

            return $decision;
        });
    }

    public function resolvePendingPurchase(
        string $uuid,
        int $userId,
        int $productId,
        int $priceId,
    ): HostingPremiumSubdomainPurchase {
        $purchase = HostingPremiumSubdomainPurchase::query()
            ->with(['premiumSubdomain', 'user', 'price'])
            ->where('uuid', $uuid)
            ->lockForUpdate()
            ->first();

        if (
            !$purchase ||
            $purchase->user_id !== $userId ||
            $purchase->price_id !== $priceId ||
            $purchase->price?->product_id !== $productId ||
            $purchase->status !== 'pending' ||
            $purchase->expires_at->isPast() ||
            !$purchase->premiumSubdomain?->is_active ||
            $purchase->premiumSubdomain->reserved_user_id !== $userId ||
            $purchase->premiumSubdomain->reservation_expires_at?->isPast()
        ) {
            throw ValidationException::withMessages([
                'premium_purchase' => __(
                    'This premium address checkout is no longer available.',
                ),
            ]);
        }

        return $purchase;
    }

    public function referenceForPurchase(
        HostingPremiumSubdomainPurchase $purchase,
    ): string {
        return CheckoutReference::make(
            self::REFERENCE_CONTEXT,
            $purchase->uuid,
        );
    }

    public function purchaseUuidFromReference(mixed $reference): ?string
    {
        return CheckoutReference::identifierFor(
            $reference,
            self::REFERENCE_CONTEXT,
        );
    }

    public function registerGatewayAttempt(
        HostingPremiumSubdomainPurchase $purchase,
        string $gateway,
        string $gatewaySubscriptionId,
    ): void {
        DB::transaction(function () use (
            $purchase,
            $gateway,
            $gatewaySubscriptionId,
        ): void {
            $locked = HostingPremiumSubdomainPurchase::query()
                ->lockForUpdate()
                ->findOrFail($purchase->id);
            if ($locked->status !== 'pending') {
                throw ValidationException::withMessages([
                    'premium_purchase' => __(
                        'This premium address checkout is no longer available.',
                    ),
                ]);
            }
            if (
                $locked->gateway_subscription_id &&
                ($locked->gateway !== $gateway ||
                    $locked->gateway_subscription_id !== $gatewaySubscriptionId)
            ) {
                throw ValidationException::withMessages([
                    'premium_purchase' => __(
                        'This premium address already has another payment attempt.',
                    ),
                ]);
            }

            $offer = HostingPremiumSubdomain::query()
                ->lockForUpdate()
                ->findOrFail($locked->premium_subdomain_id);
            if (
                $offer->reserved_user_id !== $locked->user_id ||
                $offer->reservation_expires_at?->isPast()
            ) {
                throw ValidationException::withMessages([
                    'premium_purchase' => __(
                        'This premium address checkout is no longer available.',
                    ),
                ]);
            }

            $attemptExpiresAt = now()->addMinutes(
                max(
                    60,
                    (int) config(
                        'hospedfree.checkout_attempt_grace_minutes',
                        60,
                    ),
                ),
            );

            $locked
                ->forceFill([
                    'gateway' => $gateway,
                    'gateway_subscription_id' => $gatewaySubscriptionId,
                    'expires_at' => $attemptExpiresAt,
                ])
                ->save();
            $offer
                ->forceFill([
                    'reservation_expires_at' => $attemptExpiresAt,
                ])
                ->save();
        }, attempts: 3);
    }

    public function resolvePurchaseOwnerForPayment(
        string $uuid,
        Price $price,
        ?int $requestedUserId,
        ?Subscription $subscription,
    ): User {
        $purchase = HostingPremiumSubdomainPurchase::query()
            ->with('user')
            ->where('uuid', $uuid)
            ->lockForUpdate()
            ->first();

        if (
            !$purchase ||
            $purchase->price_id !== $price->id ||
            ($requestedUserId && $purchase->user_id !== $requestedUserId) ||
            ($subscription && $subscription->user_id !== $purchase->user_id) ||
            ($purchase->subscription_id &&
                (!$subscription ||
                    $purchase->subscription_id !== $subscription->id))
        ) {
            throw ValidationException::withMessages([
                'premium_purchase' => __(
                    'This payment does not belong to this premium address checkout.',
                ),
            ]);
        }

        return $purchase->user;
    }

    public function assertSubscriptionMatchesPurchase(
        Subscription $subscription,
        string $purchaseUuid,
        int $userId,
    ): HostingPremiumSubdomainPurchase {
        $purchase = HostingPremiumSubdomainPurchase::query()
            ->where('uuid', $purchaseUuid)
            ->first();

        if (
            !$purchase ||
            $purchase->user_id !== $userId ||
            $subscription->user_id !== $userId ||
            $purchase->price_id !== $subscription->price_id ||
            ($purchase->subscription_id &&
                $purchase->subscription_id !== $subscription->id) ||
            $this->purchaseUuidFromReference(
                $subscription->checkout_reference,
            ) !== $purchaseUuid
        ) {
            throw ValidationException::withMessages([
                'premium_purchase' => __(
                    'This payment does not belong to this premium address checkout.',
                ),
            ]);
        }

        $this->reconcileSubscription($subscription);

        return $purchase->fresh();
    }

    public function reconcileSubscription(Subscription $subscription): void
    {
        $purchaseUuid = $this->purchaseUuidFromReference(
            $subscription->checkout_reference,
        );
        if (!$purchaseUuid) {
            $this->reconcileExistingEntitlement($subscription);
            return;
        }

        try {
            DB::transaction(function () use (
                $subscription,
                $purchaseUuid,
            ): void {
                $lockedSubscription = Subscription::query()
                    ->with('price')
                    ->lockForUpdate()
                    ->findOrFail($subscription->id);
                $purchase = HostingPremiumSubdomainPurchase::query()
                    ->with('premiumSubdomain')
                    ->where('uuid', $purchaseUuid)
                    ->lockForUpdate()
                    ->first();

                if (!$purchase) {
                    return;
                }

                $offer = HostingPremiumSubdomain::query()
                    ->with('subscription')
                    ->lockForUpdate()
                    ->findOrFail($purchase->premium_subdomain_id);

                if (
                    $purchase->user_id !== $lockedSubscription->user_id ||
                    $purchase->price_id !== $lockedSubscription->price_id ||
                    $lockedSubscription->product_id !==
                        $lockedSubscription->price?->product_id
                ) {
                    $purchase
                        ->forceFill([
                            'status' => 'action_required',
                            'subscription_id' => $lockedSubscription->id,
                            'failure_code' => 'payment_identity_mismatch',
                        ])
                        ->save();
                    return;
                }

                if (!$lockedSubscription->valid()) {
                    $purchase
                        ->forceFill([
                            'status' => 'expired',
                            'subscription_id' => $lockedSubscription->id,
                            'failure_code' => 'subscription_inactive',
                        ])
                        ->save();
                    return;
                }

                $reservedByAnother =
                    $offer->reserved_user_id &&
                    $offer->reserved_user_id !== $purchase->user_id &&
                    $offer->reservation_expires_at?->isFuture();
                $ownedByAnother =
                    $offer->assigned_user_id &&
                    $offer->assigned_user_id !== $purchase->user_id;

                if ($reservedByAnother || $ownedByAnother) {
                    $purchase
                        ->forceFill([
                            'status' => 'action_required',
                            'subscription_id' => $lockedSubscription->id,
                            'failure_code' => 'address_no_longer_available',
                        ])
                        ->save();
                    return;
                }

                $offer
                    ->forceFill([
                        'assigned_user_id' => $purchase->user_id,
                        'subscription_id' => $lockedSubscription->id,
                        'complimentary_until' => null,
                        'reserved_user_id' => null,
                        'reservation_expires_at' => null,
                    ])
                    ->save();
                $purchase
                    ->forceFill([
                        'status' => 'confirmed',
                        'subscription_id' => $lockedSubscription->id,
                        'failure_code' => null,
                    ])
                    ->save();
            }, attempts: 3);
        } catch (QueryException) {
            HostingPremiumSubdomainPurchase::query()
                ->where('uuid', $purchaseUuid)
                ->update([
                    'status' => 'action_required',
                    'failure_code' => 'subscription_conflict',
                ]);
        }

        $this->markExpiredHostingForReview($subscription);
    }

    public function subscriptionDeleting(Subscription $subscription): void
    {
        $this->markExpiredHostingForReview($subscription, true);
        HostingPremiumSubdomainPurchase::query()
            ->where('subscription_id', $subscription->id)
            ->update([
                'status' => 'expired',
                'subscription_id' => null,
                'failure_code' => 'subscription_deleted',
            ]);
        HostingPremiumSubdomain::query()
            ->where('subscription_id', $subscription->id)
            ->update([
                'subscription_id' => null,
                'complimentary_until' => now()->subSecond(),
            ]);
    }

    public function normalizeExpirations(): void
    {
        HostingPremiumSubdomain::query()
            ->whereNotNull('reservation_expires_at')
            ->where('reservation_expires_at', '<=', now())
            ->each(function (HostingPremiumSubdomain $offer): void {
                DB::transaction(function () use ($offer): void {
                    $locked = HostingPremiumSubdomain::query()
                        ->lockForUpdate()
                        ->find($offer->id);
                    if ($locked) {
                        $this->releaseExpiredReservation($locked);
                    }
                });
            });
    }

    /** @param array<string, mixed> $decision
     * @return array<string, mixed>
     */
    public function publicDecision(array $decision): array
    {
        unset($decision['offer']);
        return $decision;
    }

    public function isAnnual(Price $price): bool
    {
        return ($price->interval === 'year' && $price->interval_count === 1) ||
            ($price->interval === 'month' && $price->interval_count === 12);
    }

    private function lockedOffer(
        string $label,
        HostingZone $zone,
    ): HostingPremiumSubdomain {
        $offer = HostingPremiumSubdomain::query()
            ->with(['annualPrice.product', 'subscription'])
            ->where('hosting_zone_id', $zone->id)
            ->where('label', $label)
            ->where('is_active', true)
            ->lockForUpdate()
            ->first();

        if (!$offer) {
            throw ValidationException::withMessages([
                'subdomain' => __(
                    'Names with 3 or 4 characters are premium and must be made available by an administrator.',
                ),
            ]);
        }

        return $offer;
    }

    private function releaseExpiredReservation(
        HostingPremiumSubdomain $offer,
    ): void {
        if (!$offer->reservation_expires_at?->isPast()) {
            return;
        }

        HostingPremiumSubdomainPurchase::query()
            ->where('premium_subdomain_id', $offer->id)
            ->where('status', 'pending')
            ->where('expires_at', '<=', now())
            ->update([
                'status' => 'expired',
                'failure_code' => 'reservation_expired',
            ]);
        $offer
            ->forceFill([
                'reserved_user_id' => null,
                'reservation_expires_at' => null,
            ])
            ->save();
    }

    private function hasCurrentEntitlement(
        HostingPremiumSubdomain $offer,
        User $user,
    ): bool {
        if ($offer->assigned_user_id !== $user->id) {
            return false;
        }
        if ($offer->subscription_id) {
            return (bool) $offer->subscription?->valid();
        }
        return !$offer->complimentary_until ||
            $offer->complimentary_until->isFuture();
    }

    private function priceIsPurchasable(?Price $price): bool
    {
        if (
            !$price ||
            !$price->active ||
            $price->product?->free ||
            !$this->isAnnual($price) ||
            HostingPlan::query()
                ->where('product_id', $price->product_id)
                ->exists()
        ) {
            return false;
        }

        return ((bool) settings('billing.stripe.enable') &&
            filled($price->stripe_id)) ||
            ((bool) settings('billing.paypal.enable') &&
                filled($price->paypal_id));
    }

    private function reconcileExistingEntitlement(
        Subscription $subscription,
    ): void {
        $offer = HostingPremiumSubdomain::query()
            ->where('subscription_id', $subscription->id)
            ->first();
        if (!$offer) {
            return;
        }

        HostingPremiumSubdomainPurchase::query()
            ->where('subscription_id', $subscription->id)
            ->update([
                'status' => $subscription->valid() ? 'confirmed' : 'expired',
                'failure_code' => $subscription->valid()
                    ? null
                    : 'subscription_inactive',
            ]);
        $this->markExpiredHostingForReview($subscription);
    }

    private function markExpiredHostingForReview(
        Subscription $subscription,
        bool $force = false,
    ): void {
        if (!$force && $subscription->valid()) {
            return;
        }

        $offer = HostingPremiumSubdomain::query()
            ->where('subscription_id', $subscription->id)
            ->first();
        $account = $offer
            ? HostingAccount::query()
                ->where('premium_subdomain_id', $offer->id)
                ->first()
            : null;

        if (
            $account &&
            in_array(
                $account->status,
                [
                    HostingAccountStatus::Active,
                    HostingAccountStatus::Suspended,
                    HostingAccountStatus::Provisioning,
                ],
                true,
            )
        ) {
            $account->transitionTo(
                HostingAccountStatus::ActionRequired,
                safeMessage: 'The annual premium address entitlement ended; the site was preserved for operational review.',
                metadata: [
                    'code' => 'premium_address_entitlement_ended',
                    'notify_customer' => true,
                ],
            );
        }
    }

    /** @return array<string, mixed> */
    private function standardDecision(): array
    {
        return [
            'is_premium' => false,
            'available' => true,
            'can_use' => true,
            'requires_purchase' => false,
            'entitlement' => 'standard',
            'price' => null,
            'reserved_until' => null,
            'offer' => null,
        ];
    }

    /** @return array<string, mixed> */
    private function authorizedDecision(
        HostingPremiumSubdomain $offer,
        string $entitlement,
    ): array {
        return [
            'is_premium' => true,
            'available' => true,
            'can_use' => true,
            'requires_purchase' => false,
            'entitlement' => $entitlement,
            'price' => $this->priceData($offer->annualPrice),
            'reserved_until' => $offer->reservation_expires_at?->toIso8601String(),
            'offer' => $offer,
        ];
    }

    /** @return array<string, mixed> */
    private function purchaseDecision(
        HostingPremiumSubdomain $offer,
        User $user,
    ): array {
        $purchasable = $this->priceIsPurchasable($offer->annualPrice);
        return [
            'is_premium' => true,
            'available' => $purchasable,
            'can_use' => false,
            'requires_purchase' => $purchasable,
            'entitlement' => null,
            'price' => $this->priceData($offer->annualPrice),
            'reserved_until' =>
                $offer->reserved_user_id === $user->id
                    ? $offer->reservation_expires_at?->toIso8601String()
                    : null,
            'offer' => $offer,
        ];
    }

    /** @return array<string, mixed> */
    private function unavailableDecision(HostingPremiumSubdomain $offer): array
    {
        return [
            'is_premium' => true,
            'available' => false,
            'can_use' => false,
            'requires_purchase' => false,
            'entitlement' => null,
            'price' => null,
            'reserved_until' => null,
            'offer' => $offer,
        ];
    }

    /** @return array<string, mixed>|null */
    private function priceData(?Price $price): ?array
    {
        if (!$price) {
            return null;
        }
        return [
            'id' => $price->id,
            'product_id' => $price->product_id,
            'product_name' => $price->product?->name,
            'amount' => $price->amount,
            'currency' => $price->currency,
            'interval' => $price->interval,
            'interval_count' => $price->interval_count,
            'purchase_available' => $this->priceIsPurchasable($price),
        ];
    }

    private function notAvailable(): never
    {
        throw ValidationException::withMessages([
            'subdomain' => __('This premium address is not available.'),
        ]);
    }
}
