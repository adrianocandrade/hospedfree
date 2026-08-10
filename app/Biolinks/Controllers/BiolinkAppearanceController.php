<?php

namespace App\Biolinks\Controllers;

use App\Biolinks\Models\Biolink;
use App\Biolinks\Requests\UpdateBiolinkAppearanceRequest;
use App\Biolinks\Resources\BiolinkResource;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;

/**
 * @tags Biolinks
 */
class BiolinkAppearanceController extends Controller
{
    /**
     * Update appearance.
     *
     * @operationId updateBiolinkAppearance
     */
    public function update(int $id, UpdateBiolinkAppearanceRequest $request)
    {
        $biolink = Biolink::query()->findOrFail($id);
        Gate::authorize('update', $biolink);

        $data = $request->validated();

        // delete appearance col if there's no config
        if ($biolink->appearance && empty($data['config'])) {
            $biolink->appearance->delete();
        } else {
            if ($biolink->appearance) {
                $biolink->appearance->update(['config' => $data['config']]);
            } else {
                $appearance = $biolink
                    ->appearance()
                    ->create(['config' => $data['config']]);
                $biolink->setRelation('appearance', $appearance);
            }
        }

        $biolink->touch();

        return new BiolinkResource($biolink->fresh()->loadContent());
    }
}
