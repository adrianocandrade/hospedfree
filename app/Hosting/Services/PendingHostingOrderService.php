<?php

namespace App\Hosting\Services;

use App\Hosting\Enums\HostingOrderStatus;
use App\Hosting\Models\HostingCheckoutAttempt;
use App\Hosting\Models\HostingOrder;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PendingHostingOrderService
{
    public function cancel(HostingOrder $order): HostingOrder
    {
        return DB::transaction(function () use ($order): HostingOrder {
            $locked = HostingOrder::query()
                ->lockForUpdate()
                ->findOrFail($order->id);

            if ($locked->status === HostingOrderStatus::Cancelled) {
                if (
                    $locked->domain_reservation_key ||
                    !$locked->cancelled_at
                ) {
                    $locked->forceFill([
                        'domain_reservation_key' => null,
                        'cancelled_at' => $locked->cancelled_at ?? now(),
                    ])->save();
                }
                $this->supersedeCheckoutAttempts($locked);

                return $locked->loadMissing([
                    'account',
                    'plan.product',
                    'price',
                ]);
            }

            if (
                $locked->status !== HostingOrderStatus::AwaitingPayment ||
                $locked->subscription_id ||
                $locked->account()->exists() ||
                $this->hasPendingCheckoutAttempt($locked)
            ) {
                throw ValidationException::withMessages([
                    'order' => __(
                        'This hosting checkout has a payment attempt in progress and cannot be cancelled yet.',
                    ),
                ]);
            }

            return $this->cancelLocked($locked, now());
        }, attempts: 3);
    }

    public function expireDue(?CarbonInterface $at = null): int
    {
        return $this->expireQuery(HostingOrder::query(), $at ?? now());
    }

    public function expireDueForDomain(
        string $fqdn,
        ?CarbonInterface $at = null,
    ): int {
        return $this->expireQuery(
            HostingOrder::query()->where('domain_reservation_key', $fqdn),
            $at ?? now(),
        );
    }

    public function expireDueForUser(
        int $userId,
        ?CarbonInterface $at = null,
    ): int {
        return $this->expireQuery(
            HostingOrder::query()->where('user_id', $userId),
            $at ?? now(),
        );
    }

    private function expireQuery(Builder $query, CarbonInterface $at): int
    {
        $expired = 0;

        $query
            ->paymentWindowExpired($at)
            ->whereNull('subscription_id')
            ->whereDoesntHave('account')
            ->whereDoesntHave(
                'checkoutAttempts',
                fn(Builder $attempts): Builder => $attempts->whereIn(
                    'status',
                    ['pending', 'cancellation_pending', 'action_required'],
                ),
            )
            ->select('id')
            ->eachById(function (HostingOrder $candidate) use (
                $at,
                &$expired,
            ): void {
                if ($this->expireOne($candidate->id, $at)) {
                    $expired++;
                }
            });

        return $expired;
    }

    private function expireOne(int $orderId, CarbonInterface $at): bool
    {
        return DB::transaction(function () use ($orderId, $at): bool {
            $order = HostingOrder::query()
                ->lockForUpdate()
                ->find($orderId);

            if (
                !$order ||
                $order->status !== HostingOrderStatus::AwaitingPayment ||
                !$order->expires_at ||
                $order->expires_at->isAfter($at) ||
                $order->subscription_id ||
                $order->account()->exists() ||
                $this->hasPendingCheckoutAttempt($order)
            ) {
                return false;
            }

            $this->cancelLocked($order, $at);

            return true;
        }, attempts: 3);
    }

    private function cancelLocked(
        HostingOrder $order,
        CarbonInterface $cancelledAt,
    ): HostingOrder {
        $order->forceFill([
            'domain_reservation_key' => null,
            'cancelled_at' => $cancelledAt,
        ]);
        $order->transitionTo(HostingOrderStatus::Cancelled);

        $this->supersedeCheckoutAttempts($order);

        return $order->fresh(['account', 'plan.product', 'price']);
    }

    private function supersedeCheckoutAttempts(HostingOrder $order): void
    {
        HostingCheckoutAttempt::query()
            ->where('hosting_order_id', $order->id)
            ->whereIn('status', ['pending', 'cancellation_pending'])
            ->update([
                'status' => 'superseded',
                'updated_at' => now(),
            ]);
    }

    private function hasPendingCheckoutAttempt(HostingOrder $order): bool
    {
        return $order
            ->checkoutAttempts()
            ->whereIn(
                'status',
                ['pending', 'cancellation_pending', 'action_required'],
            )
            ->exists();
    }
}
