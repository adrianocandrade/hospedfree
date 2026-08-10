<?php

namespace App\Biolinks\Support;

use App\Biolinks\Models\BiolinkWidget;
use App\Biolinks\Models\BiolinkWidgetSubmission;
use Illuminate\Support\Collection;

class BiolinkPollResults
{
    /**
     * @param Collection<int, BiolinkWidget> $widgets
     * @param iterable<BiolinkWidgetSubmission> $submissions
     * @return array<int, array{
     *     widget_id: int,
     *     title: string,
     *     total_votes: int,
     *     options: array<int, array{label: string, votes: int, percentage: float}>
     * }>
     */
    public function summarize(Collection $widgets, iterable $submissions): array
    {
        $polls = $widgets
            ->mapWithKeys(function (BiolinkWidget $widget): array {
                $options = $widget->items
                    ->map(fn($item) => trim((string) $item->title))
                    ->filter()
                    ->unique()
                    ->values()
                    ->mapWithKeys(fn(string $label) => [$label => 0])
                    ->all();

                return [(int) $widget->id => [
                    'widget_id' => (int) $widget->id,
                    'title' => trim((string) ($widget->config['title'] ?? '')) ?: 'Poll',
                    'options' => $options,
                ]];
            })
            ->all();

        foreach ($submissions as $submission) {
            $widgetId = (int) $submission->widget_id;
            $option = trim((string) ($submission->payload['option'] ?? ''));
            if ($option === '' || !isset($polls[$widgetId])) {
                continue;
            }

            $polls[$widgetId]['options'][$option] =
                ($polls[$widgetId]['options'][$option] ?? 0) + 1;
        }

        return collect($polls)
            ->map(function (array $poll): array {
                $total = array_sum($poll['options']);
                $options = collect($poll['options'])
                    ->map(fn(int $votes, string $label) => [
                        'label' => $label,
                        'votes' => $votes,
                        'percentage' => $total > 0
                            ? round(($votes / $total) * 100, 1)
                            : 0.0,
                    ])
                    ->sortByDesc('votes')
                    ->values()
                    ->all();

                return [
                    'widget_id' => $poll['widget_id'],
                    'title' => $poll['title'],
                    'total_votes' => $total,
                    'options' => $options,
                ];
            })
            ->values()
            ->all();
    }
}
