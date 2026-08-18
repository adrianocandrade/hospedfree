<?php

namespace App\Hosting\Controllers;

use App\Hosting\Contracts\HostingSslProvider;
use App\Hosting\Data\DnsInstructionData;
use App\Hosting\Data\HostingSslOrderData;
use App\Hosting\Enums\HostingAccountStatus;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Models\HostingSslCertificate;
use App\Hosting\Jobs\InstallHostingSslCertificate;
use App\Hosting\Jobs\CompleteHostingSslRenewal;
use App\Hosting\Resources\HostingSslCertificateResource;
use App\Hosting\Services\CloudflareDnsService;
use App\Hosting\Support\AuthorizesHostingAdmin;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class HostingSslController
{
    use AuthorizesHostingAdmin;

    public function __construct(
        private readonly HostingSslProvider $provider,
        private readonly CloudflareDnsService $cloudflare,
    ) {}

    public function index(Request $request, int $account): AnonymousResourceCollection
    {
        $hosting = $this->ownedAccount($request, $account);

        $data = $request->validate([
            'status' => [
                'nullable',
                'string',
                Rule::in($this->certificateFilters()),
            ],
            'page' => ['nullable', 'integer', 'min:1'],
            'perPage' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $status = $data['status'] ?? 'all';
        $perPage = (int) ($data['perPage'] ?? 15);
        $certificates = $hosting->sslCertificates()->getQuery();
        $counts = [];

        foreach ($this->certificateFilters() as $filter) {
            $counts[$filter] = $this->applyCertificateFilter(
                clone $certificates,
                $filter,
            )->count();
        }

        $page = $this->applyCertificateFilter($certificates, $status)
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return HostingSslCertificateResource::collection(
            $page,
        )->additional(['counts' => $counts]);
    }

    public function store(Request $request, int $account): HostingSslCertificateResource
    {
        abort_unless((bool) config('hospedfree.ssl.enabled'), 404);

        $hosting = $this->ownedAccount($request, $account);
        abort_unless(
            $hosting->status === HostingAccountStatus::Active,
            409,
            'A conta de hospedagem precisa estar ativa.',
        );

        $data = $request->validate([
            'domain' => ['nullable', 'string', 'max:253'],
        ]);
        $domain = $this->resolveCertificateDomain(
            $hosting,
            $data['domain'] ?? null,
        );

        $certificate = Cache::lock("hosting:ssl:request:{$hosting->id}:{$domain}", 60)
            ->block(5, function () use ($hosting, $domain, $request) {
                $existing = $hosting->sslCertificates()
                    ->where('domain', $domain)
                    ->whereNotIn('status', ['failed', 'revoked'])
                    ->where(function (Builder $query): void {
                        $query
                            ->whereNull('valid_until')
                            ->orWhere('valid_until', '>', now());
                    })
                    ->latest()
                    ->first();

                if ($existing) {
                    return $existing;
                }

                $result = $this->provider->requestCertificate(
                    (string) $hosting->provider_account_id,
                    $domain,
                );

                abort_unless(
                    $result->success && $result->data instanceof HostingSslOrderData,
                    $result->retryable ? 503 : 422,
                    $this->safeMessage($result->code),
                );

                $instruction = $result->data->dnsInstructions[0] ?? null;
                abort_unless(
                    $instruction instanceof DnsInstructionData && filled($result->data->remoteOrderId),
                    502,
                    'O emissor não retornou um desafio DNS válido.',
                );

                $model = HostingSslCertificate::query()->create([
                    'hosting_account_id' => $hosting->id,
                    'workspace_id' => $hosting->workspace_id,
                    'user_id' => $hosting->user_id,
                    'domain' => $domain,
                    'provider' => (string) config('hospedfree.ssl.provider', 'manual'),
                    'status' => 'action_required',
                    'validation_method' => 'dns-01',
                    'dns_validation' => [
                        'type' => $instruction->type,
                        'name' => $instruction->name,
                        'value' => $instruction->value,
                        'ttl' => $instruction->ttl,
                        'managed' => $instruction->managed,
                        'provider_record_id' => $instruction->providerRecordId,
                    ],
                    'remote_order_id' => $result->data->remoteOrderId,
                    'safe_message' => $instruction->managed
                        ? 'O registro DNS foi configurado automaticamente. Aguarde a propagação e verifique novamente.'
                        : 'Adicione o registro TXT informado e aguarde a propagação do DNS.',
                    'requested_at' => now(),
                ]);

                $hosting->events()->create([
                    'actor_user_id' => $request->user()->id,
                    'event' => 'ssl_requested',
                    'safe_message' => 'Solicitação de certificado SSL criada.',
                    'metadata' => ['certificate_id' => $model->id, 'domain' => $domain],
                ]);

                return $model;
            });

        return new HostingSslCertificateResource($certificate);
    }

    public function verify(Request $request, int $account, int $certificate): JsonResponse
    {
        $hosting = $this->ownedAccount($request, $account);
        $model = $this->certificate($hosting, $certificate);

        if (
            $model->status === 'issued' &&
            $model->renewal_status === 'action_required' &&
            filled($model->renewal_order_id)
        ) {
            CompleteHostingSslRenewal::dispatch(
                $model->id,
                'ssl-renew-complete:' . $model->id . ':' . hash(
                    'sha256',
                    (string) $model->renewal_order_id,
                ),
            );

            return response()->json([
                'message' => 'Verificação da renovação enfileirada.',
                'data' => (new HostingSslCertificateResource($model->fresh()))->resolve($request),
            ]);
        }

        abort_unless(
            in_array($model->status, ['requested', 'action_required', 'failed'], true),
            409,
            'Este certificado não pode ser verificado no estado atual.',
        );
        abort_unless(filled($model->remote_order_id), 409, 'A solicitação SSL não possui uma ordem remota válida.');

        $model->forceFill([
            'status' => 'verifying',
            'safe_message' => 'Verificando o desafio DNS com o emissor do certificado.',
        ])->save();

        $result = $this->provider->validateCertificate(
            (string) $hosting->provider_account_id,
            (string) $model->remote_order_id,
            $model->dns_validation['provider_record_id'] ?? null,
        );

        if (!$result->success || !$result->data instanceof HostingSslOrderData) {
            $model->forceFill([
                'status' => $result->retryable ? 'action_required' : 'failed',
                'safe_message' => $this->safeMessage($result->code),
                'verified_at' => null,
            ])->save();

            abort($result->retryable ? 409 : 422, $this->safeMessage($result->code));
        }

        abort_unless(
            $result->data->status === 'issued' &&
            filled($result->data->privateKey) &&
            filled($result->data->certificate),
            502,
            'O emissor não retornou um certificado válido.',
        );

        $model->forceFill([
            'status' => 'issued',
            'installation_status' => 'queued',
            'safe_message' => 'Certificado emitido e armazenado com segurança.',
            'verified_at' => now(),
            'issued_at' => now(),
            'valid_until' => $result->data->validUntil,
            'private_key' => $result->data->privateKey,
            'csr' => $result->data->csr,
            'certificate' => $result->data->certificate,
            'ca_certificate' => $result->data->caCertificate,
        ])->save();

        $hosting->events()->create([
            'actor_user_id' => $request->user()->id,
            'event' => 'ssl_issued',
            'safe_message' => 'Certificado SSL emitido.',
            'metadata' => ['certificate_id' => $model->id],
        ]);

        InstallHostingSslCertificate::dispatch(
            $model->id,
            'ssl-install:' . $model->id . ':' . hash('sha256', (string) $model->remote_order_id),
        );

        return response()->json([
            'message' => 'Certificado SSL emitido.',
            'data' => (new HostingSslCertificateResource($model->fresh()))->resolve($request),
        ]);
    }

    public function destroy(Request $request, int $account, int $certificate): JsonResponse
    {
        $hosting = $this->ownedAccount($request, $account);
        $model = $this->certificate($hosting, $certificate);

        return $this->revoke($request, $hosting, $model, false);
    }

    public function adminDestroy(
        Request $request,
        int $account,
        int $certificate,
    ): JsonResponse {
        $this->authorizeHostingAdmin($request);
        $hosting = HostingAccount::withTrashed()->findOrFail($account);
        $model = $this->certificate($hosting, $certificate);

        return $this->revoke($request, $hosting, $model, true);
    }

    private function revoke(
        Request $request,
        HostingAccount $hosting,
        HostingSslCertificate $model,
        bool $admin,
    ): JsonResponse {
        abort_unless($model->status !== 'revoked', 409, 'Este certificado já foi revogado.');

        if ($model->status === 'issued') {
            $result = $this->provider->revokeCertificate(
                (string) $hosting->provider_account_id,
                (string) $model->remote_order_id,
            );

            abort_unless(
                $result->success,
                $result->retryable ? 503 : 422,
                $this->safeMessage($result->code),
            );
        } elseif ($recordId = ($model->dns_validation['provider_record_id'] ?? null)) {
            $this->cloudflare->deleteRecord($recordId);
        }

        if ($renewalRecordId = ($model->renewal_dns_validation['provider_record_id'] ?? null)) {
            $this->cloudflare->deleteRecord($renewalRecordId);
        }

        $model->forceFill([
            'status' => 'revoked',
            'revoked_at' => now(),
            'safe_message' => $model->issued_at
                ? 'Certificado revogado.'
                : 'Solicitação SSL cancelada.',
            'private_key' => null,
            'csr' => null,
            'certificate' => null,
            'ca_certificate' => null,
            'renewal_status' => null,
            'renewal_order_id' => null,
            'renewal_dns_validation' => null,
            'renewal_requested_at' => null,
            'renewal_retry_after' => null,
        ])->save();

        $hosting->events()->create([
            'actor_user_id' => $request->user()->id,
            'event' => $admin
                ? ($model->issued_at
                    ? 'admin_ssl_revoked'
                    : 'admin_ssl_cancelled')
                : ($model->issued_at ? 'ssl_revoked' : 'ssl_cancelled'),
            'safe_message' => $model->issued_at
                ? 'Certificado SSL revogado.'
                : 'Solicitação SSL cancelada.',
            'metadata' => [
                'certificate_id' => $model->id,
                'reason_code' => $admin
                    ? 'admin_ssl_revocation'
                    : 'customer_ssl_revocation',
            ],
        ]);

        return response()->json([
            'message' => $model->issued_at
                ? 'Certificado SSL revogado.'
                : 'Solicitação SSL cancelada.',
        ]);
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

    private function certificate(HostingAccount $account, int $id): HostingSslCertificate
    {
        return HostingSslCertificate::query()
            ->whereKey($id)
            ->where('hosting_account_id', $account->id)
            ->firstOrFail();
    }

    /** @return list<string> */
    private function certificateFilters(): array
    {
        return [
            'all',
            'action_required',
            'issued',
            'expired',
            'revoked',
            'failed',
        ];
    }

    private function applyCertificateFilter(
        Builder $query,
        string $filter,
    ): Builder {
        return match ($filter) {
            'action_required' => $query
                ->where('status', '!=', 'revoked')
                ->where(function (Builder $query): void {
                    $query
                        ->whereNull('valid_until')
                        ->orWhere('valid_until', '>', now());
                })
                ->where(function (Builder $query): void {
                    $query
                        ->where('status', 'action_required')
                        ->orWhereIn('installation_status', [
                            'action_required',
                            'manual_required',
                        ])
                        ->orWhere('renewal_status', 'action_required');
                }),
            'issued' => $query
                ->where('status', 'issued')
                ->where(function (Builder $query): void {
                    $query
                        ->whereNull('valid_until')
                        ->orWhere('valid_until', '>', now());
                }),
            'expired' => $query
                ->where('status', '!=', 'revoked')
                ->whereNotNull('valid_until')
                ->where('valid_until', '<=', now()),
            'revoked' => $query->where('status', 'revoked'),
            'failed' => $query
                ->where('status', '!=', 'revoked')
                ->where(function (Builder $query): void {
                    $query
                        ->whereNull('valid_until')
                        ->orWhere('valid_until', '>', now());
                })
                ->where(function (Builder $query): void {
                    $query
                        ->where('status', 'failed')
                        ->orWhere('installation_status', 'failed')
                        ->orWhere('renewal_status', 'failed');
                }),
            default => $query,
        };
    }

    private function resolveCertificateDomain(
        HostingAccount $hosting,
        ?string $requestedDomain,
    ): string {
        $domain = $this->normalizeDomain(
            $requestedDomain ?? $hosting->active_domain ?? $hosting->fqdn,
        );

        if ($domain === '') {
            throw ValidationException::withMessages([
                'domain' => 'Selecione um domínio ativo desta hospedagem.',
            ]);
        }

        $isActiveDomain = $hosting->domains()
            ->whereRaw('LOWER(domain) = ?', [$domain])
            ->where('status', 'active')
            ->exists();
        $isLegacyPrimary = in_array(
            $domain,
            array_filter([
                $this->normalizeDomain($hosting->active_domain),
                $this->normalizeDomain($hosting->fqdn),
            ]),
            true,
        );

        if (!$isActiveDomain && !$isLegacyPrimary) {
            throw ValidationException::withMessages([
                'domain' => 'Selecione um domínio ativo desta hospedagem.',
            ]);
        }

        return $domain;
    }

    private function normalizeDomain(?string $domain): string
    {
        return strtolower(rtrim(trim((string) $domain), '.'));
    }

    private function safeMessage(string $code): string
    {
        return match ($code) {
            'acme_not_configured', 'capability_not_configured' =>
                'A emissão automática de certificados ainda não está configurada.',
            'acme_dns_not_propagated' =>
                'O registro DNS ainda não foi encontrado. Aguarde a propagação e tente novamente.',
            'acme_dns_challenge_unavailable' =>
                'O emissor não disponibilizou um desafio DNS válido.',
            'acme_validation_failed', 'acme_order_not_ready' =>
                'O emissor ainda não confirmou a validação DNS. Aguarde e tente novamente.',
            'acme_revocation_not_supported' =>
                'A revogação remota ainda não é suportada por este emissor.',
            'cloudflare_not_configured' =>
                'A automação DNS do Cloudflare ainda não está configurada.',
            'cloudflare_invalid_credentials' =>
                'O Cloudflare rejeitou o token ou a zona configurada.',
            'cloudflare_record_failed' =>
                'Não foi possível criar o registro de validação no Cloudflare.',
            'acme_unreachable', 'cloudflare_unreachable' =>
                'O serviço externo não respondeu. Tente novamente em alguns minutos.',
            default => 'A operação SSL não pôde ser concluída com segurança.',
        };
    }
}
