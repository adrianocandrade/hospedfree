<?php

namespace App\Hosting\Models;

use App\Models\User;
use Common\Billing\Models\Price;
use Common\Billing\Subscription;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HostingPremiumSubdomainPurchase extends Model
{
    protected $guarded = [];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function premiumSubdomain(): BelongsTo
    {
        return $this->belongsTo(HostingPremiumSubdomain::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function price(): BelongsTo
    {
        return $this->belongsTo(Price::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }
}
