<?php

namespace App\Hosting\Models;

use App\Hosting\Enums\HostingPlanType;
use Common\Billing\Models\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HostingPlan extends Model
{
    protected $guarded = [];

    protected $casts = [
        'type' => HostingPlanType::class,
        'max_accounts_per_workspace' => 'integer',
        'quotas' => 'array',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function providerPackages(): HasMany
    {
        return $this->hasMany(HostingProviderPackage::class);
    }

    public function packageFor(string $provider): ?HostingProviderPackage
    {
        return $this->providerPackages
            ->first(fn(HostingProviderPackage $package) =>
                $package->provider === $provider && $package->is_active
            );
    }
}
