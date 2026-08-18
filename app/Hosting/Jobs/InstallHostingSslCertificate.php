<?php

namespace App\Hosting\Jobs;

use App\Hosting\Contracts\HostingCertificateInstaller;
use App\Hosting\Data\PanelAccountCredentialsData;
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

class InstallHostingSslCertificate implements ShouldBeUnique, ShouldQueue
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
        return [30, 120, 600];
    }

    public function handle(HostingCertificateInstaller $installer): void
    {
        $certificate = HostingSslCertificate::query()
            ->with('account')
            ->findOrFail($this->certificateId);

        if ($certificate->installation_status === 'installed') {
            return;
        }

        $operation = DB::transaction(function () use ($certificate): HostingSslOperation {
            $locked = HostingSslCertificate::query()
                ->lockForUpdate()
                ->findOrFail($certificate->id);
            $operation = HostingSslOperation::query()->firstOrCreate(
                ['idempotency_key' => $this->idempotencyKey],
                [
                    'uuid' => (string) Str::uuid7(),
                    'hosting_ssl_certificate_id' => $locked->id,
                    'hosting_account_id' => $locked->hosting_account_id,
                    'operation' => HostingSslOperationType::Install,
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

                $locked->forceFill([
                    'installation_status' => 'installing',
                    'installation_attempted_at' => now(),
                ])->save();
            }

            return $operation;
        });

        if ($operation->status === ProviderOperationStatus::Succeeded) {
            return;
        }

        $account = $certificate->account;
        $result = filled($account?->username) && filled($account?->credential_secret)
            ? $installer->installCertificate(
                new PanelAccountCredentialsData(
                    (string) $account->username,
                    (string) $account->credential_secret,
                ),
                $certificate->domain,
                (string) $certificate->private_key,
                (string) $certificate->certificate,
                $certificate->ca_certificate,
            )
            : \App\Hosting\Data\ProviderResponse::failure(
                'panel_credentials_unavailable',
                'The hosting panel credentials are unavailable.',
            );

        DB::transaction(function () use ($certificate, $operation, $result): void {
            $locked = HostingSslCertificate::query()
                ->lockForUpdate()
                ->findOrFail($certificate->id);
            $lockedOperation = HostingSslOperation::query()
                ->lockForUpdate()
                ->findOrFail($operation->id);

            $lockedOperation->forceFill([
                'status' => $result->success
                    ? ProviderOperationStatus::Succeeded
                    : ($result->retryable
                        ? ProviderOperationStatus::RetryableFailed
                        : ProviderOperationStatus::PermanentFailed),
                'safe_code' => $result->code,
                'safe_message' => $result->safeMessage,
                'retry_after' => $result->retryable ? now()->addMinutes(10) : null,
                'completed_at' => now(),
            ])->save();

            if ($result->success) {
                $locked->forceFill([
                    'installation_status' => 'installed',
                    'installed_at' => now(),
                    'last_checked_at' => now(),
                    'safe_message' => 'Certificado emitido e instalado com segurança.',
                ])->save();
                $locked->account()->firstOrFail()->events()->create([
                    'event' => 'ssl_installed',
                    'safe_message' => 'Certificado SSL instalado.',
                    'metadata' => ['certificate_id' => $locked->id],
                ]);
                return;
            }

            $manualRequired = $result->code === 'panel_ssl_install_not_supported';
            $locked->forceFill([
                'installation_status' => $manualRequired
                    ? 'manual_required'
                    : ($result->retryable ? 'action_required' : 'failed'),
                'safe_message' => $manualRequired
                    ? 'Certificado emitido. A instalação automática não é suportada pelo painel desta conta.'
                    : 'O certificado foi emitido, mas a instalação ainda não foi concluída.',
            ])->save();
        });

        if ($result->retryable && $this->attempts() < $this->tries) {
            throw new RuntimeException($result->code);
        }
    }
}
