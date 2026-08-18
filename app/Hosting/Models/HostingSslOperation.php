<?php

namespace App\Hosting\Models;

use App\Hosting\Enums\HostingSslOperationType;
use App\Hosting\Enums\ProviderOperationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HostingSslOperation extends Model
{
    protected $guarded = [];

    protected $casts = [
        'operation' => HostingSslOperationType::class,
        'status' => ProviderOperationStatus::class,
        'attempt_count' => 'integer',
        'retry_after' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function certificate(): BelongsTo
    {
        return $this->belongsTo(HostingSslCertificate::class, 'hosting_ssl_certificate_id');
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(HostingAccount::class, 'hosting_account_id');
    }
}
