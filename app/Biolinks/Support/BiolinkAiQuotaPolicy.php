<?php

namespace App\Biolinks\Support;

use App\Models\User;
use Illuminate\Validation\ValidationException;

class BiolinkAiQuotaPolicy
{
    /** @return array{enabled: bool, total: int|null} */
    public function forOwner(User $owner): array
    {
        if ($owner->hasPermission('admin')) {
            return ['enabled' => true, 'total' => null];
        }

        $enabled = (bool) ($owner->getRestrictionValue(
            'biolinks.create',
            'ai_assistant',
        ) ?? true);
        $limit = $owner->getRestrictionValue(
            'biolinks.create',
            'ai_monthly_requests',
        );

        return [
            'enabled' => $enabled,
            'total' => is_numeric($limit) ? max(0, (int) $limit) : 50,
        ];
    }

    /** @param array{enabled: bool, total: int|null} $quota */
    public function assertCanReserve(array $quota, int $used): void
    {
        abort_unless($quota['enabled'], 403);

        if ($quota['total'] !== null && $used >= $quota['total']) {
            throw ValidationException::withMessages([
                'quota' => 'The monthly AI suggestion quota has been reached.',
            ]);
        }
    }
}
