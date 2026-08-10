<?php

namespace Tests\Unit;

use App\Files\Handlers\ValidateBiolinkDocumentUpload;
use Tests\TestCase;
use ZipArchive;

class ValidateBiolinkDocumentUploadTest extends TestCase
{
    public function test_pdf_requires_a_real_pdf_header(): void
    {
        $validator = app(ValidateBiolinkDocumentUpload::class);

        $this->assertTrue(
            $validator->isAllowedDocument("%PDF-1.7\ncontent", 'pdf', null),
        );
        $this->assertFalse(
            $validator->isAllowedDocument('<script>alert(1)</script>', 'pdf', null),
        );
    }

    public function test_open_xml_document_requires_the_expected_internal_marker(): void
    {
        $validator = app(ValidateBiolinkDocumentUpload::class);
        $docx = $this->zipContents([
            '[Content_Types].xml' => '<Types />',
            'word/document.xml' => '<document />',
        ]);

        $this->assertTrue(
            $validator->isAllowedDocument($docx, 'docx', 'word/document.xml'),
        );
        $this->assertFalse(
            $validator->isAllowedDocument($docx, 'xlsx', 'xl/workbook.xml'),
        );
    }

    /** @param array<string, string> $files */
    private function zipContents(array $files): string
    {
        $path = tempnam(sys_get_temp_dir(), 'mlb-doc-');
        $archive = new ZipArchive();
        $archive->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        foreach ($files as $name => $contents) {
            $archive->addFromString($name, $contents);
        }
        $archive->close();

        try {
            return (string) file_get_contents($path);
        } finally {
            @unlink($path);
        }
    }
}
