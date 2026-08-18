<?php

namespace App\Hosting\Notifications;

use App\Hosting\Enums\HostingAccountNotificationType;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class HostingAccountNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public HostingAccountNotificationType $type,
        public int $accountId,
        public string $domain,
        public ?string $planName = null,
        public ?string $effectiveAt = null,
    ) {
        $this->afterCommit();
    }

    public function via(mixed $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(User $notifiable): MailMessage
    {
        $message = (new MailMessage())
            ->subject($this->translate('subject'))
            ->greeting(__('hospedfree-notifications.greeting', [
                'name' => $notifiable->name,
            ]));

        foreach ($this->lines() as $line) {
            $message->line($line);
        }

        if ($this->isError()) {
            $message->level('error');
        } elseif ($this->isSuccess()) {
            $message->level('success');
        }

        return $message
            ->action($this->translate('action'), $this->actionUrl())
            ->line(__('hospedfree-notifications.security_notice'));
    }

    public function toArray(mixed $notifiable): array
    {
        return [
            'type' => $this->type->value,
            'account_id' => $this->accountId,
            'domain' => $this->domain,
            'lines' => collect($this->lines())
                ->map(fn(string $line) => ['content' => $line])
                ->values()
                ->all(),
            'buttonActions' => [
                [
                    'label' => $this->translate('action'),
                    'action' => $this->actionUrl(),
                ],
            ],
        ];
    }

    /**
     * @return array<int, string>
     */
    private function lines(): array
    {
        $lines = [];

        foreach (['line_1', 'line_2'] as $key) {
            $translation = $this->translate($key);
            if ($translation !== '') {
                $lines[] = $translation;
            }
        }

        return $lines;
    }

    private function translate(string $key): string
    {
        return __("hospedfree-notifications.hosting.{$this->type->value}.{$key}", [
            'domain' => $this->domain,
            'plan' => $this->planName ?: __('hospedfree-notifications.hosting_plan'),
            'effective_at' => $this->formattedEffectiveAt(),
        ]);
    }

    private function formattedEffectiveAt(): string
    {
        if (!$this->effectiveAt) {
            return __('hospedfree-notifications.not_available');
        }

        return CarbonImmutable::parse($this->effectiveAt)
            ->locale(app()->getLocale())
            ->isoFormat('LLL');
    }

    private function actionUrl(): string
    {
        return rtrim((string) config('app.url'), '/') . "/dashboard/hosting/{$this->accountId}";
    }

    private function isError(): bool
    {
        return in_array($this->type, [
            HostingAccountNotificationType::ProvisioningFailed,
            HostingAccountNotificationType::Suspended,
            HostingAccountNotificationType::ActionRequired,
        ], true);
    }

    private function isSuccess(): bool
    {
        return in_array($this->type, [
            HostingAccountNotificationType::Ready,
            HostingAccountNotificationType::Reactivated,
            HostingAccountNotificationType::DeletionCancelled,
            HostingAccountNotificationType::PlanChanged,
        ], true);
    }
}
