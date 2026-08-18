<?php

namespace App\Hosting\Models;

use App\Models\User;
use Common\Billing\Models\Price;
use Common\Billing\Subscription;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HostingPremiumSubdomain extends Model
{
    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
        'complimentary_until' => 'datetime',
        'reservation_expires_at' => 'datetime',
    ];

    public function zone(): BelongsTo
    {
        return $this->belongsTo(HostingZone::class, 'hosting_zone_id');
    }

    public function annualPrice(): BelongsTo
    {
        return $this->belongsTo(Price::class, 'annual_price_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function reservedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reserved_user_id');
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(
            HostingPremiumSubdomainPurchase::class,
            'premium_subdomain_id',
        );
    }
}
