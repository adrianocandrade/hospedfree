<?php

namespace App\Support\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SupportTicketResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'subject' => $this->subject,
            'type' => $this->type,
            'department' => $this->department,
            'status' => $this->status->value,
            'priority' => $this->priority,
            'customer' => $this->when(
                $request->user()?->hasPermission('support.manage') && $this->relationLoaded('user'),
                fn() => [
                    'id' => $this->user->id,
                    'display_name' => $this->user->display_name ?? $this->user->email,
                    'email' => $this->user->email,
                ],
            ),
            'hosting_account_id' => $this->hosting_account_id,
            'last_message_at' => $this->last_message_at,
            'closed_at' => $this->closed_at,
            'messages' => $this->whenLoaded('messages', fn() => $this->messages
                ->filter(fn($message) => !$message->is_internal || $request->user()?->hasPermission('support.manage'))
                ->map(fn($message) => [
                    'id' => $message->id,
                    'author_type' => $message->author_type,
                    'body' => $message->body,
                    'is_internal' => $message->is_internal,
                    'attachments' => $message->relationLoaded('attachments')
                        ? $message->attachments->map(fn($attachment) => [
                            'id' => $attachment->id,
                            'file_name' => $attachment->file_name,
                            'mime_type' => $attachment->mime_type,
                            'size' => $attachment->size,
                            'download_url' => $request->user()?->hasPermission('support.manage')
                                ? url("api/v1/admin/support/tickets/{$this->id}/attachments/{$attachment->id}")
                                : url("api/v1/support/tickets/{$this->id}/attachments/{$attachment->id}"),
                        ])->values()
                        : [],
                    'created_at' => $message->created_at,
                ])->values()),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
