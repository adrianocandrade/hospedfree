<?php

namespace App\Hosting\Services;

use App\Hosting\Models\HostingAccount;

class HostingFreeSlot
{
    public function nextAvailable(
        int $workspaceId,
        int $limit,
        ?int $exceptAccountId = null,
    ): ?int {
        $limit = max(0, $limit);

        if ($limit === 0) {
            return null;
        }

        $usedSlots = HostingAccount::withTrashed()
            ->where('workspace_id', $workspaceId)
            ->when(
                $exceptAccountId,
                fn($query, int $accountId) => $query->whereKeyNot($accountId),
            )
            ->whereNotNull('free_slot')
            ->pluck('free_slot')
            ->map(fn(mixed $slot): int => (int) $slot)
            ->all();

        for ($slot = 1; $slot <= $limit; $slot++) {
            if (!in_array($slot, $usedSlots, true)) {
                return $slot;
            }
        }

        return null;
    }
}
