<?php

namespace App\Security\Console;

use App\Security\Models\AdministrativeSecurityEvent;
use App\Security\Models\CustomerCommunication;
use App\Security\Models\CustomerSecurityEvent;
use Common\Auth\Models\UserSession;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;

class PruneSecurityHistory extends Command
{
    protected $signature = 'security-history:prune';
    protected $description = 'Remove security history beyond configured retention periods.';

    public function handle(): int
    {
        $this->prune(CustomerCommunication::query(), 'customer_communications_days');
        $this->prune(CustomerSecurityEvent::query(), 'security_events_days');
        $this->prune(AdministrativeSecurityEvent::query(), 'administrative_audit_days');
        $this->prune(UserSession::query(), 'user_sessions_days');

        $this->info('Security history retention applied.');

        return self::SUCCESS;
    }

    private function prune(Builder $query, string $configKey): void
    {
        $days = max(1, (int) config("hospedfree.retention.{$configKey}"));
        $query->where('created_at', '<', now()->subDays($days))->delete();
    }
}
