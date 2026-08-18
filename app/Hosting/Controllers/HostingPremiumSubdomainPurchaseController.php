<?php

namespace App\Hosting\Controllers;

use App\Hosting\Models\HostingZone;
use App\Hosting\Services\HostingDomainService;
use App\Hosting\Services\HostingPremiumSubdomainService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class HostingPremiumSubdomainPurchaseController
{
    public function __invoke(
        Request $request,
        HostingDomainService $domains,
        HostingPremiumSubdomainService $premiumSubdomains,
    ): JsonResponse {
        $data = $request->validate([
            'subdomain' => ['required', 'string', 'max:63'],
            'zone_id' => ['nullable', 'integer'],
        ]);

        $zone = HostingZone::query()
            ->where('is_active', true)
            ->when(
                $data['zone_id'] ?? null,
                fn($query, $id) => $query->whereKey($id),
                fn($query) => $query->where('is_default', true),
            )
            ->firstOrFail();
        $subdomain = $domains->normalizeSubdomain($data['subdomain']);
        $decision = $premiumSubdomains->inspect(
            $request->user(),
            $subdomain,
            $zone,
        );

        if (!$decision['requires_purchase']) {
            throw ValidationException::withMessages([
                'subdomain' => __(
                    'This premium address is not available for purchase.',
                ),
            ]);
        }

        $domains->checkAvailability($subdomain, $zone);

        return response()->json([
            'subdomain' => $subdomain,
            'fqdn' => $domains->fqdn($subdomain, $zone),
            'premium' => $premiumSubdomains->reserveForPurchase(
                $request->user(),
                $subdomain,
                $zone,
            ),
        ]);
    }
}
