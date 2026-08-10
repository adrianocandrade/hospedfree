<?php

namespace App\Biolinks\Controllers;

use App\Biolinks\Jobs\ExportBiolinkWidgetSubmissionsCsv;
use App\Biolinks\Models\Biolink;
use App\Biolinks\Models\BiolinkWidget;
use App\Biolinks\Models\BiolinkWidgetSubmission;
use App\Biolinks\Resources\BiolinkWidgetSubmissionResource;
use App\Biolinks\Support\BiolinkWidgetConfig;
use App\Biolinks\Support\BiolinkPollResults;
use Common\Csv\CsvExport;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

#[Group('Biolinks', weight: 6)]
class BiolinkWidgetSubmissionsController extends Controller
{
    /**
     * List captured widget data for a biolink.
     *
     * @operationId listBiolinkWidgetSubmissions
     */
    public function index(int $biolinkId, Request $request)
    {
        $biolink = Biolink::findOrFail($biolinkId);
        Gate::authorize('update', $biolink);

        $data = $this->validateFilters($request);
        $pagination = $this->applyFilters(
            $biolink
                ->widgetSubmissions()
                ->getQuery()
                ->with('widget'),
            $data,
        )
            ->latest()
            ->paginate($data['per_page'] ?? 25);

        $newCount = $biolink
            ->widgetSubmissions()
            ->where('status', BiolinkWidgetSubmission::STATUS_NEW)
            ->count();

        $summary = ['new_count' => $newCount];
        if ($data['include_poll_results'] ?? false) {
            $pollWidgets = $biolink
                ->widgets()
                ->where('type', 'poll')
                ->with('items')
                ->orderBy('position')
                ->get();
            $pollSubmissions = $biolink
                ->widgetSubmissions()
                ->where('widget_type', 'poll')
                ->orderBy('id')
                ->cursor();
            $summary['poll_results'] = app(BiolinkPollResults::class)->summarize(
                $pollWidgets,
                $pollSubmissions,
            );
        }

        return BiolinkWidgetSubmissionResource::collection($pagination)
            ->additional(['summary' => $summary]);
    }

    /**
     * Retrieve a captured widget submission.
     *
     * @operationId retrieveBiolinkWidgetSubmission
     */
    public function show(int $biolinkId, int $submissionId)
    {
        $biolink = Biolink::findOrFail($biolinkId);
        Gate::authorize('update', $biolink);

        $submission = $biolink
            ->widgetSubmissions()
            ->with('widget')
            ->findOrFail($submissionId);

        return new BiolinkWidgetSubmissionResource($submission);
    }

    /**
     * Update captured widget submission status.
     *
     * @operationId updateBiolinkWidgetSubmission
     */
    public function update(int $biolinkId, int $submissionId, Request $request)
    {
        $biolink = Biolink::findOrFail($biolinkId);
        Gate::authorize('update', $biolink);

        $data = $request->validate([
            /** @var 'new' | 'read' | 'archived' */
            'status' => [
                'required',
                Rule::in([
                    BiolinkWidgetSubmission::STATUS_NEW,
                    BiolinkWidgetSubmission::STATUS_READ,
                    BiolinkWidgetSubmission::STATUS_ARCHIVED,
                ]),
            ],
        ]);

        $submission = $biolink
            ->widgetSubmissions()
            ->with('widget')
            ->findOrFail($submissionId);

        $submission->update([
            'status' => $data['status'],
            'read_at' => $data['status'] === BiolinkWidgetSubmission::STATUS_READ
                ? now()
                : $submission->read_at,
            'archived_at' => $data['status'] === BiolinkWidgetSubmission::STATUS_ARCHIVED
                ? now()
                : null,
        ]);

        return new BiolinkWidgetSubmissionResource($submission->fresh('widget'));
    }

    /**
     * Delete a captured widget submission.
     *
     * @operationId deleteBiolinkWidgetSubmission
     */
    public function destroy(int $biolinkId, int $submissionId)
    {
        $biolink = Biolink::findOrFail($biolinkId);
        Gate::authorize('update', $biolink);

        $biolink->widgetSubmissions()->findOrFail($submissionId)->delete();

        return response()->noContent();
    }

    /**
     * Export captured widget data as CSV.
     *
     * @operationId exportBiolinkWidgetSubmissionsCsv
     */
    public function exportCsv(int $biolinkId, Request $request)
    {
        $biolink = Biolink::findOrFail($biolinkId);
        Gate::authorize('update', $biolink);

        return CsvExport::exportUsing(
            new ExportBiolinkWidgetSubmissionsCsv(
                Auth::id(),
                $biolink->id,
                $this->validateFilters($request),
            ),
        );
    }

    /**
     * Store captured widget data from a public biolink page.
     *
     * @operationId storePublicBiolinkWidgetSubmission
     */
    public function storePublic(int $biolinkId, int $widgetId, Request $request)
    {
        $biolink = Biolink::query()
            ->with('widgets')
            ->findOrFail($biolinkId);
        $widget = $biolink
            ->widgets()
            ->where('active', true)
            ->findOrFail($widgetId);
        $widget->load('items');
        $widgetConfig = new BiolinkWidgetConfig();

        abort_unless($widgetConfig->acceptsSubmissions($widget->type), 404);
        abort_unless($widget->isCurrentlyVisible(), 404);

        $data = $this->validatePublicSubmission($widget, $request);

        $submission = $biolink->widgetSubmissions()->create([
            'widget_id' => $widget->id,
            'user_id' => $biolink->user_id,
            'workspace_id' => $biolink->workspace_id,
            'widget_type' => $widget->type,
            'status' => BiolinkWidgetSubmission::STATUS_NEW,
            'name' => Arr::get($data, 'name'),
            'email' => Arr::get($data, 'email'),
            'phone' => Arr::get($data, 'phone'),
            'message' => Arr::get($data, 'message'),
            'payload' => Arr::get($data, 'payload', []),
            'consent_at' => Arr::get($data, 'consent') ? now() : null,
            'ip_hash' => $request->ip()
                ? hash('sha256', $request->ip() . '|' . config('app.key'))
                : null,
            'user_agent' => str($request->userAgent())->limit(500, '')->toString(),
            'referrer' => str($request->headers->get('referer', ''))->limit(1000, '')->toString(),
        ]);

        $response = new BiolinkWidgetSubmissionResource($submission);

        if (
            $widget->type === 'poll' &&
            (bool) Arr::get($widget->config, 'showResults', true)
        ) {
            $pollSubmissions = $biolink
                ->widgetSubmissions()
                ->where('widget_id', $widget->id)
                ->where('widget_type', 'poll')
                ->orderBy('id')
                ->cursor();
            $pollResults = app(BiolinkPollResults::class)->summarize(
                collect([$widget]),
                $pollSubmissions,
            );

            return $response->additional([
                'poll_results' => $pollResults[0] ?? null,
            ]);
        }

        return $response;
    }

    private function validateFilters(Request $request): array
    {
        return $request->validate([
            'query' => 'nullable|string|max:100',
            'widget_type' => ['nullable', 'string', Rule::in(BiolinkWidgetConfig::SUBMISSION_TYPES)],
            'widget_id' => 'nullable|integer',
            'status' => [
                'nullable',
                Rule::in([
                    BiolinkWidgetSubmission::STATUS_NEW,
                    BiolinkWidgetSubmission::STATUS_READ,
                    BiolinkWidgetSubmission::STATUS_ARCHIVED,
                ]),
            ],
            'created_from' => 'nullable|date',
            'created_to' => 'nullable|date',
            'per_page' => 'integer|min:1|max:100',
            'page' => 'integer|min:1',
            'include_poll_results' => 'sometimes|boolean',
        ]);
    }

    public function applyFilters(Builder $query, array $data): Builder
    {
        return $query
            ->when(
                Arr::get($data, 'query'),
                fn(Builder $query, string $search) => $query->where(function (Builder $query) use ($search) {
                    $query
                        ->where('name', 'like', "%$search%")
                        ->orWhere('email', 'like', "%$search%")
                        ->orWhere('phone', 'like', "%$search%")
                        ->orWhere('message', 'like', "%$search%")
                        ->orWhere('payload', 'like', "%$search%");
                }),
            )
            ->when(
                Arr::get($data, 'widget_type'),
                fn(Builder $query, string $type) => $query->where('widget_type', $type),
            )
            ->when(
                Arr::get($data, 'widget_id'),
                fn(Builder $query, int $widgetId) => $query->where('widget_id', $widgetId),
            )
            ->when(
                Arr::get($data, 'status'),
                fn(Builder $query, string $status) => $query->where('status', $status),
            )
            ->when(
                Arr::get($data, 'created_from'),
                fn(Builder $query, string $date) => $query->whereDate('created_at', '>=', $date),
            )
            ->when(
                Arr::get($data, 'created_to'),
                fn(Builder $query, string $date) => $query->whereDate('created_at', '<=', $date),
            );
    }

    private function validatePublicSubmission(
        BiolinkWidget $widget,
        Request $request,
    ): array {
        $type = $widget->type;
        $config = $widget->config;
        $contactMode = Arr::get($config, 'contactMode', 'email_required');
        $allowGuests = (bool) Arr::get($config, 'allowGuests', false);
        $maxGuests = $allowGuests
            ? min(max((int) Arr::get($config, 'maxGuests', 0), 0), 10)
            : 0;

        $contactRules = $this->contactRules($contactMode);

        $rules = match ($type) {
            'contactForm' => [
                'name' => 'required|string|max:160',
                ...$contactRules,
                'message' => 'required|string|max:2000',
                'consent' => 'accepted',
                'payload' => 'nullable|array',
            ],
            'emailSignup' => [
                'name' => 'nullable|string|max:160',
                'email' => 'required|email|max:255',
                'consent' => 'accepted',
                'payload' => 'nullable|array',
            ],
            'smsSignup' => [
                'name' => 'nullable|string|max:160',
                'phone' => 'required|string|max:60',
                'consent' => 'accepted',
                'payload' => 'nullable|array',
            ],
            'poll' => [
                'consent' => 'accepted',
                'payload' => 'required|array',
                'payload.option' => 'required|string|max:160',
            ],
            'eventRsvp' => [
                'name' => 'required|string|max:160',
                ...$contactRules,
                'message' => 'nullable|string|max:1000',
                'consent' => 'accepted',
                'payload' => 'required|array',
                'payload.response' => 'required|string|in:going,maybe,waitlist,interested',
                'payload.guest_count' => "nullable|integer|min:0|max:$maxGuests",
                'payload.guests' => "nullable|array|max:$maxGuests",
            ],
            default => [],
        };

        $validator = Validator::make($request->all(), $rules);
        $validator->after(function ($validator) use (
            $request,
            $widget,
            $type,
            $contactMode,
            $config,
            $allowGuests,
            $maxGuests,
        ) {
            foreach ([
                'name',
                'email',
                'phone',
                'message',
                'payload.response',
                'payload.option',
            ] as $key) {
                $value = $request->input($key);
                if (is_string($value) && str_contains($value, '<')) {
                    $validator->errors()->add(
                        $key,
                        'The field contains unsupported characters.',
                    );
                }
            }

            if (
                $contactMode === 'email_or_phone' &&
                !$request->filled('email') &&
                !$request->filled('phone')
            ) {
                $validator->errors()->add(
                    'email',
                    'Either email or phone is required.',
                );
            }

            if ($type === 'poll') {
                $option = $request->input('payload.option');
                $allowedOptions = $widget
                    ->items
                    ->filter(fn($item) => (bool) $item->active)
                    ->pluck('title')
                    ->filter()
                    ->values()
                    ->all();

                if ($allowedOptions && !in_array($option, $allowedOptions, true)) {
                    $validator->errors()->add(
                        'payload.option',
                        'The selected poll option is invalid.',
                    );
                }

                return;
            }

            if ($type !== 'eventRsvp') {
                return;
            }

            if (
                $request->input('payload.response') === 'waitlist' &&
                !Arr::get($config, 'allowWaitlist', false)
            ) {
                $validator->errors()->add(
                    'payload.response',
                    'Waitlist responses are not enabled for this widget.',
                );
            }

            $guestCount = (int) $request->input('payload.guest_count', 0);
            $guests = $request->input('payload.guests', []);

            if (!$allowGuests && $guestCount > 0) {
                $validator->errors()->add(
                    'payload.guest_count',
                    'Guests are not enabled for this widget.',
                );
            }

            if ($guestCount > $maxGuests) {
                $validator->errors()->add(
                    'payload.guest_count',
                    "Guests must not be greater than $maxGuests.",
                );
            }

            if ($guestCount === 0) {
                return;
            }

            if (!is_array($guests) || count($guests) !== $guestCount) {
                $validator->errors()->add(
                    'payload.guests',
                    'Guest names are required for the selected quantity.',
                );
                return;
            }

            foreach ($guests as $index => $guest) {
                $name = is_array($guest) ? Arr::get($guest, 'name') : $guest;
                if (!is_string($name) || trim($name) === '') {
                    $validator->errors()->add(
                        "payload.guests.$index.name",
                        'Guest name is required.',
                    );
                    continue;
                }

                if (str_contains($name, '<') || str($name)->length() > 160) {
                    $validator->errors()->add(
                        "payload.guests.$index.name",
                        'Guest name is invalid.',
                    );
                }
            }
        });

        $data = $validator->validate();

        if ($type === 'eventRsvp') {
            $payload = Arr::get($data, 'payload', []);
            $guests = collect(Arr::get($payload, 'guests', []))
                ->map(fn($guest) => [
                    'name' => trim(is_array($guest) ? Arr::get($guest, 'name', '') : $guest),
                ])
                ->filter(fn($guest) => $guest['name'] !== '')
                ->values()
                ->all();

            $data['payload'] = [
                'response' => Arr::get($payload, 'response'),
                'guest_count' => (int) Arr::get($payload, 'guest_count', 0),
                'guests' => $guests,
            ];
        }

        if ($type === 'poll') {
            $data['payload'] = [
                'option' => trim((string) Arr::get($data, 'payload.option')),
            ];
        }

        return $data;
    }

    private function contactRules(string $contactMode): array
    {
        return match ($contactMode) {
            'phone_required' => [
                'email' => 'nullable|email|max:255',
                'phone' => 'required|string|max:60',
            ],
            'email_or_phone' => [
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:60',
            ],
            'email_and_phone' => [
                'email' => 'required|email|max:255',
                'phone' => 'required|string|max:60',
            ],
            default => [
                'email' => 'required|email|max:255',
                'phone' => 'nullable|string|max:60',
            ],
        };
    }
}
