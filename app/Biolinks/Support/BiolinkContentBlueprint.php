<?php

namespace App\Biolinks\Support;

use Illuminate\Support\Arr;

class BiolinkContentBlueprint
{
    private const MAX_WIDGETS = 40;
    private const MAX_CHECKLIST_ITEMS = 40;
    private const MAX_FOOTER_LINKS = 12;

    public function __construct(
        private readonly BiolinkWidgetConfig $widgetConfig,
    ) {
    }

    /**
     * @return array<string, string>
     */
    public function validate(array $blueprint): array
    {
        $errors = [];

        if (Arr::get($blueprint, 'version') !== 1) {
            $errors['metadata.contentBlueprint.version'] =
                'The content blueprint version must be 1.';
        }

        $widgets = Arr::get($blueprint, 'widgets');
        if (!is_array($widgets) || $widgets === []) {
            $errors['metadata.contentBlueprint.widgets'] =
                'A content blueprint must contain at least one widget.';

            return $errors;
        }

        if (count($widgets) > self::MAX_WIDGETS) {
            $errors['metadata.contentBlueprint.widgets'] =
                'A content blueprint may contain at most '.self::MAX_WIDGETS.' widgets.';
        }

        $keys = [];
        foreach ($widgets as $index => $widget) {
            $path = "metadata.contentBlueprint.widgets.$index";
            if (!is_array($widget)) {
                $errors[$path] = 'Each blueprint widget must be an object.';
                continue;
            }

            $unknown = array_diff(
                array_keys($widget),
                ['key', 'type', 'position', 'pinned', 'active', 'config', 'items'],
            );
            if ($unknown !== []) {
                $errors[$path] = 'The blueprint widget contains unsupported properties.';
            }

            $key = Arr::get($widget, 'key');
            if (
                !is_string($key) ||
                !preg_match('/^[a-z][a-z0-9-]{1,63}$/', $key)
            ) {
                $errors["$path.key"] =
                    'Widget keys must use lowercase letters, numbers and hyphens.';
            } elseif (isset($keys[$key])) {
                $errors["$path.key"] = 'Widget keys must be unique.';
            } else {
                $keys[$key] = true;
            }

            $type = Arr::get($widget, 'type');
            if (!is_string($type) || !in_array($type, BiolinkWidgetConfig::TYPES, true)) {
                $errors["$path.type"] = 'The selected widget type is invalid.';
                continue;
            }

            if (
                array_key_exists('position', $widget) &&
                (!is_int($widget['position']) || $widget['position'] < 0)
            ) {
                $errors["$path.position"] = 'Widget position must be a positive integer.';
            }

            if (
                array_key_exists('pinned', $widget) &&
                !in_array($widget['pinned'], [null, 'top', 'bottom'], true)
            ) {
                $errors["$path.pinned"] = 'The selected widget pin position is invalid.';
            }

            if (
                array_key_exists('active', $widget) &&
                !is_bool($widget['active'])
            ) {
                $errors["$path.active"] = 'Widget active state must be true or false.';
            }

            $config = Arr::get($widget, 'config', []);
            $items = Arr::get($widget, 'items');
            if (!is_array($config)) {
                $errors["$path.config"] = 'Widget config must be an object.';
                continue;
            }
            if ($items !== null && !is_array($items)) {
                $errors["$path.items"] = 'Widget items must be an array.';
                continue;
            }

            foreach ($this->widgetConfig->validate($type, $config, $items) as $childPath => $message) {
                $errors["$path.$childPath"] = $message;
            }
        }

        $checklist = Arr::get($blueprint, 'checklist', []);
        if (!is_array($checklist)) {
            $errors['metadata.contentBlueprint.checklist'] =
                'The blueprint checklist must be an array.';
        } elseif (count($checklist) > self::MAX_CHECKLIST_ITEMS) {
            $errors['metadata.contentBlueprint.checklist'] =
                'The blueprint checklist is too large.';
        } else {
            foreach ($checklist as $index => $item) {
                $path = "metadata.contentBlueprint.checklist.$index";
                if (!is_array($item)) {
                    $errors[$path] = 'Each checklist item must be an object.';
                    continue;
                }
                $widgetKey = Arr::get($item, 'widgetKey');
                if (!is_string($widgetKey) || !isset($keys[$widgetKey])) {
                    $errors["$path.widgetKey"] =
                        'Checklist items must reference an existing widget key.';
                }
                $label = Arr::get($item, 'label');
                if (!is_string($label) || trim($label) === '' || mb_strlen($label) > 120) {
                    $errors["$path.label"] =
                        'Checklist labels are required and may not exceed 120 characters.';
                }
            }
        }

        $navigationKeys = Arr::get(
            $blueprint,
            'header.navigationWidgetKeys',
            [],
        );
        if (!is_array($navigationKeys)) {
            $errors['metadata.contentBlueprint.header.navigationWidgetKeys'] =
                'Header navigation widget keys must be an array.';
        } else {
            foreach ($navigationKeys as $index => $widgetKey) {
                if (!is_string($widgetKey) || !isset($keys[$widgetKey])) {
                    $errors["metadata.contentBlueprint.header.navigationWidgetKeys.$index"] =
                        'Header navigation must reference an existing widget key.';
                }
            }
        }

        $footerLinks = Arr::get($blueprint, 'footer.links', []);
        if (!is_array($footerLinks)) {
            $errors['metadata.contentBlueprint.footer.links'] =
                'Footer links must be an array.';
        } elseif (count($footerLinks) > self::MAX_FOOTER_LINKS) {
            $errors['metadata.contentBlueprint.footer.links'] =
                'A blueprint footer may contain at most '.self::MAX_FOOTER_LINKS.' links.';
        } else {
            foreach ($footerLinks as $index => $link) {
                $path = "metadata.contentBlueprint.footer.links.$index";
                if (!is_array($link)) {
                    $errors[$path] = 'Each footer link must be an object.';
                    continue;
                }
                $source = Arr::get($link, 'source', 'widget');
                if (!in_array($source, ['widget', 'url'], true)) {
                    $errors["$path.source"] = 'The selected footer link source is invalid.';
                } elseif ($source === 'widget') {
                    $widgetKey = Arr::get($link, 'widgetKey');
                    if (!is_string($widgetKey) || !isset($keys[$widgetKey])) {
                        $errors["$path.widgetKey"] =
                            'Footer widget links must reference an existing widget key.';
                    }
                } elseif (!$this->isSafeUrl(Arr::get($link, 'url'))) {
                    $errors["$path.url"] = 'Footer URLs must use a safe public scheme.';
                }

                $label = Arr::get($link, 'label');
                if ($label !== null && (!is_string($label) || mb_strlen($label) > 80)) {
                    $errors["$path.label"] =
                        'Footer link labels may not exceed 80 characters.';
                }
            }
        }

        return $errors;
    }

    public function normalize(array $blueprint): array
    {
        $widgets = collect(Arr::get($blueprint, 'widgets', []))
            ->filter(fn(mixed $widget) => is_array($widget))
            ->values()
            ->map(function (array $widget, int $index) {
                $type = (string) Arr::get($widget, 'type');
                $key = trim((string) Arr::get($widget, 'key'));
                $config = is_array(Arr::get($widget, 'config'))
                    ? Arr::get($widget, 'config')
                    : [];
                $config['blueprintKey'] = $key;

                return array_filter([
                    'key' => $key,
                    'type' => $type,
                    'position' => max(0, (int) Arr::get($widget, 'position', $index)),
                    'pinned' => Arr::get($widget, 'pinned'),
                    'active' => (bool) Arr::get($widget, 'active', false),
                    'config' => $this->widgetConfig->normalizeConfig($type, $config),
                    'items' => $this->widgetConfig->normalizeItems(
                        $type,
                        Arr::get($widget, 'items'),
                    ),
                ], fn(mixed $value) => $value !== null);
            })
            ->all();

        $checklist = collect(Arr::get($blueprint, 'checklist', []))
            ->filter(fn(mixed $item) => is_array($item))
            ->map(fn(array $item) => [
                'widgetKey' => trim((string) Arr::get($item, 'widgetKey')),
                'label' => trim((string) Arr::get($item, 'label')),
            ])
            ->values()
            ->all();

        $navigationWidgetKeys = collect(
            Arr::get($blueprint, 'header.navigationWidgetKeys', []),
        )
            ->filter(fn(mixed $key) => is_string($key))
            ->map(fn(string $key) => trim($key))
            ->unique()
            ->values()
            ->all();

        $footerLinks = collect(Arr::get($blueprint, 'footer.links', []))
            ->filter(fn(mixed $link) => is_array($link))
            ->values()
            ->map(fn(array $link, int $index) => array_filter([
                'id' => trim((string) Arr::get($link, 'id', "blueprint-$index")),
                'label' => trim((string) Arr::get($link, 'label', '')),
                'source' => Arr::get($link, 'source', 'widget'),
                'widgetKey' => Arr::get($link, 'widgetKey'),
                'url' => Arr::get($link, 'url'),
                'variant' => Arr::get($link, 'variant', 'link'),
                'active' => (bool) Arr::get($link, 'active', true),
                'position' => max(0, (int) Arr::get($link, 'position', $index)),
            ], fn(mixed $value) => $value !== null && $value !== ''))
            ->all();

        return array_filter([
            'version' => 1,
            'widgets' => $widgets,
            'checklist' => $checklist,
            'header' => $navigationWidgetKeys === []
                ? null
                : ['navigationWidgetKeys' => $navigationWidgetKeys],
            'footer' => $footerLinks === [] ? null : ['links' => $footerLinks],
        ], fn(mixed $value) => $value !== null && $value !== []);
    }

    private function isSafeUrl(mixed $url): bool
    {
        if (!is_string($url) || trim($url) === '') {
            return false;
        }

        $scheme = strtolower((string) parse_url(trim($url), PHP_URL_SCHEME));

        return in_array($scheme, ['http', 'https', 'mailto', 'tel'], true);
    }
}
