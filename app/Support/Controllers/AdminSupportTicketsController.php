<?php

namespace App\Support\Controllers;

use App\Hosting\Support\AuthorizesHostingAdmin;
use App\Support\Enums\SupportTicketStatus;
use App\Support\Models\SupportTicketAttachment;
use App\Support\Models\SupportTicket;
use App\Support\Resources\SupportTicketResource;
use App\Support\SupportTicketAttachments;
use App\Support\SupportTicketNotificationDispatcher;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminSupportTicketsController
{
    use AuthorizesHostingAdmin;

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorizeHostingAdmin($request, 'support.manage');
        return SupportTicketResource::collection(
            SupportTicket::query()->with(['user', 'messages.attachments'])->latest('last_message_at')->paginate(30),
        );
    }

    public function show(Request $request, int $ticket): SupportTicketResource
    {
        $this->authorizeHostingAdmin($request, 'support.manage');
        return new SupportTicketResource(SupportTicket::with(['user', 'messages.attachments'])->findOrFail($ticket));
    }

    public function reply(Request $request, int $ticket): SupportTicketResource
    {
        $this->authorizeHostingAdmin($request, 'support.manage');
        $data = $request->validate([
            'message' => ['required', 'string', 'min:2', 'max:10000'],
            'internal' => ['nullable', 'boolean'],
            ...SupportTicketAttachments::validationRules(),
        ]);
        $model = SupportTicket::findOrFail($ticket);
        abort_if($model->status === SupportTicketStatus::Closed, 409, 'This ticket is closed.');
        $internal = (bool) ($data['internal'] ?? false);
        $message = trim(strip_tags($data['message']));
        if (mb_strlen($message) < 2) {
            throw ValidationException::withMessages(['message' => 'Enter a meaningful plain-text message.']);
        }
        $ticketMessage = $model->messages()->create([
            'user_id' => $request->user()->id,
            'author_type' => 'support',
            'body' => $message,
            'is_internal' => $internal,
        ]);
        app(SupportTicketAttachments::class)->store($request, $ticketMessage);
        $model->update([
            'status' => $internal ? $model->status : SupportTicketStatus::PendingCustomer,
            'last_message_at' => now(),
        ]);
        if (!$internal) {
            app(SupportTicketNotificationDispatcher::class)->supportReplied($model);
        }
        return new SupportTicketResource($model->load(['user', 'messages.attachments']));
    }

    public function update(Request $request, int $ticket): SupportTicketResource
    {
        $this->authorizeHostingAdmin($request, 'support.manage');
        $data = $request->validate([
            'status' => ['sometimes', Rule::enum(SupportTicketStatus::class)],
            'priority' => ['sometimes', Rule::in(['low', 'normal', 'high', 'urgent'])],
            'type' => ['sometimes', Rule::in(['ticket', 'bug', 'feature'])],
            'department' => ['sometimes', Rule::in(['technical', 'general', 'billing'])],
        ]);
        $model = SupportTicket::findOrFail($ticket);
        $previousStatus = $model->status;
        if (($data['status'] ?? null) === SupportTicketStatus::Closed->value) {
            $data['closed_at'] = now();
        }
        $model->update($data);
        app(SupportTicketNotificationDispatcher::class)->statusChanged($model, $previousStatus);
        return new SupportTicketResource($model->load(['user', 'messages.attachments']));
    }

    public function downloadAttachment(Request $request, int $ticket, int $attachment)
    {
        $this->authorizeHostingAdmin($request, 'support.manage');
        $model = SupportTicket::query()->findOrFail($ticket);
        $attachmentModel = SupportTicketAttachment::query()
            ->whereKey($attachment)
            ->whereHas('message', fn($query) => $query->where('support_ticket_id', $model->id))
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
}
