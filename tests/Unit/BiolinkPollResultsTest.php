<?php

namespace Tests\Unit;

use App\Biolinks\Models\BiolinkWidget;
use App\Biolinks\Models\BiolinkWidgetItem;
use App\Biolinks\Models\BiolinkWidgetSubmission;
use App\Biolinks\Support\BiolinkPollResults;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;

class BiolinkPollResultsTest extends TestCase
{
    public function test_it_builds_complete_percentages_and_keeps_zero_vote_options(): void
    {
        $widget = new BiolinkWidget([
            'id' => 12,
            'type' => 'poll',
            'position' => 3,
            'config' => ['title' => 'Próximo tema?'],
        ]);
        $widget->setRelation('items', new Collection([
            new BiolinkWidgetItem(['title' => 'Games', 'active' => true]),
            new BiolinkWidgetItem(['title' => 'Anime', 'active' => true]),
            new BiolinkWidgetItem(['title' => 'Motos', 'active' => true]),
        ]));

        $submissions = new Collection([
            new BiolinkWidgetSubmission([
                'widget_id' => 12,
                'payload' => ['option' => 'Anime'],
            ]),
            new BiolinkWidgetSubmission([
                'widget_id' => 12,
                'payload' => ['option' => 'Anime'],
            ]),
            new BiolinkWidgetSubmission([
                'widget_id' => 12,
                'payload' => ['option' => 'Games'],
            ]),
        ]);

        $result = (new BiolinkPollResults())->summarize(
            new Collection([$widget]),
            $submissions,
        );

        $this->assertSame(12, $result[0]['widget_id']);
        $this->assertSame('Próximo tema?', $result[0]['title']);
        $this->assertSame(3, $result[0]['total_votes']);
        $this->assertSame([
            ['label' => 'Anime', 'votes' => 2, 'percentage' => 66.7],
            ['label' => 'Games', 'votes' => 1, 'percentage' => 33.3],
            ['label' => 'Motos', 'votes' => 0, 'percentage' => 0.0],
        ], $result[0]['options']);
        $this->assertArrayNotHasKey('submissions', $result[0]);
        $this->assertArrayNotHasKey('respondents', $result[0]);
    }
}
