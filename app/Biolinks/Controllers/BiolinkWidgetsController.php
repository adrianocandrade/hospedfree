<?php

namespace App\Biolinks\Controllers;

use App\Biolinks\Models\Biolink;
use App\Biolinks\Models\BiolinkWidget;
use App\Biolinks\Resources\BiolinkResource;
use App\Biolinks\Support\BiolinkWidgetConfig;
use App\Links\Models\Link;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

#[Group('Biolinks', weight: 6)]
class BiolinkWidgetsController extends Controller
{
    /**
     * Create a new widget for a biolink.
     *
     * @operationId createBiolinkWidget
     */
    public function store(int $biolinkId, Request $request)
    {
        $biolink = Biolink::findOrFail($biolinkId);

        Gate::authorize('update', $biolink);

        $data = $request->validate([
            'type' => ['required', 'string', Rule::in(BiolinkWidgetConfig::TYPES)],
            'position' => 'int',
            'password' => 'nullable|string|max:40',
            'expires_at' => 'nullable|date',
            'activates_at' => 'nullable|date',
            /** @var array{source?: string, medium?: string, campaign?: string, term?: string, content?: string}|null */
            'utm' => 'nullable|array',
            /** @var array<int, array{key: string, value: string}>|null */
            'utm_custom' => 'nullable|array',
            'utm_custom.*.key' => 'required_with:utm_custom|string|max:50',
            'utm_custom.*.value' => 'required_with:utm_custom|string|max:255',
            /** @var array<int, array{id: int, name?: string}|int>|null */
            'pixels' => 'nullable|array',
            'pixels.*' => 'required',
            /** @var array<int, array{type: string, key?: string|null, value?: string|null}>|null */
            'rules' => 'nullable|array',
            'rules.*.type' => ['required', 'string', Rule::in(['geo', 'device', 'platform', 'exp_clicks'])],
            'rules.*.key' => 'nullable',
            'rules.*.value' => 'nullable|string|max:250',
            /** @var array<string, string>|null */
            'config' => 'nullable|array',
            /** @var array<int, array<string, mixed>>|null */
            'items' => 'nullable|array|max:50',
            'items.*' => 'array',
        ]);

        $items = $this->validateAndNormalize($data['type'], $data, true, $biolink);

        $widget = $biolink->widgets()->create($this->inlineWidgetData($data));
        $this->syncItems($widget, $items);
        $this->syncAdvancedData($widget, $data);

        $biolink->adjustPositions(
            direction: 'increment',
            anchor: $data['position'] ?? null,
            widgetToSkip: $widget->id,
        );

        return new BiolinkResource($biolink->fresh()->loadContent());
    }

    /**
     * Update a widget for a biolink.
     *
     * @operationId updateBiolinkWidget
     */
    public function update(int $biolinkId, int $widgetId, Request $request)
    {
        $biolink = Biolink::findOrFail($biolinkId);
        $widget = $biolink->widgets()->findOrFail($widgetId);

        Gate::authorize('update', $biolink);

        $data = $request->validate([
            'type' => ['string', Rule::in(BiolinkWidgetConfig::TYPES)],
            'active' => 'boolean',
            'pinned' => 'nullable|in:top,bottom',
            'password' => 'nullable|string|max:40',
            'expires_at' => 'nullable|date',
            'activates_at' => 'nullable|date',
            /** @var array{source?: string, medium?: string, campaign?: string, term?: string, content?: string}|null */
            'utm' => 'nullable|array',
            /** @var array<int, array{key: string, value: string}>|null */
            'utm_custom' => 'nullable|array',
            'utm_custom.*.key' => 'required_with:utm_custom|string|max:50',
            'utm_custom.*.value' => 'required_with:utm_custom|string|max:255',
            /** @var array<int, array{id: int, name?: string}|int>|null */
            'pixels' => 'nullable|array',
            'pixels.*' => 'required',
            /** @var array<int, array{type: string, key?: string|null, value?: string|null}>|null */
            'rules' => 'nullable|array',
            'rules.*.type' => ['required', 'string', Rule::in(['geo', 'device', 'platform', 'exp_clicks'])],
            'rules.*.key' => 'nullable',
            'rules.*.value' => 'nullable|string|max:250',
            /** @var array<string, string> */
            'config' => 'array',
            /** @var array<int, array<string, mixed>>|null */
            'items' => 'nullable|array|max:50',
            'items.*' => 'array',
        ]);

        $items = $this->validateAndNormalize(
            $data['type'] ?? $widget->type,
            $data,
            requireConfig: false,
            biolink: $biolink,
        );

        $widget->update($this->inlineWidgetData($data));
        $this->syncItems($widget, $items);
        $this->syncAdvancedData($widget, $data);

        return new BiolinkResource($biolink->fresh()->loadContent());
    }

    /**
     * Delete a widget.
     *
     * @operationId deleteBiolinkWidget
     */
    public function destroy(int $biolinkId, int $widgetId)
    {
        $biolink = Biolink::findOrFail($biolinkId);
        $widget = $biolink->widgets()->findOrFail($widgetId);

        Gate::authorize('update', $biolink);

        $widget->rules()->delete();
        $widget->pixels()->detach();
        $widget->delete();

        $biolink->adjustPositions(
            direction: 'decrement',
            anchor: $widget->position,
        );

        return new BiolinkResource($biolink->fresh()->loadContent());
    }

    private function validateAndNormalize(
        string $type,
        array &$data,
        bool $requireConfig = true,
        Biolink|null $biolink = null,
    ): array|null {
        $config = $data['config'] ?? [];
        $items = array_key_exists('items', $data) ? $data['items'] : null;
        $validator = new BiolinkWidgetConfig();
        $config = $validator->removeEmptyUnsupportedConfigKeys($type, $config);

        if (array_key_exists('config', $data) || $requireConfig) {
            $data['config'] = $config;
        }

        $errors = $validator->validate($type, $config, $items);

        if ($errors) {
            Log::warning('Biolink widget payload validation failed.', [
                'biolink_id' => $biolink?->id,
                'user_id' => auth()->id(),
                'widget_type' => $type,
                'config_keys' => array_values(array_keys($config)),
                'item_count' => is_array($items) ? count($items) : null,
                'validation_fields' => array_values(array_keys($errors)),
            ]);

            throw ValidationException::withMessages($errors);
        }

        if ($type === 'linkedProduct' && ($config['source'] ?? null) === 'catalog') {
            $ids = collect($config['productIds'] ?? [])->map(fn ($id) => (int) $id)->filter()->unique();
            if (!$biolink || ($ids->isNotEmpty() && $biolink->products()->whereIn('id', $ids)->count() !== $ids->count())) {
                throw ValidationException::withMessages([
                    'config.productIds' => 'All selected products must belong to this biolink.',
                ]);
            }
        }

        if (array_key_exists('config', $data) || $requireConfig) {
            $data['config'] = $validator->normalizeConfig($type, $config);
        }

        return $validator->normalizeItems($type, $items);
    }

    private function inlineWidgetData(array $data): array
    {
        $inlineData = Arr::only($data, [
            'type',
            'active',
            'pinned',
            'position',
            'config',
            'activates_at',
            'expires_at',
        ]);

        if (
            array_key_exists('utm', $data) ||
            array_key_exists('utm_custom', $data)
        ) {
            $utm = $data['utm'] ?? [];
            foreach ($data['utm_custom'] ?? [] as $custom) {
                if (($custom['key'] ?? null) && ($custom['value'] ?? null)) {
                    $utm[$custom['key']] = $custom['value'];
                }
            }

            $inlineData['utm'] = Arr::query($utm);
        }

        if (
            array_key_exists('password', $data) &&
            $data['password'] !== Link::PLACEHOLDER_PASSWORD
        ) {
            $inlineData['password'] = $data['password'];
        }

        return $inlineData;
    }

    private function syncAdvancedData(BiolinkWidget $widget, array $data): void
    {
        if (array_key_exists('rules', $data)) {
            $widget->rules()->delete();

            $rules = collect($data['rules'] ?? [])
                ->filter(
                    fn($rule) => ($rule['key'] ?? null) !== null &&
                        ($rule['value'] ?? null) !== null,
                )
                ->values()
                ->all();

            if ($rules) {
                $widget->rules()->createMany($rules);
            }
        }

        if (array_key_exists('pixels', $data)) {
            $pixels = collect($data['pixels'] ?? [])
                ->map(fn($pixel) => is_scalar($pixel) ? $pixel : $pixel['id'])
                ->filter()
                ->values();

            $widget->pixels()->sync($pixels);
        }
    }

    private function syncItems(BiolinkWidget $widget, array|null $items): void
    {
        if ($items === null) {
            return;
        }

        $widget->items()->delete();

        foreach ($items as $item) {
            $widget->items()->create([
                ...$item,
                'biolink_id' => $widget->biolink_id,
            ]);
        }
    }
}
