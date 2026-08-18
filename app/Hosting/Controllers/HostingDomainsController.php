<?php

namespace App\Hosting\Controllers;

use App\Hosting\Contracts\HostingDomainProvider;
use App\Hosting\Data\DnsInstructionData;
use App\Hosting\Data\HostingDomainData;
use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Jobs\ReconcileHostingDomains;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Models\HostingDomain;
use App\Hosting\Models\HostingPlan;
use App\Hosting\Services\HostingDnsVerificationService;
use App\Hosting\Services\HostingDomainSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class HostingDomainsController
{
    public function index(
        Request $request,
        int $account,
        HostingDomainProvider $provider,
        ?HostingDomainSyncService $sync = null,
    ): JsonResponse {
        $sync ??= app(HostingDomainSyncService::class);
        $hosting = $this->ownedAccount($request, $account);
        $sync->ensurePrimary($hosting);

        if (!$hosting->provider_account_id) {
            return response()->json([
                'data' => $sync->domains($hosting)
                    ->map(fn($domain) => $this->storedDomainArray($domain))
                    ->values(),
                'availability' => 'unavailable',
                'retryable' => false,
                'safe_code' => 'account_not_ready',
                ...$this->capabilities($hosting),
            ]);
        }

        if ($sync->due($hosting)) {
            ReconcileHostingDomains::dispatch($hosting->id);
        }

        $domains = $sync->domains($hosting);
        $failure = $domains->first(
            fn(HostingDomain $domain) =>
                filled($domain->safe_code) &&
                !in_array($domain->safe_code, [
                    'domain_active',
                    'domain_creation_pending',
                    'domain_not_yet_reported',
                    'dns_record_pending',
                    'dns_record_verified',
                ], true),
        );
        $failed = $failure instanceof HostingDomain;

        return response()->json([
            'data' => $domains
                ->map(fn($domain) => $this->storedDomainArray($domain))
                ->values(),
            'availability' => $failed
                ? ($failure->safe_code === 'capability_not_configured'
                    ? 'not_supported'
                    : 'unavailable')
                : 'available',
            'retryable' => $failed && filled($failure->next_check_at),
            'safe_code' => $failed ? $failure->safe_code : 'ok',
            ...$this->capabilities($hosting),
        ]);
    }

    public function storeSubdomain(
        Request $request,
        int $account,
        HostingDomainProvider $provider,
        ?HostingDomainSyncService $sync = null,
    ): JsonResponse {
        $sync ??= app(HostingDomainSyncService::class);
        $hosting = $this->ownedAccount($request, $account);
        $zones = $this->allowedZones();
        $payload = $request->validate([
            'label' => [
                'required',
                'string',
                'min:2',
                'max:63',
                'regex:/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/',
                Rule::notIn((array) config('hospedfree.reserved_subdomains', [])),
            ],
            'zone' => ['required', 'string', Rule::in($zones)],
        ]);
        $credentials = $this->credentials($hosting);
        $domain = strtolower("{$payload['label']}.{$payload['zone']}");
        $lock = Cache::lock(
            "hosting:domain-change:{$hosting->id}",
            60,
        );
        abort_unless(
            $lock->get(),
            409,
            'Another domain change is already in progress.',
        );
        try {
            $reservation = $this->reserveDomain(
                $hosting,
                $domain,
                $sync,
            );
            $result = $provider->addSubdomain(
                $credentials,
                strtolower($payload['label']),
                strtolower($payload['zone']),
            );

            if (!$result->success) {
                $this->recordReservationFailure(
                    $reservation,
                    $result->code,
                    $result->retryable,
                );
            }

            $this->abortForProviderFailure(
                $result->success,
                $result->retryable,
                'The subdomain could not be created.',
            );
            abort_unless(
                $result->data instanceof HostingDomainData,
                502,
                'The hosting provider returned an invalid domain response.',
            );
            $sync->persist($hosting, $result->data);
        } finally {
            $lock->release();
        }

        $hosting->events()->create([
            'actor_user_id' => $request->user()->id,
            'event' => 'subdomain_created',
            'safe_message' => 'Hosting subdomain created.',
            'metadata' => ['reason_code' => 'domain_created'],
        ]);

        return response()->json(
            ['data' => $this->domainArray($result->data)],
            201,
        );
    }

    public function destroy(
        Request $request,
        int $account,
        string $domain,
        HostingDomainProvider $provider,
        ?HostingDomainSyncService $sync = null,
    ): JsonResponse {
        $sync ??= app(HostingDomainSyncService::class);
        $hosting = $this->ownedAccount($request, $account);
        $domain = $this->normalizeDomain($domain);
        abort_if(
            strcasecmp($domain, $hosting->fqdn) === 0,
            409,
            'The primary domain cannot be removed.',
        );
        $credentials = $this->credentials($hosting);
        $owned = $provider->checkDomain($credentials->username, $domain);
        abort_unless(
            $owned->success &&
                $owned->data instanceof HostingDomainData &&
                $owned->data->status === 'active',
            404,
        );
        $type = $this->subdomainParts($domain) ? 'subdomain' : 'custom';
        $lock = Cache::lock(
            "hosting:domain-change:{$hosting->id}",
            60,
        );
        abort_unless(
            $lock->get(),
            409,
            'Another domain change is already in progress.',
        );

        try {
            $result = $provider->deleteDomain($credentials, $domain, $type);
        } finally {
            $lock->release();
        }
        $this->abortForProviderFailure(
            $result->success,
            $result->retryable,
            'The domain could not be removed.',
        );
        $sync->forget($hosting, $domain);

        $hosting->events()->create([
            'actor_user_id' => $request->user()->id,
            'event' => 'domain_deleted',
            'safe_message' => 'Hosting domain removed.',
            'metadata' => ['reason_code' => 'domain_removed'],
        ]);

        return response()->json(['deleted' => true]);
    }

    public function verify(
        Request $request,
        int $account,
        HostingDomainProvider $provider,
        HostingDnsVerificationService $dns,
        ?HostingDomainSyncService $sync = null,
    ): JsonResponse {
        $sync ??= app(HostingDomainSyncService::class);
        $hosting = $this->ownedAccount($request, $account);
        $domain = $this->normalizeDomain(
            (string) $request->validate([
                'domain' => ['required', 'string', 'max:253'],
            ])['domain'],
        );

        abort_unless(
            $hosting->provider_account_id,
            409,
            'The hosting account is not ready.',
        );
        $result = $provider->checkDomain(
            $hosting->username ?: $hosting->provider_account_id,
            $domain,
        );
        abort_unless(
            $result->success,
            $result->retryable ? 503 : 409,
            'Domain verification could not be completed.',
        );
        abort_unless(
            $result->data instanceof HostingDomainData,
            502,
            'The hosting provider returned an invalid domain response.',
        );

        $domainData = $result->data;
        if ($domain === strtolower($hosting->fqdn)) {
            $domainData = new HostingDomainData(
                domain: $domainData->domain,
                type: 'primary',
                status: $domainData->status,
                isPrimary: true,
            );
        }
        $instructions = [];
        $dnsStatus = $domainData->status === 'active' ? 'verified' : 'unavailable';
        $dnsRetryable = false;
        $dnsSafeCode = $domainData->status === 'active'
            ? 'domain_active'
            : 'dns_instructions_unavailable';

        if ($domainData->status !== 'active') {
            $instructionResult = $provider->domainVerificationInstructions(
                $hosting->username ?: $hosting->provider_account_id,
                $domain,
            );

            if ($instructionResult->success && is_array($instructionResult->data)) {
                $instructions = collect($instructionResult->data)
                    ->filter(
                        fn(mixed $instruction) =>
                            $instruction instanceof DnsInstructionData,
                    )
                    ->values()
                    ->all();
                $cname = collect($instructions)->first(
                    fn(DnsInstructionData $instruction) =>
                        strtoupper($instruction->type) === 'CNAME',
                );

                if ($cname instanceof DnsInstructionData) {
                    $dnsResult = $dns->verify($cname);
                    $dnsStatus = $dnsResult->success
                        ? ($dnsResult->data === true ? 'verified' : 'pending')
                        : 'unavailable';
                    $dnsRetryable = $dnsResult->retryable;
                    $dnsSafeCode = $dnsResult->success
                        ? ($dnsResult->data === true
                            ? 'dns_record_verified'
                            : 'dns_record_pending')
                        : $dnsResult->code;
                }
            } else {
                $dnsRetryable = $instructionResult->retryable;
                $dnsSafeCode = $instructionResult->code;
            }
        }

        $lock = Cache::lock(
            "hosting:domain-change:{$hosting->id}",
            60,
        );
        abort_unless(
            $lock->get(),
            409,
            'Another domain change is already in progress.',
        );
        try {
            $this->reserveDomain(
                $hosting,
                $domain,
                $sync,
                type: $domainData->type,
                allowExisting: true,
            );
            $sync->persist(
                $hosting,
                $domainData,
                $dnsStatus,
                $dnsSafeCode,
                collect($instructions)
                    ->map(fn(DnsInstructionData $instruction) => [
                        'type' => strtoupper($instruction->type),
                        'name' => $instruction->name,
                        'value' => $instruction->value,
                        'ttl' => $instruction->ttl,
                    ])
                    ->values()
                    ->all(),
                restartReconciliation: true,
            );
        } finally {
            $lock->release();
        }

        $hosting->events()->create([
            'actor_user_id' => $request->user()->id,
            'event' => $dnsStatus === 'verified'
                ? 'domain_verified'
                : 'domain_verification_checked',
            'safe_message' => 'Hosting domain verification completed.',
            'metadata' => ['reason_code' => $dnsSafeCode],
        ]);

        return response()->json([
            'data' => $this->domainArray($domainData),
            'dns' => [
                'status' => $dnsStatus,
                'retryable' => $dnsRetryable,
                'safe_code' => $dnsSafeCode,
                'checked_at' => now()->toIso8601String(),
                'instructions' => collect($instructions)
                    ->map(fn(DnsInstructionData $instruction) => [
                        'type' => strtoupper($instruction->type),
                        'name' => $instruction->name,
                        'value' => $instruction->value,
                        'ttl' => $instruction->ttl,
                    ])
                    ->values()
                    ->all(),
            ],
            'next_action' => match (true) {
                $domainData->status === 'active' => 'none',
                $dnsStatus === 'verified' => 'add_in_control_panel',
                $dnsStatus === 'pending' => 'configure_dns',
                default => 'retry_verification',
            },
        ]);
    }

    private function normalizeDomain(string $domain): string
    {
        $domain = strtolower(trim(rtrim($domain, '.')));
        $ascii = function_exists('idn_to_ascii')
            ? idn_to_ascii($domain)
            : $domain;

        if (
            !$ascii ||
            !filter_var($ascii, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME)
        ) {
            throw ValidationException::withMessages([
                'domain' => __('Enter a valid domain name.'),
            ]);
        }

        return $ascii;
    }

    private function credentials(
        HostingAccount $hosting,
    ): PanelAccountCredentialsData {
        abort_unless(
            $hosting->provider_account_id && $hosting->hasCredentials(),
            409,
            'The hosting account is not ready.',
        );

        return new PanelAccountCredentialsData(
            username: $hosting->username,
            password: $hosting->credential_secret,
        );
    }

    private function abortForProviderFailure(
        bool $success,
        bool $retryable,
        string $message,
    ): void {
        abort_unless($success, $retryable ? 503 : 409, $message);
    }

    private function reserveDomain(
        HostingAccount $hosting,
        string $domain,
        HostingDomainSyncService $sync,
        string $type = 'subdomain',
        bool $allowExisting = false,
    ): HostingDomain {
        return DB::transaction(function () use (
            $hosting,
            $domain,
            $sync,
            $type,
            $allowExisting,
        ): HostingDomain {
            $lockedAccount = HostingAccount::query()
                ->lockForUpdate()
                ->findOrFail($hosting->id);
            $plan = HostingPlan::query()
                ->lockForUpdate()
                ->findOrFail($lockedAccount->hosting_plan_id);
            $limit = data_get($plan->quotas, 'domains');

            if (!is_numeric($limit) || (int) $limit < 1) {
                throw ValidationException::withMessages([
                    'domain' => __('The domain limit is not configured for this hosting plan.'),
                ]);
            }

            $sync->ensurePrimary($lockedAccount);
            $existing = $lockedAccount->domains()
                ->where('domain', strtolower($domain))
                ->first();

            if ($existing && $allowExisting) {
                return $existing;
            }

            if ($existing) {
                throw ValidationException::withMessages([
                    'domain' => __('This domain is already attached to the hosting account.'),
                ]);
            }

            if ($lockedAccount->domains()->count() >= (int) $limit) {
                throw ValidationException::withMessages([
                    'domain' => __('This hosting plan has reached its domain limit.'),
                ]);
            }

            return $lockedAccount->domains()->create([
                'domain' => strtolower($domain),
                'type' => $type,
                'status' => 'creating',
                'is_primary' => false,
                'safe_code' => 'domain_creation_pending',
                'failure_count' => 0,
                'reconcile_attempts' => 0,
                'next_check_at' => now()->addSeconds(15),
            ]);
        }, 3);
    }

    private function recordReservationFailure(
        HostingDomain $reservation,
        string $safeCode,
        bool $retryable,
    ): void {
        if (!$retryable) {
            $reservation->delete();

            return;
        }

        $reservation->forceFill([
            'safe_code' => $safeCode,
            'failure_count' => 1,
            'last_checked_at' => now(),
            'next_check_at' => now()->addSeconds(30),
        ])->save();
    }

    /** @return list<string> */
    private function allowedZones(): array
    {
        return collect((array) config('hospedfree.allowed_domains', []))
            ->map(fn(mixed $zone) => strtolower(trim((string) $zone)))
            ->filter()
            ->values()
            ->all();
    }

    /** @return array{label: string, zone: string}|null */
    private function subdomainParts(string $domain): ?array
    {
        foreach ($this->allowedZones() as $zone) {
            $suffix = ".{$zone}";

            if (
                str_ends_with($domain, $suffix) &&
                substr_count(substr($domain, 0, -strlen($suffix)), '.') === 0
            ) {
                return [
                    'label' => substr($domain, 0, -strlen($suffix)),
                    'zone' => $zone,
                ];
            }
        }

        return null;
    }

    /** @return array{allowed_zones: list<string>, can_manage_subdomains: bool, can_manage_custom_domains: bool} */
    private function capabilities(HostingAccount $hosting): array
    {
        $panelEnabled =
            config('hospedfree.provider.driver') === 'fake' ||
            (bool) config('hospedfree.vistapanel.enabled');

        return [
            'allowed_zones' => $this->allowedZones(),
            'can_manage_subdomains' =>
                $panelEnabled && $hosting->hasCredentials(),
            'can_manage_custom_domains' => false,
        ];
    }

    /** @return array{domain: string, type: string, status: string, is_primary: bool} */
    private function domainArray(HostingDomainData $domain): array
    {
        return [
            'domain' => $domain->domain,
            'type' => $domain->type,
            'status' => $domain->status,
            'is_primary' => $domain->isPrimary,
        ];
    }

    /** @return array{domain: string, type: string, status: string, is_primary: bool} */
    private function storedDomainArray(\App\Hosting\Models\HostingDomain $domain): array
    {
        return [
            'domain' => $domain->domain,
            'type' => $domain->type,
            'status' => $domain->status,
            'is_primary' => $domain->is_primary,
        ];
    }

    private function ownedAccount(Request $request, int $id): HostingAccount
    {
        $hosting = HostingAccount::query()
            ->whereKey($id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        Gate::authorize('view', $hosting);

        return $hosting;
    }
}
