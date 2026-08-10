<?php

namespace Tests\Unit;

use App\Biolinks\Models\BiolinkTheme;
use App\Biolinks\Support\BiolinkModelPlanGuard;
use Tests\TestCase;

class BiolinkModelPlanGuardTest extends TestCase
{
    public function test_model_requires_gallery_and_declared_features(): void
    {
        $model = new BiolinkTheme([
            'metadata' => [
                'requiredFeatures' => ['premium_models'],
            ],
        ]);
        $owner = new ModelPlanOwner([
            'model_gallery' => true,
            'premium_models' => false,
        ]);

        $this->assertArrayHasKey(
            'model_id',
            app(BiolinkModelPlanGuard::class)->validate($owner, $model),
        );

        $owner = new ModelPlanOwner([
            'model_gallery' => true,
            'premium_models' => true,
        ]);

        $this->assertSame(
            [],
            app(BiolinkModelPlanGuard::class)->validate($owner, $model),
        );
    }
}

class ModelPlanOwner
{
    public function __construct(private readonly array $features)
    {
    }

    public function hasPermission(string $permission): bool
    {
        return false;
    }

    public function getRestrictionValue(
        string $permission,
        string $restriction,
    ): bool {
        return (bool) ($this->features[$restriction] ?? false);
    }
}
