<?php

namespace App\Biolinks\Controllers;

use App\Biolinks\Actions\GetBiolinkProductImportPreview;
use App\Biolinks\Models\Biolink;
use App\Biolinks\Requests\ProductImportPreviewRequest;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

#[Group('Biolinks', weight: 6)]
class BiolinkProductImportPreviewController extends Controller
{
    /**
     * Build an editable product preview from public structured metadata.
     *
     * This endpoint never creates or updates a product.
     *
     * @operationId previewBiolinkProductImport
     *
     * @response array{
     *   provider: 'mercado_livre'|'shopee'|'amazon'|'aliexpress'|'magalu'|'shein'|'tiktok_shop'|'temu'|'shopify'|'woocommerce'|'generic',
     *   domain: string,
     *   retrieved_at: string,
     *   product: array{
     *     name: string|null,
     *     description: string|null,
     *     image: string|null,
     *     price: float|null,
     *     compare_price: float|null,
     *     currency: string|null,
     *     rating: float|null,
     *     stock_label: string|null,
     *     url: string
     *   },
     *   missing_fields: list<string>,
     *   warnings: list<array{
     *     code: 'metadata_unavailable'|'partial_data'|'price_missing'|'image_missing'|'bot_protected',
     *     message: string
     *   }>
     * }
     */
    public function __invoke(
        int $biolinkId,
        ProductImportPreviewRequest $request,
        GetBiolinkProductImportPreview $preview,
    ) {
        $biolink = Biolink::query()->findOrFail($biolinkId);
        Gate::authorize('update', $biolink);

        $startedAt = microtime(true);
        $result = $preview->execute($request->validated('url'));

        Log::info('Biolink product import preview resolved.', [
            'provider' => $result['provider'],
            'domain' => $result['domain'],
            'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            'result' => $result['warnings'] === [] ? 'complete' : 'partial',
        ]);

        return response()->json($result);
    }
}
