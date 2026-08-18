<?php

namespace App\Hosting\Jobs;

use App\Hosting\Contracts\HostingSslProvider;
use App\Hosting\Data\DnsInstructionData;
use App\Hosting\Data\HostingSslOrderData;
use App\Hosting\Data\ProviderResponse;
use App\Hosting\Enums\HostingSslOperationType;
use App\Hosting\Enums\ProviderOperationStatus;
use App\Hosting\Models\HostingSslCertificate;
use App\Hosting\Models\HostingSslOperation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class RequestHostingSslRenewal implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $uniqueFor = 900;

    public function __construct(
        public int $certificateId,
        public string $idempotencyKey,
    ) {}

    public function uniqueId(): string
    {
        return $this->idempotencyKey;
    }

    public function backoff(): array
    {
        return [60, 300, 900];
    }

    public function handle(HostingSslProvider $provider): void
    {
        $certificate = HostingSslCertificate::query()
            ->with('account')
            ->findOrFail($this->certificateId);

        if (
            $certificate->status !== 'issued' ||
            filled($certificate->renewal_order_id) ||
            !$certificate->valid_until ||
            $certificate->valid_until->isAfter(
                now()->addDays((int) config('hospedfree.ssl.renew_before_days', 30)),
            )
        ) {
            return;
        }

        $operation = $this->startOperation($certificate);
        if ($operation->status === ProviderOperationStatus::Succeeded) {
            return;
        }

        $result = $provider->requestCertificate(
            (string) $certificate->account->provider_account_id,
            $certificate->domain,
        );
        $instruction = $result->data instanceof HostingSslOrderData
            ? ($result->data->dnsInstructions[0] ?? null)
            : null;

        if (
            $result->success &&
            (!$instruction instanceof DnsInstructionData ||
                !filled($result->data->remoteOrderId))
        ) {
            $result = ProviderResponse::failure(
                'acme_dns_challenge_unavailable',
                'The certificate issuer did not provide a valid DNS challenge.',
            );
        }

        DB::transaction(function () use ($certificate, $operation, $result, $instruction): void {
            $locked = HostingSslCertificate::query()->lockForUpdate()->findOrFail($certificate->id);
            $lockedOperation = HostingSslOperation::query()->lockForUpdate()->findOrFail($operation->id);

            $lockedOperation->forceFill([
                'status' => $result->success
                    ? ProviderOperationStatus::Succeeded
                    : ($result->retryable
                        ? ProviderOperationStatus::RetryableFailed
                        : ProviderOperationStatus::PermanentFailed),
                'safe_code' => $result->code,
                'safe_message' => $result->safeMessage,
                'retry_after' => $result->retryable ? now()->addMinutes(15) : null,
                'completed_at' => now(),
            ])->save();

            if (!$result->success || !$result->data instanceof HostingSslOrderData) {
                $locked->forceFill([
                    'renewal_status' => $result->retryable ? 'action_required' : 'failed',
                    'renewal_retry_after' => $result->retryable ? now()->addMinutes(15) : null,
                    'safe_message' => 'Não foi possível iniciar a renovação. O certificado atual foi preservado.',
                ])->save();
                return;
            }

            $locked->forceFill([
                'renewal_status' => 'action_required',
                'renewal_order_id' => $result->data->remoteOrderId,
                'renewal_dns_validation' => [
                    'type' => $instruction->type,
                    'name' => $instruction->name,
                    'value' => $instruction->value,
                    'ttl' => $instruction->ttl,
                    'managed' => $instruction->managed,
                    'provider_record_id' => $instruction->providerRecordId,
                ],
                'renewal_requested_at' => now(),
                'renewal_retry_after' => now()->addMinutes(15),
                'safe_message' => $instruction->managed
                    ? 'A renovação foi iniciada e o DNS foi configurado automaticamente.'
                    : 'A renovação aguarda o novo registro de validação DNS.',
            ])->save();

            $locked->account()->firstOrFail()->events()->create([
                'event' => 'ssl_renewal_requested',
                'safe_message' => 'Renovação do certificado SSL iniciada.',
                'metadata' => ['certificate_id' => $locked->id],
            ]);
        });

        if ($result->retryable && $this->attempts() < $this->tries) {
            throw new RuntimeException($result->code);
        }
    }

    private function startOperation(HostingSslCertificate $certificate): HostingSslOperation
    {
        return DB::transaction(function () use ($certificate): HostingSslOperation {
            $operation = HostingSslOperation::query()->firstOrCreate(
                ['idempotency_key' => $this->idempotencyKey],
                [
                    'uuid' => (string) Str::uuid7(),
                    'hosting_ssl_certificate_id' => $certificate->id,
                    'hosting_account_id' => $certificate->hosting_account_id,
                    'operation' => HostingSslOperationType::Renew,
                    'status' => ProviderOperationStatus::Queued,
                ],
            );

            if ($operation->status !== ProviderOperationStatus::Succeeded) {
                $operation->forceFill([
                    'status' => ProviderOperationStatus::Running,
                    'attempt_count' => $operation->attempt_count + 1,
                    'safe_code' => null,
                    'safe_message' => null,
                    'retry_after' => null,
                    'started_at' => now(),
                    'completed_at' => null,
                ])->save();
            }

            return $operation;
        });
    }
}
