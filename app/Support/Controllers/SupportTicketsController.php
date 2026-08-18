<?php

namespace App\Support\Controllers;

use App\Hosting\Models\HostingAccount;
use App\Hosting\Support\ResolvesPersonalWorkspace;
use App\Support\Enums\SupportTicketStatus;
use App\Support\Models\SupportTicketAttachment;
use App\Support\Models\SupportTicket;
use App\Support\Resources\SupportTicketResource;
use App\Support\SupportTicketAttachments;
use App\Support\SupportTicketNotificationDispatcher;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SupportTicketsController
{
    use ResolvesPersonalWorkspace;

    public function index(Request $request): AnonymousResourceCollection
    {
        return SupportTicketResource::collection(
            SupportTicket::query()
                ->where('user_id', $request->user()->id)
                ->latest('last_message_at')
                ->paginate(20),
        );
    }

    public function store(Request $request): SupportTicketResource
    {
        $data = $request->validate([
            'subject' => ['required', 'string', 'min:4', 'max:180'],
            'message' => ['required', 'string', 'min:10', 'max:10000'],
            'hosting_account_id' => ['nullable', 'integer'],
            'type' => ['nullable', Rule::in(['ticket', 'bug', 'feature'])],
            'department' => ['nullable', Rule::in(['technical', 'general', 'billing'])],
            'priority' => ['nullable', Rule::in(['low', 'normal', 'high', 'urgent'])],
            ...SupportTicketAttachments::validationRules(),
        ]);
        $user = $request->user();
        $workspace = $this->personalWorkspace($user);

        if (isset($data['hosting_account_id'])) {
            HostingAccount::query()
                ->whereKey($data['hosting_account_id'])
                ->where('user_id', $user->id)
                ->where('workspace_id', $workspace->id)
                ->firstOrFail();
        }

        $subject = $this->plainText($data['subject']);
        $message = $this->plainText($data['message']);
        if (mb_strlen($subject) < 4 || mb_strlen($message) < 10) {
            throw ValidationException::withMessages(['message' => 'Enter a meaningful plain-text message.']);
        }

        $ticket = DB::transaction(function () use ($data, $request, $user, $workspace, $subject, $message): SupportTicket {
            $ticket = SupportTicket::create([
                'uuid' => (string) Str::uuid7(),
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'hosting_account_id' => $data['hosting_account_id'] ?? null,
                'subject' => $subject,
                'type' => $data['type'] ?? 'ticket',
                'department' => $data['department'] ?? 'technical',
                'status' => SupportTicketStatus::Open,
                'priority' => $data['priority'] ?? 'normal',
                'last_message_at' => now(),
            ]);
            $ticketMessage = $ticket->messages()->create([
                'user_id' => $user->id,
                'author_type' => 'customer',
                'body' => $message,
                'is_internal' => false,
            ]);
            app(SupportTicketAttachments::class)->store($request, $ticketMessage);
            return $ticket;
        });

        app(SupportTicketNotificationDispatcher::class)->ticketCreated($ticket);

        return new SupportTicketResource($ticket->load('messages.attachments'));
    }

    public function show(Request $request, int $ticket): SupportTicketResource
    {
        return new SupportTicketResource($this->ownedTicket($request, $ticket)->load('messages.attachments'));
    }

    public function reply(Request $request, int $ticket): SupportTicketResource
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'min:2', 'max:10000'],
            ...SupportTicketAttachments::validationRules(),
        ]);
        $model = $this->ownedTicket($request, $ticket);
        abort_if($model->status === SupportTicketStatus::Closed, 409, 'This ticket is closed.');
        $message = $this->plainText($data['message']);
        if (mb_strlen($message) < 2) {
            throw ValidationException::withMessages(['message' => 'Enter a meaningful plain-text message.']);
        }
        $ticketMessage = $model->messages()->create([
            'user_id' => $request->user()->id,
            'author_type' => 'customer',
            'body' => $message,
            'is_internal' => false,
        ]);
        app(SupportTicketAttachments::class)->store($request, $ticketMessage);
        $model->update([
            'status' => SupportTicketStatus::PendingSupport,
            'last_message_at' => now(),
        ]);
        app(SupportTicketNotificationDispatcher::class)->customerReplied($model);
        return new SupportTicketResource($model->load('messages.attachments'));
    }

    public function close(Request $request, int $ticket): SupportTicketResource
    {
        $model = $this->ownedTicket($request, $ticket);
        $previousStatus = $model->status;
        $model->update(['status' => SupportTicketStatus::Closed, 'closed_at' => now()]);
        app(SupportTicketNotificationDispatcher::class)->statusChanged($model, $previousStatus);
        return new SupportTicketResource($model->load('messages.attachments'));
    }

    public function downloadAttachment(Request $request, int $ticket, int $attachment)
    {
        $model = $this->ownedTicket($request, $ticket);
        $attachmentModel = SupportTicketAttachment::query()
            ->whereKey($attachment)
            ->whereHas('message', fn($query) => $query
                ->where('support_ticket_id', $model->id)
                ->where('is_internal', false))
            ->firstOrFail();

        abort_unless(Storage::disk($attachmentModel->disk)->exists($attachmentModel->path), 404);

        return Storage::disk($attachmentModel->disk)->download(
            $attachmentModel->path,
            $attachmentModel->file_name,
            app(SupportTicketAttachments::class)->downloadHeaders(
                $attachmentModel->file_name,
                $attachmentModel->mime_type,
            ),
        );
    }

    private function ownedTicket(Request $request, int $id): SupportTicket
    {
        return SupportTicket::query()->whereKey($id)->where('user_id', $request->user()->id)->firstOrFail();
    }

    private function plainText(string $value): string
    {
        return trim(strip_tags($value));
    }
}
