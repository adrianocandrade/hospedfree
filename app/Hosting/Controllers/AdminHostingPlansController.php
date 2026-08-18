<?php

namespace App\Hosting\Controllers;

use App\Hosting\Enums\HostingPlanType;
use App\Hosting\Models\HostingPlan;
use App\Hosting\Models\HostingProviderPackage;
use App\Hosting\Resources\HostingPlanResource;
use App\Hosting\Support\AuthorizesHostingAdmin;
use Common\Billing\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminHostingPlansController
{
    use AuthorizesHostingAdmin;

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorizeHostingAdmin($request, 'hosting.settings');
        return HostingPlanResource::collection(
            HostingPlan::query()
                ->with(['product.prices', 'providerPackages'])
                ->orderBy('sort_order')
                ->get(),
        );
    }

    public function store(Request $request): HostingPlanResource
    {
        $this->authorizeHostingAdmin($request, 'hosting.settings');
        $data = $this->validatePlan($request);
        Product::findOrFail($data['product_id']);
        $plan = HostingPlan::create($data);
        return new HostingPlanResource(
            $plan->load(['product.prices', 'providerPackages']),
        );
    }

    public function update(Request $request, int $plan): HostingPlanResource
    {
        $this->authorizeHostingAdmin($request, 'hosting.settings');
        $model = HostingPlan::findOrFail($plan);
        $model->update(
            $this->validatePlan($request, partial: true, planId: $model->id),
        );
        return new HostingPlanResource(
            $model->load(['product.prices', 'providerPackages']),
        );
    }

    public function providerPackage(Request $request, int $plan): JsonResponse
    {
        $this->authorizeHostingAdmin($request, 'hosting.settings');
        $data = $request->validate([
            'provider' => ['required', Rule::in(['fake', 'mofh'])],
            'remote_package' => ['required', 'string', 'max:120'],
            'is_active' => ['nullable', 'boolean'],
        ]);
        $model = HostingPlan::findOrFail($plan);
        $package = HostingProviderPackage::updateOrCreate(
            ['hosting_plan_id' => $model->id, 'provider' => $data['provider']],
            [
                'remote_package' => trim($data['remote_package']),
                'is_active' => $data['is_active'] ?? true,
            ],
        );

        $defaultQuotas = config(
            'hospedfree.package_quotas.' .
                $data['provider'] .
                '.' .
                Str::lower(trim($data['remote_package'])),
            [],
        );
        if (is_array($defaultQuotas) && $defaultQuotas !== []) {
            $model->update([
                'quotas' => array_merge(
                    $defaultQuotas,
                    is_array($model->quotas) ? $model->quotas : [],
                ),
            ]);
        }

        return response()->json($package);
    }

    private function validatePlan(
        Request $request,
        bool $partial = false,
        ?int $planId = null,
    ): array {
        $presence = $partial ? 'sometimes' : 'required';
        return $request->validate([
            'product_id' => [
                $presence,
                'integer',
                'exists:products,id',
                Rule::unique('hosting_plans', 'product_id')->ignore($planId),
            ],
            'type' => [$presence, Rule::enum(HostingPlanType::class)],
            'max_accounts_per_workspace' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
            'quotas' => ['nullable', 'array'],
            'quotas.disk_mb' => ['sometimes', 'integer', 'min:1'],
            'quotas.bandwidth_mb' => ['sometimes', 'integer', 'min:1'],
            'quotas.domains' => ['sometimes', 'integer', 'min:1'],
            'quotas.databases' => ['sometimes', 'integer', 'min:0'],
            'quotas.ad_free' => ['sometimes', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ]);
    }
}
