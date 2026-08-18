<?php

namespace App\Hosting\Jobs;

use App\Hosting\Contracts\HostingDomainProvider;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Services\HostingDomainSyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Queue\SerializesModels;

class ReconcileHostingDomains implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [30, 120, 600];

    public function __construct(public readonly int $accountId) {}

    /** @return list<object> */
    public function middleware(): array
    {
        return [(new WithoutOverlapping("hosting-domains:{$this->accountId}"))->expireAfter(120)];
    }

    public function handle(
        HostingDomainProvider $provider,
        HostingDomainSyncService $sync,
    ): void {
        $account = HostingAccount::query()->find($this->accountId);

        if (!$account || !$account->provider_account_id || !$sync->due($account)) {
            return;
        }

        $sync->refresh($account, $provider);
    }
}
