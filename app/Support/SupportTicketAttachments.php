<?php

namespace App\Support;

use App\Support\Models\SupportTicketMessage;
use Illuminate\Http\Request;

class SupportTicketAttachments
{
    public const MAX_FILES = 5;
    public const MAX_FILE_KB = 5120;

    public static function validationRules(): array
    {
        return [
            'attachments' => ['sometimes', 'array', 'max:' . self::MAX_FILES],
            'attachments.*' => [
                'file',
                'max:' . self::MAX_FILE_KB,
                'mimetypes:image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,text/csv,application/zip,application/x-zip-compressed',
            ],
        ];
    }

    public function store(Request $request, SupportTicketMessage $message): void
    {
        $files = $request->file('attachments', []);
        if (!$files) {
            return;
        }

        foreach ($files as $file) {
            $path = $file->store(
                "support-ticket-attachments/{$message->support_ticket_id}/{$message->id}",
                'local',
            );

            $message->attachments()->create([
                'user_id' => $request->user()?->id,
                'disk' => 'local',
                'path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
            ]);
        }
    }

    public function downloadHeaders(string $fileName, ?string $mimeType): array
    {
        return array_filter([
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'attachment; filename="' . str_replace('"', '', $fileName) . '"',
        ]);
    }
}
