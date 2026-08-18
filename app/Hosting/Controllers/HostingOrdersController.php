<?php

namespace App\Hosting\Controllers;

use App\Hosting\Actions\CreateHostingOrder;
use App\Hosting\Models\HostingPlan;
use App\Hosting\Models\HostingZone;
use App\Hosting\Resources\HostingOrderResource;
use App\Hosting\Models\HostingOrder;
use App\Hosting\Services\PendingHostingOrderService;
use App\Hosting\Support\ResolvesPersonalWorkspace;
use Common\Billing\Models\Price;
use Common\Billing\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HostingOrdersController
{
    use ResolvesPersonalWorkspace;

    public function index(
        Request $request,
        PendingHostingOrderService $pendingOrders,
    ): AnonymousResourceCollection {
        $pendingOrders->expireDueForUser($request->user()->id);

        $orders = HostingOrder::query()
            ->where('user_id', $request->user()->id)
            ->where('status', \App\Hosting\Enums\HostingOrderStatus::AwaitingPayment)
            ->where(function ($checkout): void {
                $checkout
                    ->where(function ($window): void {
                        $window
                            ->whereNull('expires_at')
                            ->orWhere('expires_at', '>', now());
                    })
                    ->orWhereHas(
                        'checkoutAttempts',
                        fn($attempts) => $attempts->whereIn(
                            'status',
                            [
                                'pending',
                                'cancellation_pending',
                                'action_required',
                            ],
                        ),
                    );
            })
            ->whereDoesntHave('account')
            ->with(['plan.product', 'price'])
            ->latest('id')
            ->paginate(20);

        return HostingOrderResource::collection($orders);
    }

    public function store(Request $request, CreateHostingOrder $create): HostingOrderResource
    {
        $data = $request->validate([
            'hosting_plan_id' => ['required', 'integer'],
            'zone_id' => ['nullable', 'integer'],
            'subdomain' => ['required', 'string', 'max:63'],
            'price_id' => ['nullable', 'integer'],
            'subscription_id' => ['nullable', 'integer'],
            'idempotency_key' => ['nullable', 'string', 'min:16', 'max:80'],
        ]);

        $user = $request->user();
        $workspace = $this->personalWorkspace($user);
        $plan = HostingPlan::query()->with(['product', 'providerPackages'])->findOrFail($data['hosting_plan_id']);
        $zone = HostingZone::query()
            ->where('is_active', true)
            ->when(
                $data['zone_id'] ?? null,
                fn($query, $id) => $query->whereKey($id),
                fn($query) => $query->where('is_default', true),
            )
            ->firstOrFail();
        $price = isset($data['price_id'])
            ? Price::query()
                ->whereKey($data['price_id'])
                ->where('product_id', $plan->product_id)
                ->where('active', true)
                ->firstOrFail()
            : null;
        $subscription = isset($data['subscription_id'])
            ? Subscription::query()->whereKey($data['subscription_id'])->where('user_id', $user->id)->firstOrFail()
            : null;
        $idempotencyKey = $request->header('Idempotency-Key') ?: ($data['idempotency_key'] ?? null);

        if (!$idempotencyKey || strlen($idempotencyKey) > 80) {
            abort(422, 'A valid Idempotency-Key header is required.');
        }

        $order = $create->execute(
            $user,
            $workspace,
            $plan,
            $zone,
            $data['subdomain'],
            $idempotencyKey,
            $price,
            $subscription,
        );

        return new HostingOrderResource($order->loadMissing('account.plan.product'));
    }

    public function destroy(
        Request $request,
        int $order,
        PendingHostingOrderService $pendingOrders,
    ): HostingOrderResource {
        $ownedOrder = HostingOrder::query()
            ->whereKey($order)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        return new HostingOrderResource(
            $pendingOrders->cancel($ownedOrder),
        );
    }
}
