<?php

namespace App\Biolinks\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class BiolinkBadgeDefinition extends Model
{
    use HasFactory;

    protected $table = 'biolink_badge_definitions';

    protected $guarded = [];

    protected $casts = [
        'id' => 'integer',
        'starts_at' => 'datetime',
        'claim_until' => 'datetime',
        'repeat_yearly' => 'boolean',
        'show_year' => 'boolean',
        'is_active' => 'boolean',
        'metadata' => 'array',
    ];

    public function grants(): HasMany
    {
        return $this->hasMany(BiolinkBadgeGrant::class, 'badge_id');
    }

    public function isClaimable(): bool
    {
        if (!$this->is_active || $this->grant_mode !== 'claim') {
            return false;
        }

        $now = now();

        return $this->starts_at?->lessThanOrEqualTo($now) === true &&
            $this->claim_until?->greaterThanOrEqualTo($now) === true;
    }

    public function editionYear(): int|null
    {
        $configured = data_get($this->metadata, 'edition_year');

        if (is_numeric($configured)) {
            return (int) $configured;
        }

        if ($this->starts_at) {
            return (int) $this->starts_at->format('Y');
        }

        return $this->repeat_yearly || $this->show_year
            ? (int) now()->format('Y')
            : null;
    }
}
