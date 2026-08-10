<?php

namespace App\Biolinks\Models;

use App\Analytics\Models\TrackedEvent;
use App\Links\Models\LinkeableRule;
use App\TrackingPixels\Models\TrackingPixel;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class BiolinkWidget extends Model
{
    use HasFactory;

    const MODEL_TYPE = 'biolinkWidget';

    protected $guarded = [];
    protected $appends = ['model_type'];
    protected $hidden = ['password'];
    protected $casts = [
        'active' => 'boolean',
        'position' => 'integer',
        'clicks_count' => 'integer',
        'activates_at' => 'datetime',
        'expires_at' => 'datetime',
        'clicked_at' => 'datetime',
    ];

    protected function config(): Attribute
    {
        return Attribute::make(
            get: fn($value) => json_decode($value, true) ?: [],
            set: fn($value) => is_string($value) ? $value : json_encode($value),
        );
    }

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }

    public function passwordMatches(string|null $password): bool
    {
        return Hash::check($password, $this->password);
    }

    public function isCurrentlyVisible(): bool
    {
        $now = now();

        return $this->active &&
            (!$this->activates_at || $this->activates_at->lte($now)) &&
            (!$this->expires_at || $this->expires_at->gt($now));
    }

    public function setPasswordAttribute(string|null $value): void
    {
        if (!$value) {
            $this->attributes['password'] = null;
        } elseif (Hash::needsRehash($value)) {
            $this->attributes['password'] = Hash::make($value);
        } elseif (strlen($value) === 60) {
            $this->attributes['password'] = $value;
        } else {
            throw new RuntimeException(
                'Unexpected hashed password length for biolink widget.',
            );
        }
    }

    public function biolink(): BelongsTo
    {
        return $this->belongsTo(Biolink::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(BiolinkWidgetItem::class)->orderBy('sort_order');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(BiolinkWidgetSubmission::class, 'widget_id');
    }

    public function trackedEvents(): MorphMany
    {
        return $this->morphMany(TrackedEvent::class, 'linkeable');
    }

    public function getNameAttribute(): string
    {
        return (string) ($this->config['title'] ?? $this->type);
    }

    public function rules(): MorphMany
    {
        return $this->morphMany(LinkeableRule::class, 'linkeable');
    }

    public function pixels(): BelongsToMany
    {
        return $this->morphToMany(
            TrackingPixel::class,
            'linkeable',
            'link_tracking_pixel',
        );
    }
}
