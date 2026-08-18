<?php

namespace App\Hosting\Controllers;

use App\Hosting\Models\HostingAccount;
use App\Hosting\Models\HostingOrder;
use App\Hosting\Models\HostingPlan;
use App\Hosting\Models\HostingPremiumSubdomain;
use App\Hosting\Models\HostingPremiumSubdomainPurchase;
use App\Hosting\Models\HostingZone;
use App\Hosting\Services\HostingPremiumSubdomainService;
use App\Hosting\Support\AuthorizesHostingAdmin;
use App\Models\User;
use App\Security\AdministrativeSecurityEventRecorder;
use Common\Billing\Models\Price;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminPremiumSubdomainsController
{
    use AuthorizesHostingAdmin;

    public function index(
        Request $request,
        HostingPremiumSubdomainService $premiumSubdomains,
    ): JsonResponse {
        $this->authorizeHostingAdmin($request, 'hosting.settings');
        $premiumSubdomains->normalizeExpirations();

        $items = HostingPremiumSubdomain::query()
            ->with([
                'zone',
                'annualPrice.product',
                'assignedUser',
                'reservedUser',
                'subscription',
            ])
            ->orderBy('hosting_zone_id')
            ->orderBy('label')
            ->get()
            ->map(fn(HostingPremiumSubdomain $item) => $this->resource($item));

        $prices = Price::query()
            ->with('product')
            ->where('active', true)
            ->whereNotIn(
                'product_id',
                HostingPlan::query()->select('product_id'),
            )
            ->where(function ($query): void {
                $query
                    ->where(function ($annual): void {
                        $annual
                            ->where('interval', 'year')
                            ->where('interval_count', 1);
                    })
                    ->orWhere(function ($annual): void {
                        $annual
                            ->where('interval', 'month')
                            ->where('interval_count', 12);
                    });
            })
            ->orderBy('product_id')
            ->orderBy('amount')
            ->get()
            ->map(
                fn(Price $price) => [
                    'id' => $price->id,
                    'product_id' => $price->product_id,
                    'product_name' => $price->product?->name,
                    'amount' => $price->amount,
                    'currency' => $price->currency,
                    'interval' => $price->interval,
                    'interval_count' => $price->interval_count,
                    'purchase_available' => $this->priceHasCheckout($price),
                ],
            );

        return response()->json([
            'data' => $items,
            'options' => [
                'zones' => HostingZone::query()
                    ->where('is_active', true)
                    ->orderByDesc('is_default')
                    ->orderBy('domain')
                    ->get(['id', 'domain', 'is_default']),
                'annual_prices' => $prices,
                'standard_min_length' =>
                    HostingPremiumSubdomainService::STANDARD_MIN_LENGTH,
            ],
        ]);
    }

    public function store(
        Request $request,
        HostingPremiumSubdomainService $premiumSubdomains,
    ): JsonResponse {
        $this->authorizeHostingAdmin($request, 'hosting.settings');
        $payload = $this->validatedPayload($request, $premiumSubdomains);
        $premium = HostingPremiumSubdomain::create($payload);
        $this->recordAudit($request, 'premium_subdomain_created', $premium->id);

        return response()->json(
            [
                'data' => $this->resource(
                    $premium->load([
                        'zone',
                        'annualPrice.product',
                        'assignedUser',
                        'reservedUser',
                        'subscription',
                    ]),
                ),
            ],
            201,
        );
    }

    public function update(
        Request $request,
        int $premiumSubdomain,
        HostingPremiumSubdomainService $premiumSubdomains,
    ): JsonResponse {
        $this->authorizeHostingAdmin($request, 'hosting.settings');
        $premium = HostingPremiumSubdomain::query()->findOrFail(
            $premiumSubdomain,
        );
        $payload = $this->validatedPayload(
            $request,
            $premiumSubdomains,
            $premium,
        );
        $hasBindings = $this->hasHostingBindings($premium);

        if (
            $hasBindings &&
            ($payload['label'] !== $premium->label ||
                $payload['hosting_zone_id'] !== $premium->hosting_zone_id ||
                $payload['assigned_user_id'] !== $premium->assigned_user_id)
        ) {
            throw ValidationException::withMessages([
                'subdomain' => __(
                    'An address already linked to a hosting account cannot be renamed or reassigned.',
                ),
            ]);
        }

        if (
            $premium->subscription_id &&
            $payload['assigned_user_id'] !== $premium->assigned_user_id
        ) {
            throw ValidationException::withMessages([
                'grant_user_email' => __(
                    'A paid address cannot be reassigned while its subscription is linked.',
                ),
            ]);
        }

        if (
            ($premium->subscription_id || $hasBindings) &&
            $payload['annual_price_id'] !== $premium->annual_price_id
        ) {
            throw ValidationException::withMessages([
                'annual_price_id' => __(
                    'The annual price cannot be changed after the premium address is linked.',
                ),
            ]);
        }

        if ($premium->subscription_id) {
            $payload['subscription_id'] = $premium->subscription_id;
            $payload['assigned_user_id'] = $premium->assigned_user_id;
            $payload['complimentary_until'] = null;
        }

        $premium->update($payload);
        $this->recordAudit($request, 'premium_subdomain_updated', $premium->id);

        return response()->json([
            'data' => $this->resource(
                $premium->load([
                    'zone',
                    'annualPrice.product',
                    'assignedUser',
                    'reservedUser',
                    'subscription',
                ]),
            ),
        ]);
    }

    public function destroy(
        Request $request,
        int $premiumSubdomain,
    ): JsonResponse {
        $this->authorizeHostingAdmin($request, 'hosting.settings');
        $premium = HostingPremiumSubdomain::query()->findOrFail(
            $premiumSubdomain,
        );

        if (
            $premium->assigned_user_id ||
            $premium->subscription_id ||
            $premium->reserved_user_id ||
            HostingPremiumSubdomainPurchase::query()
                ->where('premium_subdomain_id', $premium->id)
                ->exists() ||
            $this->hasHostingBindings($premium)
        ) {
            throw ValidationException::withMessages([
                'subdomain' => __(
                    'Only an unassigned premium address without hosting history can be deleted.',
                ),
            ]);
        }

        $targetId = $premium->id;
        $premium->delete();
        $this->recordAudit($request, 'premium_subdomain_deleted', $targetId);

        return response()->json(['message' => __('Premium address deleted.')]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedPayload(
        Request $request,
        HostingPremiumSubdomainService $premiumSubdomains,
        ?HostingPremiumSubdomain $current = null,
    ): array {
        $zoneId = (int) $request->input('hosting_zone_id');
        $data = $request->validate([
            'hosting_zone_id' => [
                'required',
                'integer',
                'exists:hosting_zones,id',
            ],
            'label' => [
                'required',
                'string',
                'min:3',
                'max:4',
                'regex:/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/',
                Rule::unique('hosting_premium_subdomains', 'label')
                    ->where(
                        fn($query) => $query->where('hosting_zone_id', $zoneId),
                    )
                    ->ignore($current?->id),
            ],
            'annual_price_id' => ['nullable', 'integer', 'exists:prices,id'],
            'grant_user_email' => ['nullable', 'email', 'exists:users,email'],
            'complimentary_until' => ['nullable', 'date'],
            'is_active' => ['required', 'boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $label = Str::lower(trim($data['label']));
        if (!$premiumSubdomains->isPremiumLabel($label)) {
            throw ValidationException::withMessages([
                'label' => __('Premium names must have 3 or 4 characters.'),
            ]);
        }

        $price = isset($data['annual_price_id'])
            ? Price::query()
                ->with('product')
                ->where('active', true)
                ->findOrFail($data['annual_price_id'])
            : null;
        if (
            $price &&
            (!$premiumSubdomains->isAnnual($price) ||
                $price->product?->free ||
                HostingPlan::query()
                    ->where('product_id', $price->product_id)
                    ->exists())
        ) {
            throw ValidationException::withMessages([
                'annual_price_id' => __(
                    'Choose an active annual price from a product that is not a hosting plan.',
                ),
            ]);
        }

        $user = filled($data['grant_user_email'] ?? null)
            ? User::query()
                ->where('email', $data['grant_user_email'])
                ->firstOrFail()
            : null;

        if (
            ($data['is_active'] ?? false) &&
            !$price &&
            !$user &&
            !$current?->subscription_id
        ) {
            throw ValidationException::withMessages([
                'annual_price_id' => __(
                    'An active premium address needs an annual price or a complimentary user grant.',
                ),
            ]);
        }

        return [
            'hosting_zone_id' => (int) $data['hosting_zone_id'],
            'label' => $label,
            'annual_price_id' => $price?->id,
            'assigned_user_id' => $user?->id,
            'subscription_id' => null,
            'complimentary_until' => $user
                ? $data['complimentary_until'] ?? null
                : null,
            'reserved_user_id' => $current?->reserved_user_id,
            'reservation_expires_at' => $current?->reservation_expires_at,
            'is_active' => (bool) $data['is_active'],
            'notes' => filled($data['notes'] ?? null)
                ? trim($data['notes'])
                : null,
        ];
    }

    private function hasHostingBindings(HostingPremiumSubdomain $premium): bool
    {
        return HostingOrder::query()
            ->where('premium_subdomain_id', $premium->id)
            ->exists() ||
            HostingAccount::withTrashed()
                ->where('premium_subdomain_id', $premium->id)
                ->exists();
    }

    /**
     * @return array<string, mixed>
     */
    private function resource(HostingPremiumSubdomain $premium): array
    {
        $status = match (true) {
            !$premium->is_active => 'inactive',
            (bool) $premium->subscription_id &&
                !$premium->subscription?->valid()
                => 'expired',
            (bool) $premium->subscription_id => 'paid',
            (bool) $premium->assigned_user_id &&
                $premium->complimentary_until?->isPast()
                => 'expired',
            (bool) $premium->assigned_user_id => 'complimentary',
            $premium->reservation_expires_at?->isFuture() === true
                => 'reserved',
            (bool) $premium->annual_price_id => 'for_sale',
            default => 'draft',
        };

        return [
            'id' => $premium->id,
            'hosting_zone_id' => $premium->hosting_zone_id,
            'label' => $premium->label,
            'fqdn' => $premium->label . '.' . $premium->zone?->domain,
            'annual_price_id' => $premium->annual_price_id,
            'price' => $premium->annualPrice
                ? [
                    'id' => $premium->annualPrice->id,
                    'product_id' => $premium->annualPrice->product_id,
                    'product_name' => $premium->annualPrice->product?->name,
                    'amount' => $premium->annualPrice->amount,
                    'currency' => $premium->annualPrice->currency,
                    'interval' => $premium->annualPrice->interval,
                    'interval_count' => $premium->annualPrice->interval_count,
                    'purchase_available' => $this->priceHasCheckout(
                        $premium->annualPrice,
                    ),
                ]
                : null,
            'assigned_user' => $premium->assignedUser
                ? [
                    'id' => $premium->assignedUser->id,
                    'email' => $premium->assignedUser->email,
                ]
                : null,
            'subscription_id' => $premium->subscription_id,
            'complimentary_until' => $premium->complimentary_until?->toIso8601String(),
            'reserved_user' => $premium->reservedUser
                ? [
                    'id' => $premium->reservedUser->id,
                    'email' => $premium->reservedUser->email,
                ]
                : null,
            'reservation_expires_at' => $premium->reservation_expires_at?->toIso8601String(),
            'is_active' => $premium->is_active,
            'notes' => $premium->notes,
            'status' => $status,
            'can_delete' =>
                !$premium->assigned_user_id &&
                !$premium->subscription_id &&
                !$premium->reserved_user_id &&
                !HostingPremiumSubdomainPurchase::query()
                    ->where('premium_subdomain_id', $premium->id)
                    ->exists() &&
                !$this->hasHostingBindings($premium),
        ];
    }

    private function priceHasCheckout(Price $price): bool
    {
        return ((bool) settings('billing.stripe.enable') &&
            filled($price->stripe_id)) ||
            ((bool) settings('billing.paypal.enable') &&
                filled($price->paypal_id));
    }

    private function recordAudit(
        Request $request,
        string $event,
        int $targetId,
    ): void {
        $actor = $request->user();
        if (!$actor?->getKey()) {
            return;
        }

        app(AdministrativeSecurityEventRecorder::class)->record(
            $actor,
            $event,
            HostingPremiumSubdomain::class,
            $targetId,
            $request,
        );
    }
}
