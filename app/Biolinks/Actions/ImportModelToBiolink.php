<?php

namespace App\Biolinks\Actions;

use App\Biolinks\Models\Biolink;
use App\Biolinks\Models\BiolinkTheme;
use App\Biolinks\Support\BiolinkAppearanceConfig;
use App\Biolinks\Support\BiolinkContentBlueprint;
use App\Biolinks\Support\BiolinkModelPlanGuard;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ImportModelToBiolink
{
    /**
     * @return array{biolink: Biolink, importedWidgetsCount: int}
     */
    public function execute(Biolink $biolink, BiolinkTheme $theme): array
    {
        $blueprint = $this->validatedBlueprint($biolink, $theme);

        return DB::transaction(function () use ($biolink, $theme, $blueprint) {
            $widgets = $biolink->widgets()->orderBy('position')->get();
            $widgetIdsByKey = [];

            foreach ($widgets as $widget) {
                $key = Arr::get($widget->config, 'blueprintKey');
                if (is_string($key) && $key !== '') {
                    $widgetIdsByKey[$key] = [
                        'id' => $widget->id,
                        'type' => $widget->type,
                    ];
                }
            }

            $lastPosition = max(
                (int) ($biolink->widgets()->max('position') ?? -1),
                (int) (DB::table('biolink_link')
                    ->where('biolink_id', $biolink->id)
                    ->max('position') ?? -1),
            );
            $importedWidgetsCount = 0;

            foreach (Arr::get($blueprint, 'widgets', []) as $definition) {
                $key = $definition['key'];
                $existing = $widgetIdsByKey[$key] ?? null;

                if ($existing) {
                    if ($existing['type'] !== $definition['type']) {
                        throw ValidationException::withMessages([
                            'model_id' => __(
                                'A block from this model conflicts with existing page content.',
                            ),
                        ]);
                    }

                    continue;
                }

                $widget = $biolink->widgets()->create([
                    'type' => $definition['type'],
                    'position' => ++$lastPosition,
                    'pinned' => $definition['pinned'] ?? null,
                    'active' => false,
                    'config' => $definition['config'],
                ]);

                $widgetIdsByKey[$key] = [
                    'id' => $widget->id,
                    'type' => $widget->type,
                ];
                $importedWidgetsCount++;

                foreach ($definition['items'] ?? [] as $item) {
                    $widget
                        ->items()
                        ->create([
                            ...Arr::only($item, [
                                'type',
                                'active',
                                'sort_order',
                                'title',
                                'description',
                                'url',
                                'image',
                                'price',
                                'currency',
                                'payload',
                            ]),
                            'biolink_id' => $biolink->id,
                        ]);
                }
            }

            $appearance = $this->mergeAppearance(
                current: $biolink->appearance?->config ?? [],
                theme: $theme,
                blueprint: $blueprint,
                widgetIdsByKey: collect($widgetIdsByKey)
                    ->map(fn(array $widget) => $widget['id'])
                    ->all(),
            );

            $biolink->appearance()->updateOrCreate(
                [],
                [
                    'config' => app(BiolinkAppearanceConfig::class)->normalize(
                        $appearance,
                    ),
                ],
            );
            $biolink->touch();

            return [
                'biolink' => $biolink->fresh()->loadContent(),
                'importedWidgetsCount' => $importedWidgetsCount,
            ];
        });
    }

    private function validatedBlueprint(
        Biolink $biolink,
        BiolinkTheme $theme,
    ): array {
        if (!$theme->is_published || !($theme->metadata['isModel'] ?? false)) {
            throw ValidationException::withMessages([
                'model_id' => __('The selected model is unavailable.'),
            ]);
        }

        $planErrors = app(BiolinkModelPlanGuard::class)->validate(
            $biolink->user,
            $theme,
        );
        if ($planErrors !== []) {
            throw ValidationException::withMessages($planErrors);
        }

        $blueprint = Arr::get($theme->metadata, 'contentBlueprint');
        if (!is_array($blueprint)) {
            throw ValidationException::withMessages([
                'model_id' => __(
                    'The selected model does not contain a content blueprint.',
                ),
            ]);
        }

        $blueprintService = app(BiolinkContentBlueprint::class);
        if ($blueprintService->validate($blueprint) !== []) {
            throw ValidationException::withMessages([
                'model_id' => __(
                    'The selected model has an invalid content blueprint.',
                ),
            ]);
        }

        return $blueprintService->normalize($blueprint);
    }

    /**
     * @param array<string, mixed> $current
     * @param array<string, mixed> $blueprint
     * @param array<string, int> $widgetIdsByKey
     * @return array<string, mixed>
     */
    private function mergeAppearance(
        array $current,
        BiolinkTheme $theme,
        array $blueprint,
        array $widgetIdsByKey,
    ): array {
        $next = is_array($theme->config) ? $theme->config : [];
        $appearance = array_replace_recursive($current, $next);

        Arr::set($appearance, 'theme', [
            'slug' => $theme->slug,
            'category' => $theme->category,
            'locked' => $theme->category === 'curated',
            'modified' => false,
        ]);

        foreach (['title', 'bio', 'image', 'logo', 'titleStyle'] as $key) {
            if (array_key_exists($key, $current['headerConfig'] ?? [])) {
                Arr::set(
                    $appearance,
                    "headerConfig.$key",
                    Arr::get($current, "headerConfig.$key"),
                );
            }
        }

        if (array_key_exists('links', $current['socialConfig'] ?? [])) {
            Arr::set(
                $appearance,
                'socialConfig.links',
                Arr::get($current, 'socialConfig.links', []),
            );
        }

        $navigationIds = collect(
            Arr::get($blueprint, 'header.navigationWidgetKeys', []),
        )
            ->map(fn(string $key) => $widgetIdsByKey[$key] ?? null)
            ->filter()
            ->values()
            ->all();
        Arr::set(
            $appearance,
            'headerConfig.navigationWidgetIds',
            $navigationIds,
        );
        Arr::set(
            $appearance,
            'headerConfig.showNavigation',
            $navigationIds !== [],
        );

        $footerLinks = collect(Arr::get($blueprint, 'footer.links', []))
            ->map(function (array $link) use ($widgetIdsByKey) {
                if (($link['source'] ?? 'widget') === 'widget') {
                    $widgetId =
                        $widgetIdsByKey[$link['widgetKey'] ?? ''] ?? null;
                    if (!$widgetId) {
                        return null;
                    }
                    $link['widgetId'] = $widgetId;
                }

                unset($link['widgetKey']);

                return $link;
            })
            ->filter()
            ->values()
            ->all();
        Arr::set($appearance, 'footerConfig.links', $footerLinks);

        return $appearance;
    }
}
