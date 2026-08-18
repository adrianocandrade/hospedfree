<?php

namespace App\Hosting\Data;

final readonly class HostingFileContentData
{
    public function __construct(
        public string $path,
        public string $content,
        public string $mimeType = 'text/plain',
        public ?int $size = null,
    ) {}
}
