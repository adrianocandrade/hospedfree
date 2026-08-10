<?php

namespace App\Biolinks\Controllers;

use App\Biolinks\Actions\ImportModelToBiolink;
use App\Biolinks\Models\Biolink;
use App\Biolinks\Models\BiolinkTheme;
use App\Biolinks\Resources\BiolinkResource;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;

/**
 * @tags Biolinks
 */
class BiolinkThemeImportsController extends Controller
{
    /**
     * Import a complete theme into an existing biolink.
     *
     * Existing content is preserved. Only missing blueprint widgets are
     * restored and they remain inactive until the owner reviews them.
     *
     * @operationId importBiolinkTheme
     */
    public function store(
        int $biolinkId,
        BiolinkTheme $biolinkTheme,
        ImportModelToBiolink $importer,
    ) {
        $biolink = Biolink::query()->findOrFail($biolinkId);
        Gate::authorize('update', $biolink);

        $result = $importer->execute($biolink, $biolinkTheme);

        return (new BiolinkResource($result['biolink']))->additional([
            'meta' => [
                'imported_widgets_count' => $result['importedWidgetsCount'],
            ],
        ]);
    }
}
