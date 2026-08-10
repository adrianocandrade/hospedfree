<?php

namespace App\Bookings\Support;

use App\Biolinks\Models\Biolink;
use Common\Workspaces\ActiveWorkspace;
use Illuminate\Validation\ValidationException;

final class BookingPlanGuard
{
    public function ensureAllowed(Biolink $biolink, string $restriction = 'booking'): void
    {
        $owner = ActiveWorkspace::get($biolink->workspace_id)?->getOwnerUser() ?? $biolink->user;

        if (!$owner || (method_exists($owner, 'hasPermission') && $owner->hasPermission('admin'))) {
            return;
        }

        if (!method_exists($owner, 'getRestrictionValue')) {
            return;
        }

        $value = $owner->getRestrictionValue('biolinks.create', $restriction);
        // Existing workspaces may predate the booking restrictions. Missing values
        // remain compatible; an explicit false is the actual plan lock.
        if ($value !== null && !$value) {
            throw ValidationException::withMessages([
                'booking' => __('This feature is not included in the current plan.'),
            ]);
        }
    }

    public function emailLimit(Biolink $biolink): int
    {
        $owner = ActiveWorkspace::get($biolink->workspace_id)?->getOwnerUser() ?? $biolink->user;
        $limit = $owner && method_exists($owner, 'getRestrictionValue')
            ? $owner->getRestrictionValue('biolinks.create', 'booking_email_limit')
            : null;

        return $limit === null ? 100 : max(0, (int) $limit);
    }
}
