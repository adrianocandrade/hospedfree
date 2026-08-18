<?php

namespace App\Hosting\Resources;

use App\Hosting\Contracts\HostingProvider;
use App\Hosting\Enums\HostingAccountStatus;
use App\Hosting\Enums\HostingPlanType;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Models\HostingOrder;
use Illuminate\Http\Resources\Json\JsonResource;

class HostingPlanResource extends JsonResource
{
    public function toArray($request): array
    {
        $providerReady = (bool) $this->packageFor(
            app(HostingProvider::class)->key(),
        );
        $gatewayColumns = [];
        if ((bool) settings('billing.stripe.enable')) {
            $gatewayColumns[] = 'stripe_id';
        }
        if ((bool) settings('billing.paypal.enable')) {
            $gatewayColumns[] = 'paypal_id';
        }
        $priceHasCheckout = function ($price) use ($gatewayColumns): bool {
            foreach ($gatewayColumns as $column) {
                if (filled($price->{$column})) {
                    return true;
                }
            }

            return false;
        };
        $hasCheckoutPrice = $this->product->prices->contains($priceHasCheckout);
        $purchaseAvailable =
            $providerReady &&
            ($this->type === HostingPlanType::Free
                ? (bool) $this->product->free
                : config('hospedfree.paid_enabled') && $hasCheckoutPrice);
        $creationUnavailableReason = $this->creationUnavailableReason(
            $request,
            $providerReady,
            $hasCheckoutPrice,
            $purchaseAvailable,
        );

        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'max_accounts_per_workspace' => $this->max_accounts_per_workspace,
            'quotas' => $this->quotas ?? [],
            'purchase_available' => $purchaseAvailable,
            'can_create_account' => $creationUnavailableReason === null,
            'creation_unavailable_reason' => $creationUnavailableReason,
            'product' => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'description' => $this->product->description,
                'features' => $this->product->feature_list,
                'recommended' => $this->product->recommended,
                'free' => $this->product->free,
            ],
            'prices' => $this->product->prices
                ->map(
                    fn($price) => [
                        'id' => $price->id,
                        'amount' => $price->amount,
                        'currency' => $price->currency,
                        'interval' => $price->interval,
                        'interval_count' => $price->interval_count,
                        'purchase_available' => $priceHasCheckout($price),
                    ],
                )
                ->values(),
            $this->mergeWhen(
                $request->user()?->hasPermission('hosting.settings'),
                [
                    'is_active' => (bool) $this->is_active,
                    'sort_order' => $this->sort_order,
                    'provider_packages' => $this->providerPackages
                        ->map(
                            fn($package) => [
                                'id' => $package->id,
                                'provider' => $package->provider,
                                'remote_package' => $package->remote_package,
                                'is_active' => (bool) $package->is_active,
                            ],
                        )
                        ->values(),
                ],
            ),
        ];
    }

    private function creationUnavailableReason(
        $request,
        bool $providerReady,
        bool $hasCheckoutPrice,
        bool $purchaseAvailable,
    ): ?string {
        if (!$providerReady) {
            return 'provider_unavailable';
        }

        if (
            $this->type === HostingPlanType::Paid &&
            !config('hospedfree.paid_enabled')
        ) {
            return 'paid_hosting_disabled';
        }

        if ($this->type === HostingPlanType::Paid && !$hasCheckoutPrice) {
            return 'checkout_unavailable';
        }

        if (!$purchaseAvailable) {
            return 'plan_unavailable';
        }

        $user = $request->user();

        // Public plan comparison cannot know the visitor's entitlement yet.
        // The authenticated creation endpoint remains the source of truth.
        if (!$user) {
            return null;
        }

        $workspace = $user->workspaces()->where('is_personal', true)->first();

        if (!$workspace) {
            return 'workspace_unavailable';
        }

        $accountCount = HostingAccount::withTrashed()
            ->where('workspace_id', $workspace->id)
            ->when(
                $this->type === HostingPlanType::Free,
                fn($query) => $query->whereNotNull('free_slot'),
                fn($query) => $query->where('hosting_plan_id', $this->id),
            )
            ->where('status', '!=', HostingAccountStatus::Deleted)
            ->count();
        $pendingOrderCount = HostingOrder::query()
            ->where('workspace_id', $workspace->id)
            ->where('hosting_plan_id', $this->id)
            ->paymentWindowActive()
            ->whereDoesntHave('account')
            ->count();

        if (
            $accountCount + $pendingOrderCount >=
            $this->max_accounts_per_workspace
        ) {
            return 'plan_account_limit_reached';
        }

        return null;
    }
}
