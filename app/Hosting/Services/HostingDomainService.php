<?php

namespace App\Hosting\Services;

use App\Hosting\Contracts\HostingProvider;
use App\Hosting\Data\ProviderResult;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Models\HostingOrder;
use App\Hosting\Models\HostingZone;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class HostingDomainService
{
    public function __construct(
        private HostingProvider $provider,
        private PendingHostingOrderService $pendingOrders,
    ) {}

    public function normalizeSubdomain(string $subdomain): string
    {
        $subdomain = strtolower(trim($subdomain));

        if (
            strlen($subdomain) < 3 ||
            strlen($subdomain) > 63 ||
            !preg_match('/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/', $subdomain)
        ) {
            throw ValidationException::withMessages([
                'subdomain' => __('Use 3 to 63 lowercase letters, numbers or internal hyphens.'),
            ]);
        }

        if (in_array($subdomain, config('hospedfree.reserved_subdomains', []), true)) {
            throw ValidationException::withMessages([
                'subdomain' => __('This address is reserved. Choose another one.'),
            ]);
        }

        return $subdomain;
    }

    public function fqdn(string $subdomain, HostingZone $zone): string
    {
        return $this->normalizeSubdomain($subdomain) . '.' . strtolower($zone->domain);
    }

    public function assertLocallyAvailable(string $fqdn): void
    {
        $this->pendingOrders->expireDueForDomain($fqdn);

        $isUsed = HostingAccount::withTrashed()
            ->where('active_domain', $fqdn)
            ->exists();
        $isReserved = HostingOrder::query()
            ->where('domain_reservation_key', $fqdn)
            ->exists();

        if ($isUsed || $isReserved) {
            throw ValidationException::withMessages([
                'subdomain' => __('This address is already in use.'),
            ]);
        }
    }

    public function checkAvailability(string $subdomain, HostingZone $zone): ProviderResult
    {
        $fqdn = $this->fqdn($subdomain, $zone);
        $this->assertLocallyAvailable($fqdn);

        $result = $this->provider->checkDomainAvailability($fqdn);

        if (!$result->success) {
            Log::warning('Hosting domain availability check failed.', [
                'provider' => $this->provider->key(),
                'code' => $result->code,
                'retryable' => $result->retryable,
                'fqdn_hash' => hash('sha256', $fqdn),
            ]);

            throw ValidationException::withMessages([
                'subdomain' => $result->code === 'domain_unavailable'
                    ? __('This address is not available.')
                    : __('Availability could not be checked right now. Try again shortly.'),
            ]);
        }

        return ProviderResult::ok(
            message: __('Address is available.'),
            status: 'available',
        );
    }
}
