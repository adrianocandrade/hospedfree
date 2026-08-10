<?php

namespace App\Bookings\Controllers;

use App\Biolinks\Models\Biolink;
use App\Bookings\Models\BookingMailConnection;
use App\Bookings\Requests\UpdateBookingAvailabilityRequest;
use App\Bookings\Support\BookingConfig;
use App\Bookings\Support\BookingPlanGuard;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class BookingAvailabilityController extends Controller
{
    public function show(int $biolinkId)
    {
        $biolink = $this->authorizeBiolink($biolinkId);
        $settings = app(\App\Bookings\Support\BookingAvailabilityService::class)->settings($biolink);
        return response()->json([
            'settings' => $settings,
            'rules' => $biolink->bookingAvailabilityRules()->orderBy('weekday')->orderBy('start_time')->get(),
            'exceptions' => $biolink->bookingAvailabilityExceptions()->orderBy('exception_date')->get(),
        ]);
    }

    public function update(int $biolinkId, UpdateBookingAvailabilityRequest $request)
    {
        $biolink = $this->authorizeBiolink($biolinkId);
        app(BookingPlanGuard::class)->ensureAllowed($biolink);
        $data = $request->validated();

        DB::transaction(function () use ($biolink, $data) {
            $settings = app(\App\Bookings\Support\BookingAvailabilityService::class)->settings($biolink);
            $settings->update(BookingConfig::normalizeSettings(array_merge($settings->toArray(), $data['settings'] ?? [])));
            if (array_key_exists('mail_connection_id', $data['settings'] ?? [])) {
                $connection = isset($data['settings']['mail_connection_id'])
                    ? BookingMailConnection::query()->where('workspace_id', $biolink->workspace_id)->find($data['settings']['mail_connection_id'])
                    : null;
                abort_if(isset($data['settings']['mail_connection_id']) && !$connection, 422, __('The selected email connection is invalid.'));
            }

            if (array_key_exists('rules', $data)) {
                $biolink->bookingAvailabilityRules()->delete();
                $biolink->bookingAvailabilityRules()->createMany(collect($data['rules'] ?? [])->map(fn(array $rule) => [
                    'weekday' => $rule['weekday'],
                    'start_time' => $rule['start_time'],
                    'end_time' => $rule['end_time'],
                    'active' => $rule['active'] ?? true,
                ])->all());
            }
            if (array_key_exists('exceptions', $data)) {
                $biolink->bookingAvailabilityExceptions()->delete();
                $biolink->bookingAvailabilityExceptions()->createMany(collect($data['exceptions'] ?? [])->map(fn(array $exception) => [
                    ...$exception,
                    'active' => $exception['active'] ?? true,
                ])->all());
            }
        });

        return $this->show($biolinkId);
    }

    private function authorizeBiolink(int $id): Biolink
    {
        $biolink = Biolink::query()->findOrFail($id);
        Gate::authorize('update', $biolink);
        return $biolink;
    }
}
