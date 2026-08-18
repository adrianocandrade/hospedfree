<?php

namespace Tests\Feature\Hosting;

use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Providers\MofhHostingFileManagerProvider;
use League\Flysystem\Filesystem;
use League\Flysystem\Ftp\UnableToConnectToFtpHost;
use League\Flysystem\Local\LocalFilesystemAdapter;
use Tests\TestCase;
use ZipArchive;

class MofhHostingFileManagerProviderTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        parent::setUp();

        $this->root = storage_path('framework/testing/file-manager-' . uniqid());
        mkdir($this->root, 0777, true);
        config()->set('hospedfree.file_manager.enabled', true);
        config()->set('hospedfree.file_manager.host', 'ftp.example.test');
        config()->set('hospedfree.file_manager.ssl', true);
        config()->set('hospedfree.file_manager.allow_zip_operations', true);
        config()->set('hospedfree.file_manager.editable_extensions', [
            'txt',
            'php',
        ]);
        config()->set('hospedfree.file_manager.max_editable_bytes', 1024);
        config()->set('hospedfree.file_manager.max_archive_entries', 20);
        config()->set('hospedfree.file_manager.max_archive_source_bytes', 4096);
        config()->set('hospedfree.file_manager.max_archive_bytes', 4096);
        config()->set('hospedfree.file_manager.max_extract_entries', 20);
        config()->set('hospedfree.file_manager.max_extract_bytes', 4096);
    }

    protected function tearDown(): void
    {
        if (is_dir($this->root)) {
            $files = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator(
                    $this->root,
                    \FilesystemIterator::SKIP_DOTS,
                ),
                \RecursiveIteratorIterator::CHILD_FIRST,
            );

            foreach ($files as $file) {
                $file->isDir()
                    ? @rmdir($file->getPathname())
                    : @unlink($file->getPathname());
            }

            @rmdir($this->root);
        }

        parent::tearDown();
    }

    public function test_it_performs_basic_file_operations_without_serializing_credentials(): void
    {
        $provider = $this->provider();
        $credentials = $this->credentials();

        $this->assertTrue(
            $provider->createDirectory($credentials, 'htdocs')->success,
        );
        $this->assertTrue(
            $provider
                ->writeFile($credentials, 'htdocs/index.php', '<?php echo 1;')
                ->success,
        );
        $listing = $provider->listDirectory($credentials, 'htdocs');
        $content = $provider->readFile($credentials, 'htdocs/index.php');
        $renamed = $provider->rename(
            $credentials,
            'htdocs/index.php',
            'home.php',
        );

        $this->assertTrue($listing->success);
        $this->assertSame('home.php', basename('htdocs/home.php'));
        $this->assertSame('index.php', $listing->data[0]->name);
        $this->assertSame('<?php echo 1;', $content->data->content);
        $this->assertTrue($renamed->success);
        $this->assertTrue(
            $provider->deletePath($credentials, 'htdocs/home.php')->success,
        );
        $this->assertStringNotContainsString(
            'file-manager-password',
            json_encode([$listing, $content, $renamed]),
        );
    }

    public function test_it_requires_tls_and_rejects_unsupported_browser_editing(): void
    {
        $provider = $this->provider();
        $binary = $provider->writeFile(
            $this->credentials(),
            'htdocs/image.png',
            'binary',
        );
        config()->set('hospedfree.file_manager.ssl', false);
        $withoutTls = $provider->listDirectory($this->credentials(), '');

        $this->assertSame('file_not_editable', $binary->code);
        $this->assertSame('file_manager_tls_required', $withoutTls->code);
    }

    public function test_it_retries_a_read_only_listing_with_a_fresh_connection(): void
    {
        config()->set('hospedfree.provider.retries', 1);
        $attempts = 0;
        $provider = new MofhHostingFileManagerProvider(function () use (
            &$attempts,
        ) {
            $attempts++;

            if ($attempts === 1) {
                throw UnableToConnectToFtpHost::forHost(
                    'ftp.example.test',
                    21,
                    true,
                );
            }

            return new Filesystem(new LocalFilesystemAdapter($this->root));
        });

        $result = $provider->listDirectory($this->credentials(), '');

        $this->assertTrue($result->success);
        $this->assertSame(2, $attempts);
    }

    public function test_it_does_not_retry_a_write_after_a_connection_failure(): void
    {
        config()->set('hospedfree.provider.retries', 2);
        $attempts = 0;
        $provider = new MofhHostingFileManagerProvider(function () use (
            &$attempts,
        ) {
            $attempts++;

            throw UnableToConnectToFtpHost::forHost(
                'ftp.example.test',
                21,
                true,
            );
        });

        $result = $provider->writeFile(
            $this->credentials(),
            'index.php',
            '<?php echo 1;',
        );

        $this->assertFalse($result->success);
        $this->assertSame('file_manager_connection_failed', $result->code);
        $this->assertSame(1, $attempts);
    }

    public function test_it_uploads_and_downloads_bounded_files_without_exposing_credentials(): void
    {
        config()->set('hospedfree.file_manager.max_upload_bytes', 1024);
        config()->set('hospedfree.file_manager.max_download_bytes', 1024);
        $source = storage_path('framework/testing/file-upload-' . uniqid() . '.txt');
        file_put_contents($source, 'conteudo seguro');

        try {
            $provider = $this->provider();
            $credentials = $this->credentials();
            $upload = $provider->upload(
                $credentials,
                'htdocs/enviado.txt',
                $source,
            );
            $download = $provider->download(
                $credentials,
                'htdocs/enviado.txt',
            );

            $this->assertTrue($upload->success);
            $this->assertTrue($download->success);
            $this->assertSame('conteudo seguro', $download->data->content);
            $this->assertStringNotContainsString(
                'file-manager-password',
                json_encode([$upload, $download]),
            );
        } finally {
            if (is_file($source)) {
                unlink($source);
            }
        }
    }

    public function test_it_creates_and_safely_extracts_zip_archives(): void
    {
        $provider = $this->provider();
        $credentials = $this->credentials();
        $provider->createDirectory($credentials, 'htdocs');
        $provider->writeFile($credentials, 'htdocs/index.php', '<?php echo 1;');

        $archive = $provider->archive(
            $credentials,
            ['htdocs/index.php'],
            'htdocs/site.zip',
        );
        $provider->deletePath($credentials, 'htdocs/index.php');
        $extract = $provider->extract(
            $credentials,
            'htdocs/site.zip',
            'htdocs/restored',
        );
        $content = $provider->readFile(
            $credentials,
            'htdocs/restored/index.php',
        );

        $this->assertTrue($archive->success);
        $this->assertTrue($extract->success);
        $this->assertSame('<?php echo 1;', $content->data->content);
        $this->assertStringNotContainsString(
            'file-manager-password',
            json_encode([$archive, $extract]),
        );
    }

    public function test_it_rejects_zip_traversal_before_writing_any_entry(): void
    {
        mkdir($this->root . '/htdocs', 0777, true);
        $archivePath = $this->root . '/htdocs/unsafe.zip';
        $archive = new ZipArchive();
        $archive->open($archivePath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $archive->addFromString('safe.php', '<?php echo 0;');
        $archive->addFromString('../outside.php', '<?php echo 1;');
        $archive->close();

        $result = $this->provider()->extract(
            $this->credentials(),
            'htdocs/unsafe.zip',
            'htdocs/restored',
        );

        $this->assertFalse($result->success);
        $this->assertSame('file_extract_unsafe_path', $result->code);
        $this->assertFileDoesNotExist(
            $this->root . '/htdocs/restored/safe.php',
        );
        $this->assertFileDoesNotExist($this->root . '/htdocs/outside.php');
        $this->assertFileDoesNotExist($this->root . '/outside.php');
    }

    public function test_it_honors_the_administrator_zip_operation_switch(): void
    {
        config()->set('hospedfree.file_manager.allow_zip_operations', false);

        $result = $this->provider()->archive(
            $this->credentials(),
            ['htdocs/index.php'],
            'htdocs/site.zip',
        );

        $this->assertFalse($result->success);
        $this->assertSame('file_archive_disabled', $result->code);
    }

    private function provider(): MofhHostingFileManagerProvider
    {
        return new MofhHostingFileManagerProvider(
            fn() => new Filesystem(new LocalFilesystemAdapter($this->root)),
        );
    }

    private function credentials(): PanelAccountCredentialsData
    {
        return new PanelAccountCredentialsData(
            'hf-file-user',
            'file-manager-password',
        );
    }
}
