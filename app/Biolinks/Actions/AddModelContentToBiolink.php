<?php

namespace App\Biolinks\Actions;

use App\Biolinks\Models\Biolink;
use App\Biolinks\Models\BiolinkTheme;
use App\Biolinks\Support\BiolinkAppearanceConfig;
use App\Biolinks\Support\BiolinkContentBlueprint;
use App\Biolinks\Support\BiolinkModelPlanGuard;
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;

class AddModelContentToBiolink
{
    public function execute(Biolink $biolink, BiolinkTheme $theme): void
    {
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
                'model_id' => __('The selected model does not contain a content blueprint.'),
            ]);
        }

        $blueprintService = app(BiolinkContentBlueprint::class);
        $errors = $blueprintService->validate($blueprint);
        if ($errors !== []) {
            throw ValidationException::withMessages([
                'model_id' => __('The selected model has an invalid content blueprint.'),
            ]);
        }

        $blueprint = $blueprintService->normalize($blueprint);
        $widgetIdsByKey = [];

        foreach (Arr::get($blueprint, 'widgets', []) as $widgetDefinition) {
            $widget = $biolink->widgets()->create([
                'type' => $widgetDefinition['type'],
                'position' => $widgetDefinition['position'],
                'pinned' => $widgetDefinition['pinned'] ?? null,
                'active' => $widgetDefinition['active'] ?? false,
                'config' => $widgetDefinition['config'],
            ]);

            $widgetIdsByKey[$widgetDefinition['key']] = $widget->id;

            foreach ($widgetDefinition['items'] ?? [] as $item) {
                $widget->items()->create([
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

        $appearance = is_array($theme->config) ? $theme->config : [];
        Arr::set($appearance, 'theme', [
            'slug' => $theme->slug,
            'category' => $theme->category,
            'locked' => false,
            'modified' => false,
        ]);

        $navigationIds = collect(
            Arr::get($blueprint, 'header.navigationWidgetKeys', []),
        )
            ->map(fn(string $key) => $widgetIdsByKey[$key] ?? null)
            ->filter()
            ->values()
            ->all();
        if ($navigationIds !== []) {
            Arr::set(
                $appearance,
                'headerConfig.navigationWidgetIds',
                $navigationIds,
            );
            Arr::set($appearance, 'headerConfig.showNavigation', true);
        }

        $footerLinks = collect(Arr::get($blueprint, 'footer.links', []))
            ->map(function (array $link) use ($widgetIdsByKey) {
                if (($link['source'] ?? 'widget') === 'widget') {
                    $widgetId = $widgetIdsByKey[$link['widgetKey'] ?? ''] ?? null;
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
        if ($footerLinks !== []) {
            Arr::set($appearance, 'footerConfig.links', $footerLinks);
        }

        $biolink->appearance()->create([
            'config' => app(BiolinkAppearanceConfig::class)->normalize(
                $appearance,
            ),
        ]);
    }
}
