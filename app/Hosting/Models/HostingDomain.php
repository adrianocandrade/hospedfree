<?php

namespace App\Hosting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HostingDomain extends Model
{
    protected $guarded = [];

    protected $casts = [
        'is_primary' => 'boolean',
        'dns_instructions' => 'array',
        'reconcile_attempts' => 'integer',
        'failure_count' => 'integer',
        'last_checked_at' => 'datetime',
        'next_check_at' => 'datetime',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(HostingAccount::class, 'hosting_account_id');
    }
}
