<?php

namespace App\Biolinks\Support;

use App\Biolinks\Models\BiolinkTheme;

class BiolinkModelPlanGuard
{
    /**
     * @return array<string, string>
     */
    public function validate(object|null $owner, BiolinkTheme $model): array
    {
        if (
            !$owner ||
            (
                method_exists($owner, 'hasPermission') &&
                $owner->hasPermission('admin')
            )
        ) {
            return [];
        }

        $requiredFeatures = array_values(array_unique([
            'model_gallery',
            ...($model->metadata['requiredFeatures'] ?? []),
        ]));

        foreach ($requiredFeatures as $feature) {
            $allowed = method_exists($owner, 'getRestrictionValue') &&
                (bool) $owner->getRestrictionValue(
                    'biolinks.create',
                    $feature,
                );
            if (!$allowed) {
                return [
                    'model_id' => __(
                        'This model is not included in the current plan.',
                    ),
                ];
            }
        }

        return [];
    }
}
