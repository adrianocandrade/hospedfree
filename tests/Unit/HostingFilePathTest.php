<?php

namespace Tests\Unit;

use App\Hosting\Services\HostingFilePath;
use Illuminate\Validation\ValidationException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class HostingFilePathTest extends TestCase
{
    public function test_it_normalizes_relative_provider_paths(): void
    {
        $paths = app(HostingFilePath::class);

        $this->assertSame('htdocs/assets', $paths->normalize('/htdocs/assets/'));
        $this->assertSame('htdocs/index.php', $paths->join('htdocs', 'index.php'));
        $this->assertSame('', $paths->normalize('/'));
    }

    #[DataProvider('invalidPaths')]
    public function test_it_rejects_path_traversal_and_unsafe_segments(
        string $path,
    ): void {
        $this->expectException(ValidationException::class);

        app(HostingFilePath::class)->normalize($path, false);
    }

    public static function invalidPaths(): array
    {
        return [
            ['../secret'],
            ['htdocs/../secret'],
            ['htdocs//secret'],
            ['htdocs\\..\\secret'],
            ["htdocs/secret\0.txt"],
            [''],
        ];
    }

    public function test_name_cannot_contain_a_directory_separator(): void
    {
        $this->expectException(ValidationException::class);

        app(HostingFilePath::class)->name('folder/index.php');
    }
}
