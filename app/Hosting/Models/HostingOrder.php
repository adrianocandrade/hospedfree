<?php

namespace App\Hosting\Models;

use App\Hosting\Enums\HostingOrderStatus;
use App\Models\User;
use Common\Billing\Models\Price;
use Common\Billing\Models\Product;
use Common\Billing\Subscription;
use Illuminate\Database\Eloquent\Model;
use Common\Workspaces\Models\Workspace;
use Carbon\CarbonInterface;
use DomainException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HostingOrder extends Model
{
    protected $guarded = [];

    protected $casts = [
        'status' => HostingOrderStatus::class,
        'paid_at' => 'datetime',
        'fulfilled_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function scopePaymentWindowActive(
        Builder $query,
        ?CarbonInterface $at = null,
    ): Builder {
        $at ??= now();

        return $query
            ->where('status', HostingOrderStatus::AwaitingPayment)
            ->where(function (Builder $window) use ($at): void {
                $window
                    ->whereNull('expires_at')
                    ->orWhere('expires_at', '>', $at);
            });
    }

    public function scopePaymentWindowExpired(
        Builder $query,
        ?CarbonInterface $at = null,
    ): Builder {
        $at ??= now();

        return $query
            ->where('status', HostingOrderStatus::AwaitingPayment)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', $at);
    }

    public function transitionTo(HostingOrderStatus $status): void
    {
        if ($this->status === $status) {
            return;
        }

        if (!$this->status->canTransitionTo($status)) {
            throw new DomainException("Invalid hosting order transition from {$this->status->value} to {$status->value}.");
        }

        $this->status = $status;
        $this->save();
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(HostingPlan::class, 'hosting_plan_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function price(): BelongsTo
    {
        return $this->belongsTo(Price::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(HostingZone::class, 'hosting_zone_id');
    }

    public function premiumSubdomain(): BelongsTo
    {
        return $this->belongsTo(HostingPremiumSubdomain::class, 'premium_subdomain_id');
    }

    public function account(): HasOne
    {
        return $this->hasOne(HostingAccount::class);
    }

    public function checkoutAttempts(): HasMany
    {
        return $this->hasMany(HostingCheckoutAttempt::class);
    }
}
