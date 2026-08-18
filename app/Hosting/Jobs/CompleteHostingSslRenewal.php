<?php

namespace App\Hosting\Jobs;

use App\Hosting\Contracts\HostingSslProvider;
use App\Hosting\Data\HostingSslOrderData;
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

class CompleteHostingSslRenewal implements ShouldBeUnique, ShouldQueue
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

        if ($certificate->status !== 'issued' || !filled($certificate->renewal_order_id)) {
            return;
        }

        $operation = $this->startOperation($certificate);
        if ($operation->status === ProviderOperationStatus::Succeeded) {
            return;
        }

        $certificate->forceFill(['renewal_status' => 'verifying'])->save();
        $result = $provider->validateCertificate(
            (string) $certificate->account->provider_account_id,
            (string) $certificate->renewal_order_id,
            $certificate->renewal_dns_validation['provider_record_id'] ?? null,
        );

        $validIssuedCertificate = $result->success &&
            $result->data instanceof HostingSslOrderData &&
            $result->data->status === 'issued' &&
            filled($result->data->privateKey) &&
            filled($result->data->certificate) &&
            filled($result->data->validUntil);

        DB::transaction(function () use (
            $certificate,
            $operation,
            $result,
            $validIssuedCertificate,
        ): void {
            $locked = HostingSslCertificate::query()->lockForUpdate()->findOrFail($certificate->id);
            $lockedOperation = HostingSslOperation::query()->lockForUpdate()->findOrFail($operation->id);

            $lockedOperation->forceFill([
                'status' => $validIssuedCertificate
                    ? ProviderOperationStatus::Succeeded
                    : ($result->retryable
                        ? ProviderOperationStatus::RetryableFailed
                        : ProviderOperationStatus::PermanentFailed),
                'safe_code' => $validIssuedCertificate ? 'ok' : $result->code,
                'safe_message' => $validIssuedCertificate
                    ? 'Certificate renewed.'
                    : $result->safeMessage,
                'retry_after' => !$validIssuedCertificate && $result->retryable
                    ? now()->addMinutes(15)
                    : null,
                'completed_at' => now(),
            ])->save();

            if (!$validIssuedCertificate || !$result->data instanceof HostingSslOrderData) {
                $locked->forceFill([
                    'renewal_status' => $result->retryable ? 'action_required' : 'failed',
                    'renewal_retry_after' => $result->retryable ? now()->addMinutes(15) : null,
                    'safe_message' => 'A renovação ainda não foi concluída. O certificado atual foi preservado.',
                ])->save();
                return;
            }

            $locked->forceFill([
                'remote_order_id' => $locked->renewal_order_id,
                'dns_validation' => null,
                'renewal_status' => null,
                'renewal_order_id' => null,
                'renewal_dns_validation' => null,
                'renewal_requested_at' => null,
                'renewal_retry_after' => null,
                'last_renewed_at' => now(),
                'verified_at' => now(),
                'issued_at' => now(),
                'valid_until' => $result->data->validUntil,
                'private_key' => $result->data->privateKey,
                'csr' => $result->data->csr,
                'certificate' => $result->data->certificate,
                'ca_certificate' => $result->data->caCertificate,
                'installation_status' => 'queued',
                'installation_attempted_at' => null,
                'installed_at' => null,
                'last_checked_at' => null,
                'safe_message' => 'Certificado renovado. A nova instalação foi enfileirada.',
            ])->save();

            $locked->account()->firstOrFail()->events()->create([
                'event' => 'ssl_renewed',
                'safe_message' => 'Certificado SSL renovado.',
                'metadata' => ['certificate_id' => $locked->id],
            ]);
        });

        if (!$validIssuedCertificate) {
            if ($result->retryable && $this->attempts() < $this->tries) {
                throw new RuntimeException($result->code);
            }
            return;
        }

        $renewed = $certificate->fresh();
        InstallHostingSslCertificate::dispatch(
            $renewed->id,
            'ssl-install:' . $renewed->id . ':renewal:' . $renewed->last_renewed_at->getTimestamp(),
        );
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
