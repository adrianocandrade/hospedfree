<?php

namespace App\Hosting\Controllers;

use App\Hosting\Models\HostingZone;
use App\Hosting\Services\HostingDomainService;
use App\Hosting\Services\HostingPremiumSubdomainService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HostingAvailabilityController
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
        $premium = $premiumSubdomains->inspect(
            $request->user(),
            $subdomain,
            $zone,
        );

        if (!$premium['available']) {
            return response()->json([
                'available' => false,
                'can_use' => false,
                'subdomain' => $subdomain,
                'fqdn' => $domains->fqdn($subdomain, $zone),
                'zone' => ['id' => $zone->id, 'domain' => $zone->domain],
                'premium' => $premiumSubdomains->publicDecision($premium),
            ]);
        }

        $domains->checkAvailability($subdomain, $zone);

        if ($premium['is_premium'] && $premium['can_use']) {
            $premiumSubdomains->claimForUse(
                $request->user(),
                $subdomain,
                $zone,
            );
            $premium = $premiumSubdomains->inspect(
                $request->user(),
                $subdomain,
                $zone,
            );
        }

        return response()->json([
            'available' => true,
            'can_use' => $premium['can_use'],
            'subdomain' => $subdomain,
            'fqdn' => $domains->fqdn($subdomain, $zone),
            'zone' => ['id' => $zone->id, 'domain' => $zone->domain],
            'premium' => $premium['is_premium']
                ? $premiumSubdomains->publicDecision($premium)
                : null,
        ]);
    }
}
