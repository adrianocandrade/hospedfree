<?php

namespace App\Bookings\Controllers;

use App\Biolinks\Models\Biolink;
use App\Bookings\Models\BookingAppointment;
use App\Bookings\Requests\UpdateBookingAppointmentRequest;
use App\Bookings\Resources\BookingAppointmentResource;
use App\Bookings\Support\BookingAvailabilityService;
use App\Bookings\Support\BookingMailSender;
use App\Bookings\Support\BookingPlanGuard;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class BookingAppointmentsController extends Controller
{
    public function index(int $biolinkId, Request $request)
    {
        $biolink = $this->authorizeBiolink($biolinkId);
        app(BookingPlanGuard::class)->ensureAllowed($biolink);
        $appointments = $biolink->bookingAppointments()
            ->with('service')
            ->when($request->filled('from'), fn($query) => $query->whereDate('starts_at', '>=', $request->input('from')))
            ->when($request->filled('to'), fn($query) => $query->whereDate('starts_at', '<=', $request->input('to')))
            ->when($request->filled('status'), fn($query) => $query->where('status', $request->input('status')))
            ->orderBy('starts_at')
            ->paginate(50);

        return BookingAppointmentResource::collection($appointments);
    }

    public function show(int $biolinkId, int $appointmentId)
    {
        $biolink = $this->authorizeBiolink($biolinkId);
        return new BookingAppointmentResource($biolink->bookingAppointments()->with('service')->findOrFail($appointmentId));
    }

    public function update(int $biolinkId, int $appointmentId, UpdateBookingAppointmentRequest $request)
    {
        $biolink = $this->authorizeBiolink($biolinkId);
        app(BookingPlanGuard::class)->ensureAllowed($biolink);
        $appointment = $biolink->bookingAppointments()->with('service')->findOrFail($appointmentId);
        $data = $request->validated();
        $event = null;

        DB::transaction(function () use ($biolink, $appointment, $data, &$event) {
            $lockedService = $appointment->service()->lockForUpdate()->firstOrFail();
            if (isset($data['date'], $data['time'])) {
                [$start, $end] = app(BookingAvailabilityService::class)->assertAvailable($biolink, $lockedService, $data['date'], $data['time']);
                $appointment->starts_at = $start->utc();
                $appointment->ends_at = $end->utc();
                $appointment->timezone = app(BookingAvailabilityService::class)->settings($biolink)->timezone;
                $appointment->status = BookingAppointment::CONFIRMED;
                $event = 'rescheduled';
            } elseif (isset($data['status'])) {
                $appointment->status = $data['status'];
                $event = $data['status'];
                if (str_starts_with($data['status'], 'cancelled_')) {
                    $appointment->cancelled_at = now();
                    $appointment->cancellation_reason = 'Cancelled by the responsible person.';
                }
            }
            $appointment->save();
            $appointment->events()->create(['event' => $event ?: 'updated', 'actor_id' => request()->user()?->id]);
        });

        if ($event) {
            $freshAppointment = $appointment->fresh(['service', 'biolink']);
            app(BookingMailSender::class)->send($freshAppointment, $event);
            app(BookingMailSender::class)->sendToResponsible($freshAppointment, $event);
        }

        return new BookingAppointmentResource($appointment->fresh(['service']));
    }

    private function authorizeBiolink(int $id): Biolink
    {
        $biolink = Biolink::query()->findOrFail($id);
        Gate::authorize('update', $biolink);
        return $biolink;
    }
}
