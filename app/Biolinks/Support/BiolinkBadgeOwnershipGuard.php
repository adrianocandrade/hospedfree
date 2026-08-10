<?php

namespace App\Biolinks\Support;

use App\Models\User;
use Illuminate\Support\Arr;

class BiolinkBadgeOwnershipGuard
{
    /** @return array<string, string> */
    public function validate(array $config, User|null $owner): array
    {
        if (!$owner || $owner->hasPermission('admin')) {
            return [];
        }

        $errors = [];

        foreach (Arr::get($config, 'badgeConfig.items', []) as $index => $item) {
            if (!is_array($item) || Arr::get($item, 'type') !== 'system') {
                continue;
            }

            $key = (string) Arr::get($item, 'id', '');
            $service = app(BiolinkBadgeService::class);
            if (!$key || !$service->owns($owner, $key)) {
                $errors["config.badgeConfig.items.$index.id"] =
                    'The selected badge is not owned by this account.';
                continue;
            }

            $editionYear = Arr::get($item, 'editionYear');
            if (
                $editionYear !== null &&
                !$service->ownsEdition($owner, $key, (int) $editionYear)
            ) {
                $errors["config.badgeConfig.items.$index.editionYear"] =
                    'The selected badge edition is not owned by this account.';
            }
        }

        return $errors;
    }
}
