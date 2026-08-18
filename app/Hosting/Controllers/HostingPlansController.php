<?php

namespace App\Hosting\Controllers;

use App\Hosting\Enums\HostingPlanType;
use App\Hosting\Models\HostingPlan;
use App\Hosting\Resources\HostingPlanResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HostingPlansController
{
    public function __invoke(): AnonymousResourceCollection
    {
        abort_unless(config('hospedfree.enabled'), 404);

        $plans = HostingPlan::query()
            ->with(['product.prices', 'providerPackages'])
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->filter(function (HostingPlan $plan): bool {
                if (!$plan->product || $plan->product->hidden) {
                    return false;
                }

                if ($plan->type === HostingPlanType::Free) {
                    return $plan->product->free;
                }

                // Keep paid products visible in the comparison even while
                // checkout is not configured. The client disables purchase
                // when no usable price exists, instead of hiding the plan.
                return !$plan->product->free;
            });

        return HostingPlanResource::collection($plans);
    }
}
