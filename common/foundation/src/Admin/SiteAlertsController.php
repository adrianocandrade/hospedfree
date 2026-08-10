<?php

namespace Common\Admin;

use Common\Logging\Schedule\ScheduleLogItem;
use Common\API\ExcludeRoutesFromPublicDocs;
use Illuminate\Routing\Controller;

/**
 * @tags System
 */
#[ExcludeRoutesFromPublicDocs]
class SiteAlertsController extends Controller
{
    public function __construct()
    {
        $this->middleware('isAdmin');
    }

    /**
     * Get site alerts.
     *
     * @operationId getSiteAlerts
     *
     * @response array{alerts: list<array{id: string, title: string, severity: string, description: string}>}
     */
    public function index()
    {
        $alerts = [];

        if (!config('app.demo')) {
            if (!ScheduleLogItem::scheduleRanInLast30Minutes()) {
                $alerts[] = [
                    'id' => 'cronNotSetup',
                    'title' => 'There is an issue with CRON schedule',
                    'severity' => 'error',
                    'description' =>
                        'The CRON schedule has not run in the last 30 minutes. Review docs/audits/final-refactoring-report.md for the validation checklist.',
                ];
            }
        }

        return response()->json([
            'alerts' => $alerts,
        ]);
    }
}
