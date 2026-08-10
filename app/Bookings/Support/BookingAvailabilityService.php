<?php

namespace App\Bookings\Support;

use App\Biolinks\Models\Biolink;
use App\Bookings\Models\BookingAppointment;
use App\Bookings\Models\BookingService;
use App\Bookings\Models\BookingSettings;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

final class BookingAvailabilityService
{
    public function settings(Biolink $biolink): BookingSettings
    {
        return $biolink->bookingSettings()->firstOrCreate([
            'biolink_id' => $biolink->id,
        ], BookingConfig::normalizeSettings([]));
    }

    public function availableSlots(
        Biolink $biolink,
        BookingService $service,
        string $from,
        string $to,
    ): array {
        $settings = $this->settings($biolink);
        $timezone = $settings->timezone ?: 'UTC';
        $start = CarbonImmutable::createFromFormat('!Y-m-d', $from, $timezone);
        $end = CarbonImmutable::createFromFormat('!Y-m-d', $to, $timezone);

        if (!$start || !$end || $start->gt($end) || $start->diffInDays($end) > 90) {
            return [];
        }

        $slots = [];
        for ($date = $start; $date->lte($end); $date = $date->addDay()) {
            foreach ($this->intervalsForDate($biolink, $date) as $interval) {
                $intervalStart = CarbonImmutable::createFromFormat('Y-m-d H:i', $date->format('Y-m-d') . ' ' . $interval['start'], $timezone);
                $intervalEnd = CarbonImmutable::createFromFormat('Y-m-d H:i', $date->format('Y-m-d') . ' ' . $interval['end'], $timezone);
                $duration = (int) $service->duration_minutes;
                $step = max(5, (int) ($service->slot_interval_minutes ?: $settings->default_slot_interval_minutes));
                $capacity = max(1, (int) ($service->capacity ?: $settings->default_capacity));

                for ($cursor = $intervalStart; $cursor->addMinutes($duration)->lte($intervalEnd); $cursor = $cursor->addMinutes($step)) {
                    if ($cursor->isToday() && $cursor->lessThanOrEqualTo(CarbonImmutable::now($timezone))) {
                        continue;
                    }

                    $endAt = $cursor->addMinutes($duration);
                    $available = $capacity - $this->activeCount($biolink, $cursor->subMinutes((int) $service->buffer_before_minutes), $endAt->addMinutes((int) $service->buffer_after_minutes));
                    if ($available > 0) {
                        $slots[] = [
                            'date' => $cursor->format('Y-m-d'),
                            'time' => $cursor->format('H:i'),
                            'startAt' => $cursor->toIso8601String(),
                            'endAt' => $endAt->toIso8601String(),
                            'availableSpots' => $available,
                        ];
                    }
                }
            }
        }

        return $slots;
    }

    public function assertAvailable(Biolink $biolink, BookingService $service, string $date, string $time): array
    {
        $settings = $this->settings($biolink);
        $timezone = $settings->timezone ?: 'UTC';
        $start = CarbonImmutable::createFromFormat('!Y-m-d H:i', "$date $time", $timezone);
        if (!$start) {
            abort(422, __('The selected time is invalid.'));
        }

        $end = $start->addMinutes((int) $service->duration_minutes);
        $matches = collect($this->availableSlots($biolink, $service, $date, $date));
        $slot = $matches->first(fn(array $item) => $item['time'] === $time);
        if (!$slot) {
            abort(422, __('The selected time is no longer available.'));
        }

        return [$start, $end];
    }

    private function intervalsForDate(Biolink $biolink, CarbonImmutable $date): array
    {
        $rules = $biolink->bookingAvailabilityRules()
            ->where('weekday', $date->dayOfWeekIso)
            ->where('active', true)
            ->get(['start_time', 'end_time'])
            ->map(fn($rule) => ['start' => substr($rule->start_time, 0, 5), 'end' => substr($rule->end_time, 0, 5)])
            ->values()
            ->all();

        $exceptions = $biolink->bookingAvailabilityExceptions()
            ->whereDate('exception_date', $date->format('Y-m-d'))
            ->where('active', true)
            ->get();

        if ($exceptions->where('type', 'closed')->isNotEmpty()) {
            return [];
        }

        $open = $exceptions->where('type', 'open');
        if ($open->isNotEmpty()) {
            $rules = $open->map(fn($exception) => [
                'start' => substr((string) $exception->start_time, 0, 5),
                'end' => substr((string) $exception->end_time, 0, 5),
            ])->filter(fn(array $item) => $item['start'] && $item['end'])->values()->all();
        }

        foreach ($exceptions->where('type', 'break') as $break) {
            $rules = $this->subtract($rules, substr((string) $break->start_time, 0, 5), substr((string) $break->end_time, 0, 5));
        }

        return $rules;
    }

    private function subtract(array $intervals, string $breakStart, string $breakEnd): array
    {
        $result = [];
        foreach ($intervals as $interval) {
            if ($breakEnd <= $interval['start'] || $breakStart >= $interval['end']) {
                $result[] = $interval;
                continue;
            }
            if ($breakStart > $interval['start']) {
                $result[] = ['start' => $interval['start'], 'end' => min($breakStart, $interval['end'])];
            }
            if ($breakEnd < $interval['end']) {
                $result[] = ['start' => max($breakEnd, $interval['start']), 'end' => $interval['end']];
            }
        }
        return array_values(array_filter($result, fn(array $item) => $item['start'] < $item['end']));
    }

    private function activeCount(Biolink $biolink, CarbonImmutable $start, CarbonImmutable $end): int
    {
        return BookingAppointment::query()
            ->where('biolink_id', $biolink->id)
            ->where('status', BookingAppointment::CONFIRMED)
            ->where('starts_at', '<', $end->utc())
            ->where('ends_at', '>', $start->utc())
            ->count();
    }
}
