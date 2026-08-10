<?php

namespace App\Biolinks\Jobs;

use App\Biolinks\Controllers\BiolinkWidgetSubmissionsController;
use App\Biolinks\Models\BiolinkWidgetSubmission;
use Common\Csv\BaseCsvExportJob;
use Illuminate\Bus\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class ExportBiolinkWidgetSubmissionsCsv extends BaseCsvExportJob
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected int $requesterId,
        protected int $biolinkId,
        protected array $payload = [],
    ) {}

    public function cacheName(): string
    {
        $type = Arr::get($this->payload, 'widget_type', 'all');
        $status = Arr::get($this->payload, 'status', 'all');
        return "biolink-submissions.$this->biolinkId.$type.$status";
    }

    protected function notificationName(): string
    {
        return 'biolink submissions';
    }

    protected function generateLines()
    {
        $query = BiolinkWidgetSubmission::query()
            ->where('biolink_id', $this->biolinkId)
            ->with('widget');

        $query = (new BiolinkWidgetSubmissionsController())->applyFilters(
            $query,
            $this->payload,
        );

        $query->chunkById(100, function (Collection $chunk) {
            $chunk->each(function (BiolinkWidgetSubmission $submission) {
                $this->writeLineToCsv([
                    'created_at' => $submission->created_at?->toDateTimeString(),
                    'status' => $submission->status,
                    'widget_type' => $submission->widget_type,
                    'widget_label' => $submission->widget?->config['title'] ?? '',
                    'name' => $submission->name,
                    'email' => $submission->email,
                    'phone' => $submission->phone,
                    'message' => $submission->message,
                    'payload' => json_encode($submission->payload),
                    'consent_at' => $submission->consent_at?->toDateTimeString(),
                ]);
            });
        });
    }
}
