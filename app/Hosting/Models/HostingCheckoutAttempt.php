<?php

namespace App\Hosting\Models;

use Common\Billing\Subscription;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HostingCheckoutAttempt extends Model
{
    protected $guarded = [];

    protected $casts = [
        'expires_at' => 'datetime',
        'last_checked_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(HostingOrder::class, 'hosting_order_id');
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }
}
