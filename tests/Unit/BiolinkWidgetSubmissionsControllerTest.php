<?php

namespace Tests\Unit;

use App\Biolinks\Controllers\BiolinkWidgetSubmissionsController;
use App\Biolinks\Models\Biolink;
use App\Biolinks\Models\BiolinkWidget;
use App\Biolinks\Models\BiolinkWidgetItem;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use ReflectionMethod;
use Tests\TestCase;

class BiolinkWidgetSubmissionsControllerTest extends TestCase
{
    public function test_filters_accept_builder_from_biolink_submission_relation(): void
    {
        $biolink = new Biolink(['id' => 123]);
        $biolink->exists = true;

        $query = $biolink
            ->widgetSubmissions()
            ->getQuery()
            ->with('widget');

        $filtered = (new BiolinkWidgetSubmissionsController())->applyFilters(
            $query,
            [
                'query' => 'ana',
                'widget_type' => 'contactForm',
                'status' => 'new',
            ],
        );

        $this->assertInstanceOf(Builder::class, $filtered);
        $this->assertStringContainsString('biolink_id', $filtered->toSql());
    }

    public function test_public_sms_signup_submission_validation_accepts_phone(): void
    {
        $data = $this->validatePublicSubmission(
            new BiolinkWidget([
                'type' => 'smsSignup',
                'config' => [
                    'campaign' => 'launch',
                ],
            ]),
            Request::create('/', 'POST', [
                'name' => 'Ana',
                'phone' => '+55 11 99999-9999',
                'consent' => true,
            ]),
        );

        $this->assertSame('Ana', $data['name']);
        $this->assertSame('+55 11 99999-9999', $data['phone']);
    }

    public function test_public_poll_submission_validation_rejects_unknown_option(): void
    {
        $widget = new BiolinkWidget([
            'type' => 'poll',
            'config' => [],
        ]);
        $widget->setRelation('items', new Collection([
            new BiolinkWidgetItem(['title' => 'Option A', 'active' => true]),
            new BiolinkWidgetItem(['title' => 'Option B', 'active' => true]),
        ]));

        $this->expectException(ValidationException::class);

        $this->validatePublicSubmission(
            $widget,
            Request::create('/', 'POST', [
                'consent' => true,
                'payload' => ['option' => 'Option C'],
            ]),
        );
    }

    private function validatePublicSubmission(
        BiolinkWidget $widget,
        Request $request,
    ): array {
        $method = new ReflectionMethod(
            BiolinkWidgetSubmissionsController::class,
            'validatePublicSubmission',
        );
        $method->setAccessible(true);

        return $method->invoke(
            new BiolinkWidgetSubmissionsController(),
            $widget,
            $request,
        );
    }
}
