<?php

namespace App\Hosting\Services;

use App\Hosting\Contracts\HostingDomainProvider;
use App\Hosting\Data\HostingDomainData;
use App\Hosting\Data\ProviderResponse;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Models\HostingDomain;
use Illuminate\Support\Collection;

class HostingDomainSyncService
{
    public function ensurePrimary(HostingAccount $account): HostingDomain
    {
        $domain = HostingDomain::query()->firstOrNew([
            'hosting_account_id' => $account->id,
            'domain' => strtolower($account->fqdn),
        ]);

        $domain->type = 'primary';
        $domain->is_primary = true;

        if (!$domain->exists) {
            $domain->status = $account->status->value;
            $domain->next_check_at = $account->provider_account_id
                ? now()
                : null;
        }

        $domain->save();

        return $domain;
    }

    public function due(HostingAccount $account): bool
    {
        $this->ensurePrimary($account);

        return $account->domains()
            ->whereNotNull('next_check_at')
            ->where('next_check_at', '<=', now())
            ->exists();
    }

    public function refresh(
        HostingAccount $account,
        HostingDomainProvider $provider,
    ): ProviderResponse {
        $primary = $this->ensurePrimary($account);

        if (!$account->provider_account_id) {
            return ProviderResponse::failure(
                'account_not_ready',
                'The hosting account is not ready.',
            );
        }

        $result = $provider->listDomains(
            $account->username ?: $account->provider_account_id,
            $account->fqdn,
        );

        if (!$result->success || !is_array($result->data)) {
            $dueDomains = $account->domains()
                ->whereNotNull('next_check_at')
                ->where('next_check_at', '<=', now())
                ->get();

            ($dueDomains->isEmpty() ? collect([$primary]) : $dueDomains)
                ->each(
                    fn(HostingDomain $domain) => $this->recordFailure(
                        $domain,
                        $result->code,
                        $result->retryable,
                    ),
                );

            return $result;
        }

        $reported = collect($result->data)
            ->filter(fn(mixed $domain) => $domain instanceof HostingDomainData)
            ->push(new HostingDomainData(
                domain: $account->fqdn,
                type: 'primary',
                status: $account->status->value,
                isPrimary: true,
            ))
            ->unique(fn(HostingDomainData $domain) => strtolower($domain->domain))
            ->values();

        $reported
            ->each(fn(HostingDomainData $domain) => $this->persist($account, $domain));

        $reportedDomains = $reported
            ->map(fn(HostingDomainData $domain) => strtolower($domain->domain))
            ->all();
        $account->domains()
            ->where('is_primary', false)
            ->whereNotNull('next_check_at')
            ->whereNotIn('domain', $reportedDomains)
            ->get()
            ->each(fn(HostingDomain $domain) => $this->recordMissing($domain));

        return $result;
    }

    public function persist(
        HostingAccount $account,
        HostingDomainData $domain,
        ?string $dnsStatus = null,
        ?string $safeCode = null,
        ?array $instructions = null,
        bool $restartReconciliation = false,
    ): HostingDomain {
        $active = $domain->status === 'active';
        $transient = in_array($domain->status, [
            'creating',
            'pending',
            'pending_verification',
            'processing',
            'provisioning',
            'verifying',
        ], true);
        $stored = HostingDomain::query()->firstOrNew([
            'hosting_account_id' => $account->id,
            'domain' => strtolower($domain->domain),
        ]);
        $maxAttempts = $this->maxReconcileAttempts();
        $attempts = $active || !$transient
            ? 0
            : min(
                $maxAttempts,
                $restartReconciliation
                    ? 1
                    : ((int) $stored->reconcile_attempts + 1),
            );
        $exhausted = $transient && $attempts >= $maxAttempts;
        $delay = min(3600, 15 * (2 ** min(7, max(0, $attempts - 1))));

        $stored->fill([
            'type' => $domain->type,
            'status' => $domain->status,
            'is_primary' => $domain->isPrimary,
            'dns_status' => $dnsStatus ?? ($active ? 'verified' : null),
            'safe_code' => $exhausted
                ? 'domain_reconciliation_limit_reached'
                : ($safeCode ?? ($active ? 'domain_active' : null)),
            'dns_instructions' => $instructions,
            'failure_count' => 0,
            'reconcile_attempts' => $attempts,
            'last_checked_at' => now(),
            'next_check_at' => $transient && !$exhausted
                ? now()->addSeconds($delay)
                : null,
        ])->save();

        return $stored;
    }

    public function forget(HostingAccount $account, string $domain): void
    {
        $account->domains()->where('domain', strtolower($domain))->delete();
    }

    /** @return Collection<int, HostingDomain> */
    public function domains(HostingAccount $account): Collection
    {
        return $account->domains()
            ->orderByDesc('is_primary')
            ->orderBy('domain')
            ->get();
    }

    private function recordFailure(
        HostingDomain $domain,
        string $safeCode,
        bool $retryable,
    ): void {
        $maxAttempts = $this->maxReconcileAttempts();
        $failures = min($maxAttempts, $domain->failure_count + 1);
        $delay = min(3600, 15 * (2 ** min(7, $failures - 1)));

        $domain->forceFill([
            'safe_code' => $safeCode,
            'failure_count' => $failures,
            'last_checked_at' => now(),
            'next_check_at' => $retryable && $failures < $maxAttempts
                ? now()->addSeconds($delay)
                : null,
        ])->save();
    }

    private function recordMissing(HostingDomain $domain): void
    {
        $maxAttempts = $this->maxReconcileAttempts();
        $attempts = min($maxAttempts, $domain->reconcile_attempts + 1);
        $exhausted = $attempts >= $maxAttempts;
        $delay = min(3600, 15 * (2 ** min(7, max(0, $attempts - 1))));

        $domain->forceFill([
            'safe_code' => $exhausted
                ? 'domain_reconciliation_limit_reached'
                : 'domain_not_yet_reported',
            'reconcile_attempts' => $attempts,
            'last_checked_at' => now(),
            'next_check_at' => $exhausted
                ? null
                : now()->addSeconds($delay),
        ])->save();
    }

    private function maxReconcileAttempts(): int
    {
        return max(
            1,
            (int) config('hospedfree.domains.max_reconcile_attempts', 12),
        );
    }
}
