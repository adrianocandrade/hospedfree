<?php

namespace App\Hosting\Models;

use App\Hosting\Enums\ProviderOperationStatus;
use App\Hosting\Enums\ProviderOperationType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HostingProviderOperation extends Model
{
    protected $guarded = [];

    protected $casts = [
        'operation' => ProviderOperationType::class,
        'status' => ProviderOperationStatus::class,
        'attempt_count' => 'integer',
        'retry_after' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(HostingOrder::class, 'hosting_order_id');
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(HostingAccount::class, 'hosting_account_id');
    }
}
