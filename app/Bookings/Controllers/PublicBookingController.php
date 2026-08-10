<?php

namespace App\Bookings\Controllers;

use App\Biolinks\Models\Biolink;
use App\Bookings\Models\BookingAppointment;
use App\Bookings\Models\BookingService;
use App\Bookings\Requests\CreatePublicBookingRequest;
use App\Bookings\Requests\UpdatePublicBookingRequest;
use App\Bookings\Resources\BookingAppointmentResource;
use App\Bookings\Resources\BookingServiceResource;
use App\Bookings\Support\BookingAvailabilityService;
use App\Bookings\Support\BookingMailSender;
use App\Bookings\Support\BookingToken;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class PublicBookingController extends Controller
{
    public function services(int $biolinkId)
    {
        $biolink = Biolink::query()->findOrFail($biolinkId);
        return BookingServiceResource::collection($biolink->bookingServices()->where('active', true)->orderBy('position')->orderBy('id')->get());
    }

    public function availability(int $biolinkId, Request $request)
    {
        $biolink = Biolink::query()->findOrFail($biolinkId);
        $data = $request->validate([
            'service_id' => 'required|integer',
            'from' => 'nullable|date_format:Y-m-d',
            'to' => 'nullable|date_format:Y-m-d',
        ]);
        $service = $biolink->bookingServices()->where('active', true)->findOrFail($data['service_id']);
        $from = $data['from'] ?? now()->format('Y-m-d');
        $to = $data['to'] ?? CarbonImmutable::parse($from)->addDays(30)->format('Y-m-d');

        return response()->json(['data' => app(BookingAvailabilityService::class)->availableSlots($biolink, $service, $from, $to)]);
    }

    public function store(int $biolinkId, CreatePublicBookingRequest $request)
    {
        $biolink = Biolink::query()->findOrFail($biolinkId);
        $data = $request->validated();
        [$plainToken, $hash] = BookingToken::create();
        $appointment = DB::transaction(function () use ($biolink, $data, $hash) {
            $service = $biolink->bookingServices()->where('active', true)->whereKey($data['service_id'])->lockForUpdate()->firstOrFail();
            [$start, $end] = app(BookingAvailabilityService::class)->assertAvailable($biolink, $service, $data['date'], $data['time']);
            $settings = app(BookingAvailabilityService::class)->settings($biolink);
            return $biolink->bookingAppointments()->create([
                'workspace_id' => $biolink->workspace_id,
                'service_id' => $service->id,
                'starts_at' => $start->utc(),
                'ends_at' => $end->utc(),
                'timezone' => $settings->timezone,
                'customer_name' => trim($data['name']),
                'customer_email' => strtolower(trim($data['email'])),
                'customer_phone' => $data['phone'] ?? null,
                'status' => BookingAppointment::CONFIRMED,
                'manage_token_hash' => $hash,
                'manage_token_expires_at' => now()->addDays(30),
                'meeting_url' => $service->meeting_url,
                'payment_url' => $service->payment_url,
                'pix_key' => $service->pix_key,
                'payment_instructions' => $service->payment_instructions,
                'payment_confirmation_url' => $service->payment_confirmation_url,
                'payment_confirmation_instructions' => $service->payment_confirmation_instructions,
                'release_info_after_booking' => $service->release_info_after_booking,
                'price' => $service->price,
                'currency' => $service->currency,
            ]);
        });
        $appointment->events()->create(['event' => 'confirmed']);
        $appointment->setAttribute('manage_token', $plainToken);
        $appointment->load('service', 'biolink');
        $mailSent = app(BookingMailSender::class)->send($appointment, 'confirmed');
        app(BookingMailSender::class)->sendToResponsible($appointment, 'confirmed');

        return response()->json([
            'data' => new BookingAppointmentResource($appointment),
            'notifications' => ['email_sent' => $mailSent],
            'calendar' => $this->calendarLinks($appointment, $plainToken),
        ], 201);
    }

    public function show(string $token)
    {
        $appointment = $this->findByToken($token)->load('service');
        return new BookingAppointmentResource($appointment);
    }

    public function cancel(string $token)
    {
        $appointment = $this->findByToken($token)->load('biolink');
        $settings = app(BookingAvailabilityService::class)->settings($appointment->biolink);
        abort_unless($settings->customer_can_cancel, 422, __('Customer cancellation is disabled.'));
        abort_if($settings->cancellation_deadline_minutes !== null && now()->diffInMinutes($appointment->starts_at, false) < $settings->cancellation_deadline_minutes, 422, __('The cancellation deadline has passed.'));
        $appointment->update([
            'status' => BookingAppointment::CANCELLED_BY_CUSTOMER,
            'cancelled_at' => now(),
            'cancellation_reason' => 'Cancelled by the customer.',
        ]);
        $appointment->events()->create(['event' => BookingAppointment::CANCELLED_BY_CUSTOMER]);
        $freshAppointment = $appointment->fresh(['service', 'biolink']);
        app(BookingMailSender::class)->send($freshAppointment, 'cancelled');
        app(BookingMailSender::class)->sendToResponsible($freshAppointment, 'cancelled');
        return new BookingAppointmentResource($appointment->fresh('service'));
    }

    public function reschedule(string $token, UpdatePublicBookingRequest $request)
    {
        $appointment = $this->findByToken($token)->load('biolink', 'service');
        $settings = app(BookingAvailabilityService::class)->settings($appointment->biolink);
        abort_unless($settings->customer_can_reschedule, 422, __('Customer rescheduling is disabled.'));
        $data = $request->validated();

        DB::transaction(function () use ($appointment, $data) {
            $service = $appointment->service()->lockForUpdate()->firstOrFail();
            [$start, $end] = app(BookingAvailabilityService::class)->assertAvailable($appointment->biolink, $service, $data['date'], $data['time']);
            $appointment->update([
                'starts_at' => $start->utc(),
                'ends_at' => $end->utc(),
                'status' => BookingAppointment::CONFIRMED,
                'timezone' => app(BookingAvailabilityService::class)->settings($appointment->biolink)->timezone,
            ]);
            $appointment->events()->create(['event' => BookingAppointment::RESCHEDULED]);
        });

        $appointment->setAttribute('manage_token', $token);
        $freshAppointment = $appointment->fresh(['service', 'biolink']);
        app(BookingMailSender::class)->send($freshAppointment, 'rescheduled');
        app(BookingMailSender::class)->sendToResponsible($freshAppointment, 'rescheduled');
        return new BookingAppointmentResource($appointment->fresh('service'));
    }

    public function calendar(string $token): Response
    {
        $appointment = $this->findByToken($token)->load('service');
        $start = $appointment->starts_at->utc()->format('Ymd\THis\Z');
        $end = $appointment->ends_at->utc()->format('Ymd\THis\Z');
        $summary = addcslashes((string) $appointment->service?->name, ',;\\');
        $description = (string) $appointment->service?->description;
        if ($appointment->meeting_url) {
            $description .= "\n" . __('Meeting link') . ': ' . $appointment->meeting_url;
        }
        $description = addcslashes($description, ',;\\');
        $location = addcslashes((string) $appointment->meeting_url, ',;\\');
        $locationLine = $location ? "LOCATION:$location\r\n" : '';
        $urlLine = $location ? "URL:$location\r\n" : '';
        $ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//MeuLinkBio//Bookings//EN\r\nBEGIN:VEVENT\r\nUID:booking-{$appointment->id}@meulinkbio\r\nDTSTART:$start\r\nDTEND:$end\r\nSUMMARY:$summary\r\nDESCRIPTION:$description\r\n{$locationLine}{$urlLine}END:VEVENT\r\nEND:VCALENDAR\r\n";
        return response($ics, 200, [
            'Content-Type' => 'text/calendar; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="agendamento.ics"',
        ]);
    }

    private function findByToken(string $token): BookingAppointment
    {
        abort_if(strlen($token) < 40, 404);
        return BookingAppointment::query()
            ->where('manage_token_hash', BookingToken::hash($token))
            ->where('manage_token_expires_at', '>', now())
            ->firstOrFail();
    }

    private function calendarLinks(BookingAppointment $appointment, string $token): array
    {
        $start = $appointment->starts_at->utc()->format('Ymd\THis\Z');
        $end = $appointment->ends_at->utc()->format('Ymd\THis\Z');
        $title = rawurlencode((string) $appointment->service?->name);
        $details = rawurlencode(trim((string) $appointment->service?->description . ($appointment->meeting_url ? "\n" . __('Meeting link') . ': ' . $appointment->meeting_url : '')));
        $location = rawurlencode((string) $appointment->meeting_url);
        return [
            'ics' => rtrim(config('app.url'), '/') . '/api/v1/public/booking/' . $token . '/calendar.ics',
            'google' => "https://calendar.google.com/calendar/render?action=TEMPLATE&text=$title&dates=$start/$end&details=$details&location=$location",
            'outlook' => "https://outlook.live.com/calendar/0/deeplink/compose?subject=$title&body=$details&location=$location&startdt=" . rawurlencode($appointment->starts_at->toIso8601String()) . '&enddt=' . rawurlencode($appointment->ends_at->toIso8601String()),
        ];
    }
}
