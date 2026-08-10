<?php

namespace App\Biolinks\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BiolinkBadgeGrant extends Model
{
    protected $table = 'biolink_badge_grants';

    protected $guarded = [];

    protected $casts = [
        'id' => 'integer',
        'badge_id' => 'integer',
        'user_id' => 'integer',
        'granted_by' => 'integer',
        'granted_at' => 'datetime',
        'first_unlocked_at' => 'datetime',
        'last_unlocked_at' => 'datetime',
        'times_claimed' => 'integer',
        'edition_years' => 'array',
        'revoked_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function badge(): BelongsTo
    {
        return $this->belongsTo(BiolinkBadgeDefinition::class, 'badge_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function grantedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'granted_by');
    }

    /** @return list<int> */
    public function claimedEditionYears(): array
    {
        return collect($this->edition_years ?? [])
            ->filter(fn(mixed $year) => is_numeric($year))
            ->map(fn(mixed $year) => (int) $year)
            ->unique()
            ->sort()
            ->values()
            ->all();
    }

    public function includesEdition(int|null $year): bool
    {
        return $year !== null &&
            in_array($year, $this->claimedEditionYears(), true);
    }

    public function latestEditionYear(): int|null
    {
        $years = $this->claimedEditionYears();

        return $years ? max($years) : null;
    }
}
