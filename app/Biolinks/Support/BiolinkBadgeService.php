<?php

namespace App\Biolinks\Support;

use App\Biolinks\Models\BiolinkBadgeDefinition;
use App\Biolinks\Models\BiolinkBadgeGrant;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class BiolinkBadgeService
{
    public function catalog(User $user): Collection
    {
        $this->syncDerivedBadges($user);

        $owned = $this->ownedGrants($user->id);

        return BiolinkBadgeDefinition::query()
            ->where('is_active', true)
            ->get()
            ->each(function (BiolinkBadgeDefinition $badge) use ($user, $owned) {
                /** @var BiolinkBadgeGrant|null $grant */
                $grant = $owned->get($badge->key);
                $ownedYears = $grant?->claimedEditionYears() ?? [];
                $canClaim = $this->canClaimWithGrant($badge, $user, $grant);

                $badge->setAttribute('owned', $grant !== null);
                $badge->setAttribute('owned_years', $ownedYears);
                $badge->setAttribute(
                    'latest_edition_year',
                    $grant?->latestEditionYear(),
                );
                $badge->setAttribute(
                    'edition_year',
                    $badge->editionYear(),
                );
                $badge->setAttribute(
                    'times_claimed',
                    $grant?->times_claimed ?? 0,
                );
                $badge->setAttribute(
                    'can_claim',
                    $canClaim,
                );
                $badge->setAttribute(
                    'status',
                    $this->status($badge, $user, $grant, $canClaim),
                );
            })
            ->sortBy(
                fn(BiolinkBadgeDefinition $badge) => sprintf(
                    '%02d|%s|%s',
                    $this->statusOrder(
                        (string) $badge->getAttribute('status'),
                    ),
                    (string) $badge->category,
                    $badge->key,
                ),
            )
            ->values();
    }

    public function owned(User $user): Collection
    {
        $this->syncDerivedBadges($user);

        return BiolinkBadgeGrant::query()
            ->with('badge')
            ->where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->orderByDesc('last_unlocked_at')
            ->orderByDesc('granted_at')
            ->get();
    }

    public function claim(User $user, string $key): BiolinkBadgeGrant
    {
        if (!$this->featureAllowed($user, 'badges')) {
            throw new BiolinkBadgeClaimException('plan_required', 403);
        }

        $badge = BiolinkBadgeDefinition::query()
            ->where('key', $key)
            ->where('is_active', true)
            ->firstOrFail();

        $existing = BiolinkBadgeGrant::query()
            ->with('badge')
            ->where('badge_id', $badge->id)
            ->where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->first();

        $editionYear = $badge->editionYear();
        if (
            $existing &&
            (!$badge->repeat_yearly || $existing->includesEdition($editionYear))
        ) {
            return $existing;
        }

        if ($badge->grant_mode !== 'claim') {
            throw new BiolinkBadgeClaimException('not_claimable');
        }

        $now = now();
        if ($badge->starts_at && $badge->starts_at->isFuture()) {
            throw new BiolinkBadgeClaimException('not_started');
        }
        if ($badge->claim_until && $badge->claim_until->isPast()) {
            throw new BiolinkBadgeClaimException('event_closed', 410);
        }
        if (!$badge->starts_at || !$badge->claim_until) {
            throw new BiolinkBadgeClaimException('event_not_configured');
        }
        if ($now->lt($badge->starts_at) || $now->gt($badge->claim_until)) {
            throw new BiolinkBadgeClaimException('event_closed', 410);
        }

        return $this->grant(
            $user,
            $badge,
            'claim',
            editionYear: $editionYear,
        );
    }

    public function grant(
        User $user,
        BiolinkBadgeDefinition $badge,
        string $source = 'admin',
        User|null $grantedBy = null,
        int|null $editionYear = null,
    ): BiolinkBadgeGrant {
        return DB::transaction(function () use (
            $user,
            $badge,
            $source,
            $grantedBy,
            $editionYear,
        ) {
            $now = now();
            $editionYear ??= $badge->editionYear();
            $grant = BiolinkBadgeGrant::query()
                ->where('badge_id', $badge->id)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            if (!$grant) {
                $editionYears = $editionYear !== null ? [$editionYear] : null;

                return BiolinkBadgeGrant::query()->create([
                    'badge_id' => $badge->id,
                    'user_id' => $user->id,
                    'source' => $source,
                    'granted_by' => $grantedBy?->id,
                    'granted_at' => $now,
                    'first_unlocked_at' => $now,
                    'last_unlocked_at' => $now,
                    'times_claimed' => 1,
                    'edition_years' => $editionYears,
                    'revoked_at' => null,
                ]);
            }

            $years = $grant->claimedEditionYears();
            $newEdition =
                $badge->repeat_yearly &&
                $editionYear !== null &&
                !in_array($editionYear, $years, true);

            if ($editionYear !== null && !in_array($editionYear, $years, true)) {
                $years[] = $editionYear;
                sort($years);
            }

            $grant->fill([
                'source' => $source,
                'granted_by' => $grantedBy?->id,
                'granted_at' => $now,
                'first_unlocked_at' => $grant->first_unlocked_at ?? $now,
                'last_unlocked_at' => $newEdition
                    ? $now
                    : ($grant->last_unlocked_at ?? $now),
                'times_claimed' => $newEdition
                    ? max(1, (int) $grant->times_claimed) + 1
                    : max(1, (int) $grant->times_claimed),
                'edition_years' => $years ?: null,
                'revoked_at' => null,
            ])->save();

            return $grant->refresh();
        });
    }

    public function revoke(User $user, BiolinkBadgeDefinition $badge): void
    {
        BiolinkBadgeGrant::query()
            ->where('badge_id', $badge->id)
            ->where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }

    public function owns(User $user, string $key): bool
    {
        $this->syncDerivedBadges($user);

        return $this->ownsByUserId($user->id, $key);
    }

    public function ownsByUserId(int $userId, string $key): bool
    {
        return BiolinkBadgeGrant::query()
            ->where('user_id', $userId)
            ->whereNull('revoked_at')
            ->whereHas('badge', fn($query) => $query->where('key', $key))
            ->exists();
    }

    public function ownsEdition(
        User $user,
        string $key,
        int|null $editionYear,
    ): bool {
        if ($editionYear === null) {
            return $this->owns($user, $key);
        }

        $grant = BiolinkBadgeGrant::query()
            ->where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->whereHas('badge', fn($query) => $query->where('key', $key))
            ->first();

        return $grant?->includesEdition($editionYear) === true;
    }

    public function filterAppearanceConfig(
        array $config,
        int|null $userId,
    ): array {
        if (!isset($config['badgeConfig']['items']) || !is_array($config['badgeConfig']['items'])) {
            return $config;
        }

        $hasSystemBadge = collect($config['badgeConfig']['items'])
            ->contains(fn(mixed $item) => is_array($item) && ($item['type'] ?? null) === 'system');

        if (!$hasSystemBadge) {
            return $config;
        }

        if ($userId !== null && User::query()->find($userId)?->hasPermission('admin')) {
            return $config;
        }

        $config['badgeConfig']['items'] = array_values(array_filter(
            $config['badgeConfig']['items'],
            function (mixed $item) use ($userId): bool {
                if (!is_array($item) || ($item['type'] ?? null) !== 'system') {
                    return true;
                }

                return $userId !== null && $this->ownsByUserId(
                    $userId,
                    (string) ($item['id'] ?? ''),
                );
            },
        ));

        return $config;
    }

    public function canClaim(
        BiolinkBadgeDefinition $badge,
        User $user,
    ): bool {
        $grant = BiolinkBadgeGrant::query()
            ->where('badge_id', $badge->id)
            ->where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->first();

        return $this->canClaimWithGrant($badge, $user, $grant);
    }

    private function canClaimWithGrant(
        BiolinkBadgeDefinition $badge,
        User $user,
        BiolinkBadgeGrant|null $grant,
    ): bool {
        return $this->featureAllowed($user, 'badges') &&
            $badge->grant_mode === 'claim' &&
            $badge->isClaimable() &&
            (
                !$grant ||
                (
                    $badge->repeat_yearly &&
                    !$grant->includesEdition($badge->editionYear())
                )
            );
    }

    private function syncDerivedBadges(User $user): void
    {
        $definitions = BiolinkBadgeDefinition::query()
            ->where('is_active', true)
            ->where('grant_mode', 'derived')
            ->whereNotNull('required_feature')
            ->get();

        foreach ($definitions as $badge) {
            if ($this->featureAllowed($user, $badge->required_feature)) {
                $this->grant($user, $badge, 'derived');
            }
        }
    }

    private function ownedGrants(int $userId): Collection
    {
        return BiolinkBadgeGrant::query()
            ->where('user_id', $userId)
            ->whereNull('revoked_at')
            ->with('badge:id,key')
            ->get()
            ->keyBy('badge.key');
    }

    private function status(
        BiolinkBadgeDefinition $badge,
        User $user,
        BiolinkBadgeGrant|null $grant,
        bool $canClaim,
    ): string {
        if ($canClaim) {
            return 'claimable';
        }
        if (
            $grant &&
            $badge->repeat_yearly &&
            !$grant->includesEdition($badge->editionYear())
        ) {
            if ($badge->starts_at && $badge->starts_at->isFuture()) {
                return 'upcoming';
            }
            if ($badge->claim_until && $badge->claim_until->isPast()) {
                return 'expired';
            }
        }
        if ($grant) {
            return 'owned';
        }
        if (!$this->featureAllowed($user, 'badges')) {
            return 'locked';
        }
        if ($badge->kind === 'event') {
            if ($badge->starts_at && $badge->starts_at->isFuture()) {
                return 'upcoming';
            }
            if ($badge->claim_until && $badge->claim_until->isPast()) {
                return 'expired';
            }
            return 'unavailable';
        }

        return match ($badge->access_type) {
            'premium' => 'premium',
            'paid' => $badge->action_url ? 'purchasable' : 'unavailable',
            'automatic' => 'unavailable',
            default => 'admin_only',
        };
    }

    private function statusOrder(string $status): int
    {
        return match ($status) {
            'claimable' => 0,
            'owned' => 1,
            'purchasable', 'premium' => 2,
            'upcoming' => 3,
            'expired' => 5,
            default => 4,
        };
    }

    private function featureAllowed(User $user, string|null $feature): bool
    {
        if ($feature === null || $user->hasPermission('admin')) {
            return true;
        }

        return method_exists($user, 'getRestrictionValue') &&
            (bool) $user->getRestrictionValue('biolinks.create', $feature);
    }
}
