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

class ReconcileHostingSslCertificate implements ShouldBeUnique, ShouldQueue
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

        if ($certificate->status !== 'issued' || !filled($certificate->remote_order_id)) {
            return;
        }

        $operation = $this->startOperation($certificate);
        if ($operation->status === ProviderOperationStatus::Succeeded) {
            return;
        }

        $result = $provider->certificateStatus(
            (string) $certificate->account->provider_account_id,
            (string) $certificate->remote_order_id,
        );

        DB::transaction(function () use ($certificate, $operation, $result): void {
            $locked = HostingSslCertificate::query()->lockForUpdate()->findOrFail($certificate->id);
            $lockedOperation = HostingSslOperation::query()->lockForUpdate()->findOrFail($operation->id);
            $normalized = $result->data instanceof HostingSslOrderData
                ? $result->data->status
                : null;
            $success = $result->success && $result->data instanceof HostingSslOrderData;

            $lockedOperation->forceFill([
                'status' => $success
                    ? ProviderOperationStatus::Succeeded
                    : ($result->retryable
                        ? ProviderOperationStatus::RetryableFailed
                        : ProviderOperationStatus::PermanentFailed),
                'safe_code' => $success ? 'ok' : $result->code,
                'safe_message' => $success ? 'Certificate status reconciled.' : $result->safeMessage,
                'retry_after' => !$success && $result->retryable ? now()->addMinutes(15) : null,
                'completed_at' => now(),
            ])->save();

            if (!$success) {
                return;
            }

            $locked->last_checked_at = now();

            if ($locked->valid_until?->isPast()) {
                $locked->status = 'failed';
                $locked->installation_status = 'action_required';
                $locked->safe_message = 'O certificado expirou e precisa de uma nova emissão.';
            } elseif ($normalized === 'failed') {
                $locked->safe_message = 'O emissor não confirmou a ordem atual. O certificado instalado foi preservado.';
            }

            $locked->save();
        });

        if (!$result->success && $result->retryable && $this->attempts() < $this->tries) {
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
                    'operation' => HostingSslOperationType::Reconcile,
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
