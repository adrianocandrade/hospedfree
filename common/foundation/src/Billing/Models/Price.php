<?php

namespace Common\Billing\Models;

use Common\Billing\Subscription;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Price extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'amount' => 'float',
        'interval_count' => 'int',
        'default' => 'boolean',
        'active' => 'boolean',
        'subscriptions_count' => 'int',
    ];

    const MODEL_TYPE = 'price';

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
