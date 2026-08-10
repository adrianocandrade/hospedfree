<?php

namespace App\Bookings\Controllers;

use App\Biolinks\Models\Biolink;
use App\Bookings\Models\BookingService;
use App\Bookings\Requests\CrupdateBookingServiceRequest;
use App\Bookings\Resources\BookingServiceResource;
use App\Bookings\Support\BookingConfig;
use App\Bookings\Support\BookingPlanGuard;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;

class BookingServicesController extends Controller
{
    public function index(int $biolinkId)
    {
        $biolink = $this->biolink($biolinkId);
        Gate::authorize('update', $biolink);
        app(BookingPlanGuard::class)->ensureAllowed($biolink);

        return BookingServiceResource::collection($biolink->bookingServices()->orderBy('position')->orderBy('id')->get());
    }

    public function store(int $biolinkId, CrupdateBookingServiceRequest $request)
    {
        $biolink = $this->biolink($biolinkId);
        Gate::authorize('update', $biolink);
        app(BookingPlanGuard::class)->ensureAllowed($biolink);
        $service = $biolink->bookingServices()->create(BookingConfig::normalizeService($request->validated()));

        return new BookingServiceResource($service);
    }

    public function update(int $biolinkId, int $serviceId, CrupdateBookingServiceRequest $request)
    {
        $biolink = $this->biolink($biolinkId);
        Gate::authorize('update', $biolink);
        app(BookingPlanGuard::class)->ensureAllowed($biolink);
        $service = $biolink->bookingServices()->findOrFail($serviceId);
        $service->update(BookingConfig::normalizeService($request->validated()));

        return new BookingServiceResource($service->fresh());
    }

    public function destroy(int $biolinkId, int $serviceId)
    {
        $biolink = $this->biolink($biolinkId);
        Gate::authorize('update', $biolink);
        app(BookingPlanGuard::class)->ensureAllowed($biolink);
        $biolink->bookingServices()->findOrFail($serviceId)->delete();
        return response()->noContent();
    }

    private function biolink(int $id): Biolink
    {
        return Biolink::query()->findOrFail($id);
    }
}
