<?php

namespace Common\Logging\Mail;

use App\Models\User;
use App\Security\AdministrativeSecurityEventRecorder;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

/**
 * @tags Logs, Admin
 */
class OutgoingEmailLogController extends Controller
{
    public function __construct(
        private readonly AdministrativeSecurityEventRecorder $auditRecorder,
    ) {}

    /**
     * List email log items.
     *
     * @operationId listOutgoingEmailLogItems
     */
    public function index(Request $request)
    {
        $this->authorize($request, 'email_logs.view');

        $data = $request->validate([
            'sort' => 'string',
            'page' => 'integer',
            'per_page' => 'integer',
            'query' => 'string|nullable',
            'status' => 'string|nullable',
            'created_at' => 'date_range|nullable',
        ]);

        $sort = explode(':', $data['sort'] ?? '');

        $pagination = OutgoingEmailLogItem::query()
            ->orderBy(Arr::get($sort, 0) ?: 'id', Arr::get($sort, 1) ?: 'desc')
            ->when(
                Arr::get($data, 'query'),
                fn($q) => $q->mysqlSearch($data['query']),
            )
            ->when(
                Arr::get($data, 'status'),
                fn($q) => $q->where('status', $data['status']),
            )
            ->when(
                Arr::get($data, 'created_at'),
                fn($q) => $q->whereBetween('created_at', $data['created_at']),
            )
            ->simplePaginate($data['per_page'] ?? 15);

        return OutgoingEmailLogItemResource::collection($pagination);
    }

    /**
     * Retrieve email log item.
     *
     * @operationId retrieveOutgoingEmailLogItem
     */
    public function show(Request $request, int $id)
    {
        $user = $this->authorize($request, 'email_logs.view_content');
        $logItem = OutgoingEmailLogItem::query()->findOrFail($id);

        $this->auditRecorder->record(
            $user,
            'outgoing_email.content_viewed',
            OutgoingEmailLogItem::MODEL_TYPE,
            $logItem->id,
            $request,
        );

        return new OutgoingEmailLogItemResource(
            $logItem,
            includesPreset: 'show',
        );
    }

    /**
     * Download the email log.
     *
     * @operationId downloadEmailLog
     */
    public function downloadLog(Request $request)
    {
        $user = $this->authorize($request, 'email_logs.download');
        $log = json_encode(
            OutgoingEmailLogItem::limit(1000)->get(),
            JSON_PRETTY_PRINT,
        );

        $this->auditRecorder->record(
            $user,
            'outgoing_email.log_exported',
            OutgoingEmailLogItem::MODEL_TYPE,
            null,
            $request,
        );

        return response($log)
            ->header('Content-Type', 'application/json')
            ->header(
                'Content-Disposition',
                'attachment; filename="outgoing-email-log.json"',
            );
    }

    /**
     * Download an email log item.
     *
     * @operationId downloadEmailLogItem
     */
    public function downloadLogItem(Request $request, int $id)
    {
        $user = $this->authorize($request, 'email_logs.download');
        $logItem = OutgoingEmailLogItem::findOrFail($id);

        $this->auditRecorder->record(
            $user,
            'outgoing_email.item_downloaded',
            OutgoingEmailLogItem::MODEL_TYPE,
            $logItem->id,
            $request,
        );

        $fileName = Str::slug((string) $logItem->subject) ?: 'email';
        $fileName = Str::limit($fileName, 80, '') . "-{$logItem->id}.eml";

        return response($logItem->mime)
            ->header('Cache-Control', 'no-store, private')
            ->header('Content-Type', 'message/rfc822')
            ->header(
                'Content-Disposition',
                "attachment; filename=\"{$fileName}\"",
            );
    }

    private function authorize(Request $request, string $permission): User
    {
        /** @var User|null $user */
        $user = $request->user();
        abort_unless(
            $user &&
                $user->hasPermission('admin.access') &&
                $user->hasPermission($permission),
            403,
        );

        return $user;
    }
}
