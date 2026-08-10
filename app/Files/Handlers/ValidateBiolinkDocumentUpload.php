<?php

namespace App\Files\Handlers;

use Common\Files\Actions\Deletion\PermanentlyDeleteEntries;
use Common\Files\FileEntry;
use Illuminate\Validation\ValidationException;
use ZipArchive;

class ValidateBiolinkDocumentUpload
{
    private const DOCUMENTS = [
        'pdf' => ['mime' => 'application/pdf', 'marker' => null],
        'docx' => [
            'mime' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'marker' => 'word/document.xml',
        ],
        'xlsx' => [
            'mime' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'marker' => 'xl/workbook.xml',
        ],
        'pptx' => [
            'mime' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'marker' => 'ppt/presentation.xml',
        ],
    ];

    public function handle(FileEntry $entry, array $data = []): FileEntry
    {
        $extension = strtolower((string) $entry->extension);
        $definition = self::DOCUMENTS[$extension] ?? null;
        $contents = $entry->getDisk()->get($entry->getStoragePath());

        if (
            !$definition ||
            !$this->isAllowedDocument($contents, $extension, $definition['marker'])
        ) {
            app(PermanentlyDeleteEntries::class)->execute([$entry->id]);

            throw ValidationException::withMessages([
                'file' => __('The document contents do not match an allowed PDF, DOCX, XLSX or PPTX file.'),
            ]);
        }

        $entry->forceFill([
            'mime' => $definition['mime'],
            'file_size' => strlen($contents),
            'type' => 'file',
        ])->save();

        return $entry->refresh();
    }

    public function isAllowedDocument(
        string $contents,
        string $extension,
        ?string $marker,
    ): bool {
        if ($extension === 'pdf') {
            return str_starts_with($contents, '%PDF-');
        }

        if (!str_starts_with($contents, "PK\x03\x04") || !$marker) {
            return false;
        }

        $path = tempnam(sys_get_temp_dir(), 'mlb-doc-');
        if (!$path || file_put_contents($path, $contents) === false) {
            return false;
        }

        try {
            $archive = new ZipArchive();

            if ($archive->open($path) !== true) {
                return false;
            }

            try {
                return
                    $archive->locateName('[Content_Types].xml') !== false &&
                    $archive->locateName($marker) !== false;
            } finally {
                $archive->close();
            }
        } finally {
            @unlink($path);
        }
    }
}
