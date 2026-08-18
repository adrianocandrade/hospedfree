<?php

namespace App\Hosting\Models;

use App\Hosting\Enums\HostingAccountStatus;
use App\Models\User;
use Common\Billing\Models\Price;
use Common\Billing\Models\Product;
use Common\Billing\Subscription;
use Illuminate\Database\Eloquent\Model;
use Common\Workspaces\Models\Workspace;
use DomainException;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class HostingAccount extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    protected $hidden = [
        'credential_secret',
        'provider_account_id',
    ];

    protected $casts = [
        'status' => HostingAccountStatus::class,
        'desired_status' => HostingAccountStatus::class,
        'credential_secret' => 'encrypted',
        'activated_at' => 'datetime',
        'suspended_at' => 'datetime',
        'last_synced_at' => 'datetime',
        'deletion_requested_at' => 'datetime',
        'deletes_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function transitionTo(
        HostingAccountStatus $status,
        ?int $actorUserId = null,
        ?string $safeMessage = null,
        array $metadata = [],
    ): void {
        $from = $this->status;

        if ($from === $status) {
            return;
        }

        if (!$from->canTransitionTo($status)) {
            throw new DomainException("Invalid hosting account transition from {$from->value} to {$status->value}.");
        }

        $this->status = $status;
        $this->save();

        $this->events()->create([
            'actor_user_id' => $actorUserId,
            'event' => 'status_changed',
            'from_status' => $from->value,
            'to_status' => $status->value,
            'safe_message' => $safeMessage,
            'metadata' => $metadata,
        ]);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(HostingOrder::class, 'hosting_order_id');
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

    public function operations(): HasMany
    {
        return $this->hasMany(HostingProviderOperation::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(HostingAccountEvent::class);
    }

    public function sslCertificates(): HasMany
    {
        return $this->hasMany(HostingSslCertificate::class);
    }

    public function domains(): HasMany
    {
        return $this->hasMany(HostingDomain::class);
    }

    public function hasCredentials(): bool
    {
        return filled($this->username) && filled($this->credential_secret);
    }
}
