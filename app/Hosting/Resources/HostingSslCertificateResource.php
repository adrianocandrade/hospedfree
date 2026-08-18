<?php

namespace App\Hosting\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class HostingSslCertificateResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'hosting_account_id' => $this->hosting_account_id,
            'domain' => $this->domain,
            'status' => $this->status,
            'installation_status' => $this->installation_status,
            'renewal_status' => $this->renewal_status,
            'validation_method' => $this->validation_method,
            'dns_validation' => $this->dns_validation ? [
                'type' => $this->dns_validation['type'] ?? null,
                'name' => $this->dns_validation['name'] ?? null,
                'value' => $this->dns_validation['value'] ?? null,
                'ttl' => $this->dns_validation['ttl'] ?? null,
                'managed' => (bool) ($this->dns_validation['managed'] ?? false),
            ] : null,
            'renewal_dns_validation' => $this->renewal_dns_validation ? [
                'type' => $this->renewal_dns_validation['type'] ?? null,
                'name' => $this->renewal_dns_validation['name'] ?? null,
                'value' => $this->renewal_dns_validation['value'] ?? null,
                'ttl' => $this->renewal_dns_validation['ttl'] ?? null,
                'managed' => (bool) ($this->renewal_dns_validation['managed'] ?? false),
            ] : null,
            'safe_message' => $this->safe_message,
            'requested_at' => $this->requested_at,
            'verified_at' => $this->verified_at,
            'issued_at' => $this->issued_at,
            'installation_attempted_at' => $this->installation_attempted_at,
            'installed_at' => $this->installed_at,
            'last_checked_at' => $this->last_checked_at,
            'renewal_requested_at' => $this->renewal_requested_at,
            'renewal_retry_after' => $this->renewal_retry_after,
            'last_renewed_at' => $this->last_renewed_at,
            'valid_until' => $this->valid_until,
            'revoked_at' => $this->revoked_at,
            'created_at' => $this->created_at,
        ];
    }
}
