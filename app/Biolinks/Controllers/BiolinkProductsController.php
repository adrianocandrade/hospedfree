<?php

namespace App\Biolinks\Controllers;

use App\Biolinks\Models\Biolink;
use App\Biolinks\Models\BiolinkProduct;
use App\Biolinks\Resources\BiolinkProductResource;
use App\Biolinks\Requests\CrupdateBiolinkProductRequest;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class BiolinkProductsController extends Controller
{
    public function index(int $biolinkId)
    {
        $biolink = $this->authorizeBiolink($biolinkId);

        return BiolinkProductResource::collection(
            $biolink->products()->orderBy('position')->orderBy('id')->get(),
        );
    }

    public function store(
        int $biolinkId,
        CrupdateBiolinkProductRequest $request,
    ) {
        $biolink = $this->authorizeBiolink($biolinkId);
        $product = $biolink
            ->products()
            ->create($this->normalize($request->validated()));

        return new BiolinkProductResource($product);
    }

    public function update(
        int $biolinkId,
        int $productId,
        CrupdateBiolinkProductRequest $request,
    ) {
        $biolink = $this->authorizeBiolink($biolinkId);
        $product = $biolink->products()->findOrFail($productId);
        $product->update($this->normalize($request->validated()));

        return new BiolinkProductResource($product->fresh());
    }

    public function destroy(int $biolinkId, int $productId)
    {
        $biolink = $this->authorizeBiolink($biolinkId);
        $biolink->products()->findOrFail($productId)->delete();

        return response()->noContent();
    }

    public function reorder(int $biolinkId, Request $request)
    {
        $biolink = $this->authorizeBiolink($biolinkId);
        $data = $request->validate([
            'ids' => ['required', 'array', 'max:100'],
            'ids.*' => ['integer', 'distinct'],
        ]);
        $products = $biolink
            ->products()
            ->whereIn('id', $data['ids'])
            ->get()
            ->keyBy('id');

        if ($products->count() !== count($data['ids'])) {
            throw ValidationException::withMessages([
                'ids' => 'Products must belong to this biolink.',
            ]);
        }

        foreach (array_values($data['ids']) as $position => $id) {
            $products[$id]->update(['position' => $position]);
        }

        return BiolinkProductResource::collection(
            $biolink->products()->orderBy('position')->orderBy('id')->get(),
        );
    }

    private function authorizeBiolink(int $id): Biolink
    {
        $biolink = Biolink::query()->findOrFail($id);
        Gate::authorize('update', $biolink);

        return $biolink;
    }

    private function normalize(array $data): array
    {
        if (isset($data['currency'])) {
            $data['currency'] = strtoupper($data['currency']);
        }

        foreach (['badge', 'stock_label'] as $key) {
            if (array_key_exists($key, $data)) {
                $data[$key] = filled($data[$key])
                    ? trim((string) $data[$key])
                    : null;
            }
        }

        return $data;
    }
}
