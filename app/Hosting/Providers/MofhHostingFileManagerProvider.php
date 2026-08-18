<?php

namespace App\Hosting\Providers;

use App\Hosting\Contracts\HostingFileManagerProvider;
use App\Hosting\Data\HostingFileContentData;
use App\Hosting\Data\HostingFileEntryData;
use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Data\ProviderResponse;
use App\Hosting\Services\HostingFilePath;
use Closure;
use League\Flysystem\DirectoryAttributes;
use League\Flysystem\FileAttributes;
use League\Flysystem\Filesystem;
use League\Flysystem\FilesystemException;
use League\Flysystem\FilesystemOperator;
use League\Flysystem\Ftp\FtpAdapter;
use League\Flysystem\Ftp\FtpConnectionOptions;
use League\Flysystem\Ftp\UnableToAuthenticate;
use League\Flysystem\Ftp\UnableToConnectToFtpHost;
use League\Flysystem\Ftp\UnableToEnableUtf8Mode;
use League\Flysystem\Ftp\UnableToMakeConnectionPassive;
use League\Flysystem\Ftp\UnableToResolveConnectionRoot;
use Throwable;
use ZipArchive;

final class MofhHostingFileManagerProvider implements HostingFileManagerProvider
{
    private HostingFilePath $paths;

    public function __construct(
        private ?Closure $filesystemFactory = null,
        ?HostingFilePath $paths = null,
    ) {
        $this->paths = $paths ?? new HostingFilePath();
    }

    public function listDirectory(
        PanelAccountCredentialsData $account,
        string $path,
    ): ProviderResponse {
        return $this->execute($account, function (FilesystemOperator $files) use (
            $path,
        ): ProviderResponse {
            $entries = collect($files->listContents($path, false))
                ->map(function ($entry): HostingFileEntryData {
                    $path = $entry->path();

                    return new HostingFileEntryData(
                        name: basename($path),
                        path: $path,
                        type: $entry instanceof DirectoryAttributes
                            ? 'directory'
                            : 'file',
                        size: $entry instanceof FileAttributes
                            ? $entry->fileSize()
                            : null,
                        modifiedAt: $entry->lastModified()
                            ? date(DATE_ATOM, $entry->lastModified())
                            : null,
                        permissions: $entry->visibility(),
                    );
                })
                ->sortBy([
                    fn(HostingFileEntryData $entry) =>
                        $entry->type === 'directory' ? 0 : 1,
                    fn(HostingFileEntryData $entry) => strtolower($entry->name),
                ])
                ->values()
                ->all();

            return ProviderResponse::ok($entries);
        }, retryConnection: true);
    }

    public function readFile(
        PanelAccountCredentialsData $account,
        string $path,
    ): ProviderResponse {
        if (!$this->isEditable($path)) {
            return ProviderResponse::failure(
                'file_not_editable',
                'This file type cannot be edited in the browser.',
            );
        }

        return $this->execute($account, function (FilesystemOperator $files) use (
            $path,
        ): ProviderResponse {
            $size = $files->fileSize($path);

            if ($size > $this->maxEditableBytes()) {
                return ProviderResponse::failure(
                    'file_too_large_to_edit',
                    'This file is too large to edit in the browser.',
                );
            }

            return ProviderResponse::ok(
                new HostingFileContentData(
                    path: $path,
                    content: $files->read($path),
                    mimeType: $files->mimeType($path),
                    size: $size,
                ),
            );
        }, retryConnection: true);
    }

    public function writeFile(
        PanelAccountCredentialsData $account,
        string $path,
        string $content,
    ): ProviderResponse {
        if (!$this->isEditable($path)) {
            return ProviderResponse::failure(
                'file_not_editable',
                'This file type cannot be edited in the browser.',
            );
        }

        if (strlen($content) > $this->maxEditableBytes()) {
            return ProviderResponse::failure(
                'file_too_large_to_edit',
                'This file is too large to edit in the browser.',
            );
        }

        return $this->execute($account, function (FilesystemOperator $files) use (
            $path,
            $content,
        ): ProviderResponse {
            $files->write($path, $content);

            return ProviderResponse::ok(true);
        });
    }

    public function createDirectory(
        PanelAccountCredentialsData $account,
        string $path,
    ): ProviderResponse {
        return $this->execute($account, function (FilesystemOperator $files) use (
            $path,
        ): ProviderResponse {
            $files->createDirectory($path);

            return ProviderResponse::ok(true);
        });
    }

    public function rename(
        PanelAccountCredentialsData $account,
        string $path,
        string $newName,
    ): ProviderResponse {
        $directory = dirname($path);
        $destination = $directory === '.' ? $newName : "{$directory}/{$newName}";

        return $this->move($account, $path, $destination);
    }

    public function deletePath(
        PanelAccountCredentialsData $account,
        string $path,
    ): ProviderResponse {
        if ($path === '') {
            return ProviderResponse::failure(
                'file_root_protected',
                'The hosting file root cannot be deleted.',
            );
        }

        return $this->execute($account, function (FilesystemOperator $files) use (
            $path,
        ): ProviderResponse {
            if ($files->directoryExists($path)) {
                $files->deleteDirectory($path);
            } elseif ($files->fileExists($path)) {
                $files->delete($path);
            } else {
                return ProviderResponse::failure(
                    'file_not_found',
                    'The selected file or directory no longer exists.',
                );
            }

            return ProviderResponse::ok(true);
        });
    }

    public function chmod(
        PanelAccountCredentialsData $account,
        string $path,
        string $permissions,
    ): ProviderResponse {
        return ProviderResponse::failure(
            'file_permissions_not_supported',
            'Exact file permission changes are not available yet.',
        );
    }

    public function copy(
        PanelAccountCredentialsData $account,
        string $source,
        string $destination,
    ): ProviderResponse {
        return $this->execute($account, function (FilesystemOperator $files) use (
            $source,
            $destination,
        ): ProviderResponse {
            $files->copy($source, $destination);

            return ProviderResponse::ok(true);
        });
    }

    public function move(
        PanelAccountCredentialsData $account,
        string $source,
        string $destination,
    ): ProviderResponse {
        return $this->execute($account, function (FilesystemOperator $files) use (
            $source,
            $destination,
        ): ProviderResponse {
            $files->move($source, $destination);

            return ProviderResponse::ok(true);
        });
    }

    public function archive(
        PanelAccountCredentialsData $account,
        array $paths,
        string $destination,
    ): ProviderResponse {
        if (!$this->zipOperationsEnabled()) {
            return ProviderResponse::failure(
                'file_archive_disabled',
                'Archive operations are disabled by the administrator.',
            );
        }

        if ($paths === [] || count($paths) > $this->maxArchiveEntries()) {
            return ProviderResponse::failure(
                'file_archive_selection_invalid',
                'Select a bounded number of files to archive.',
            );
        }

        if (strtolower(pathinfo($destination, PATHINFO_EXTENSION)) !== 'zip') {
            return ProviderResponse::failure(
                'file_archive_destination_invalid',
                'The archive destination must use the ZIP extension.',
            );
        }

        return $this->execute($account, function (FilesystemOperator $files) use (
            $paths,
            $destination,
        ): ProviderResponse {
            if (
                $files->fileExists($destination) ||
                $files->directoryExists($destination)
            ) {
                return ProviderResponse::failure(
                    'file_archive_conflict',
                    'The archive destination already exists.',
                );
            }

            $temporary = tempnam(sys_get_temp_dir(), 'hospedfree-zip-');
            if ($temporary === false) {
                return ProviderResponse::failure(
                    'file_archive_failed',
                    'The archive could not be created.',
                    true,
                );
            }

            $archive = new ZipArchive();
            $archiveOpen = false;
            $entries = 0;
            $bytes = 0;

            try {
                if ($archive->open($temporary, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                    return ProviderResponse::failure(
                        'file_archive_failed',
                        'The archive could not be created.',
                    );
                }
                $archiveOpen = true;

                foreach ($paths as $path) {
                    if (
                        !$files->directoryExists($path) &&
                        !$files->fileExists($path)
                    ) {
                        return ProviderResponse::failure(
                            'file_not_found',
                            'A selected archive source no longer exists.',
                        );
                    }

                    $baseDirectory = dirname($path);
                    $baseDirectory = $baseDirectory === '.' ? '' : $baseDirectory;
                    $candidates = $files->directoryExists($path)
                        ? collect($files->listContents($path, true))->all()
                        : [$files->fileExists($path)
                            ? new FileAttributes($path, $files->fileSize($path))
                            : null];

                    if ($files->directoryExists($path)) {
                        $archive->addEmptyDir(basename($path));
                    }

                    foreach ($candidates as $entry) {
                        if (!$entry || $entry->path() === $destination) {
                            continue;
                        }

                        $entries++;
                        if ($entries > $this->maxArchiveEntries()) {
                            return ProviderResponse::failure(
                                'file_archive_too_many_entries',
                                'The selected archive contains too many entries.',
                            );
                        }

                        if ($entry instanceof DirectoryAttributes) {
                            $archive->addEmptyDir($this->relativeArchiveName(
                                $baseDirectory,
                                $entry->path(),
                            ));
                            continue;
                        }

                        $size = $entry->fileSize() ?? $files->fileSize($entry->path());
                        $bytes += $size;
                        if ($bytes > $this->maxArchiveSourceBytes()) {
                            return ProviderResponse::failure(
                                'file_archive_too_large',
                                'The selected files exceed the archive size limit.',
                            );
                        }

                        if (!$archive->addFromString(
                            $this->relativeArchiveName(
                                $baseDirectory,
                                $entry->path(),
                            ),
                            $files->read($entry->path()),
                        )) {
                            return ProviderResponse::failure(
                                'file_archive_failed',
                                'A selected file could not be added to the archive.',
                            );
                        }
                    }
                }

                $closed = $archive->close();
                $archiveOpen = false;
                if (!$closed || filesize($temporary) > $this->maxArchiveBytes()) {
                    return ProviderResponse::failure(
                        'file_archive_too_large',
                        'The generated archive exceeds the configured size limit.',
                    );
                }

                $stream = fopen($temporary, 'rb');
                if ($stream === false) {
                    return ProviderResponse::failure(
                        'file_archive_failed',
                        'The generated archive could not be read.',
                    );
                }

                try {
                    $files->writeStream($destination, $stream);
                } finally {
                    fclose($stream);
                }

                return ProviderResponse::ok(true);
            } finally {
                if ($archiveOpen) {
                    $archive->close();
                }
                @unlink($temporary);
            }
        });
    }

    public function extract(
        PanelAccountCredentialsData $account,
        string $archive,
        string $destination,
    ): ProviderResponse {
        if (!$this->zipOperationsEnabled()) {
            return ProviderResponse::failure(
                'file_archive_disabled',
                'Archive operations are disabled by the administrator.',
            );
        }

        if (strtolower(pathinfo($archive, PATHINFO_EXTENSION)) !== 'zip') {
            return ProviderResponse::failure(
                'file_extract_format_invalid',
                'Only ZIP archives can be extracted.',
            );
        }

        return $this->execute($account, function (FilesystemOperator $files) use (
            $archive,
            $destination,
        ): ProviderResponse {
            if (!$files->fileExists($archive)) {
                return ProviderResponse::failure(
                    'file_not_found',
                    'The selected archive no longer exists.',
                );
            }

            if ($files->fileSize($archive) > $this->maxArchiveBytes()) {
                return ProviderResponse::failure(
                    'file_extract_archive_too_large',
                    'The selected archive exceeds the extraction limit.',
                );
            }

            $temporary = tempnam(sys_get_temp_dir(), 'hospedfree-unzip-');
            if ($temporary === false) {
                return ProviderResponse::failure(
                    'file_extract_failed',
                    'The archive could not be prepared for extraction.',
                    true,
                );
            }

            $zip = new ZipArchive();
            $zipOpen = false;

            try {
                $input = $files->readStream($archive);
                $output = fopen($temporary, 'wb');
                if (!is_resource($input) || $output === false) {
                    return ProviderResponse::failure(
                        'file_extract_failed',
                        'The archive could not be read.',
                    );
                }

                try {
                    stream_copy_to_stream($input, $output);
                } finally {
                    fclose($input);
                    fclose($output);
                }

                if ($zip->open($temporary, ZipArchive::CHECKCONS) !== true) {
                    return ProviderResponse::failure(
                        'file_extract_invalid_archive',
                        'The ZIP archive is invalid or damaged.',
                    );
                }
                $zipOpen = true;

                if ($zip->numFiles > $this->maxExtractEntries()) {
                    return ProviderResponse::failure(
                        'file_extract_too_many_entries',
                        'The ZIP archive contains too many entries.',
                    );
                }

                $bytes = 0;
                $planned = [];
                $targets = [];
                for ($index = 0; $index < $zip->numFiles; $index++) {
                    $stat = $zip->statIndex($index);
                    if (!is_array($stat) || !isset($stat['name'])) {
                        return ProviderResponse::failure(
                            'file_extract_invalid_archive',
                            'The ZIP archive contains an invalid entry.',
                        );
                    }

                    $entry = $this->safeArchiveEntry((string) $stat['name']);
                    if (!$entry) {
                        return ProviderResponse::failure(
                            'file_extract_unsafe_path',
                            'The ZIP archive contains an unsafe path.',
                        );
                    }

                    $bytes += (int) ($stat['size'] ?? 0);
                    if ($bytes > $this->maxExtractBytes()) {
                        return ProviderResponse::failure(
                            'file_extract_too_large',
                            'The extracted content exceeds the configured limit.',
                        );
                    }

                    $target = $destination === ''
                        ? $entry
                        : $this->paths->normalize("{$destination}/{$entry}", false);
                    $directory = str_ends_with((string) $stat['name'], '/');

                    if ((int) ($stat['encryption_method'] ?? 0) !== 0) {
                        return ProviderResponse::failure(
                            'file_extract_encrypted_archive',
                            'Encrypted ZIP archives are not supported.',
                        );
                    }

                    if (isset($targets[$target])) {
                        return ProviderResponse::failure(
                            'file_extract_duplicate_path',
                            'The ZIP archive contains duplicate paths.',
                        );
                    }
                    $targets[$target] = true;

                    if (
                        (!$directory && (
                            $files->fileExists($target) ||
                            $files->directoryExists($target)
                        )) ||
                        ($directory && $files->fileExists($target))
                    ) {
                        return ProviderResponse::failure(
                            'file_extract_conflict',
                            'An extracted path already exists.',
                        );
                    }

                    $parent = dirname($target);
                    while ($parent !== '.' && $parent !== '') {
                        if ($files->fileExists($parent)) {
                            return ProviderResponse::failure(
                                'file_extract_conflict',
                                'An extracted parent path is an existing file.',
                            );
                        }
                        $parent = dirname($parent);
                    }

                    $planned[] = [
                        'name' => (string) $stat['name'],
                        'target' => $target,
                        'directory' => $directory,
                    ];
                }

                foreach ($planned as $item) {
                    if ($item['directory']) {
                        if (!$files->directoryExists($item['target'])) {
                            $files->createDirectory($item['target']);
                        }
                        continue;
                    }

                    $parent = dirname($item['target']);
                    if ($parent !== '.' && !$files->directoryExists($parent)) {
                        $files->createDirectory($parent);
                    }

                    $stream = $zip->getStream($item['name']);
                    if ($stream === false) {
                        return ProviderResponse::failure(
                            'file_extract_failed',
                            'A ZIP entry could not be read.',
                        );
                    }

                    try {
                        $files->writeStream($item['target'], $stream);
                    } finally {
                        fclose($stream);
                    }
                }

                return ProviderResponse::ok(true);
            } finally {
                if ($zipOpen) {
                    $zip->close();
                }
                @unlink($temporary);
            }
        });
    }

    public function upload(
        PanelAccountCredentialsData $account,
        string $path,
        string $localFile,
    ): ProviderResponse {
        if (!is_file($localFile)) {
            return ProviderResponse::failure(
                'upload_invalid',
                'The uploaded file is not available.',
            );
        }

        if (filesize($localFile) > $this->maxUploadBytes()) {
            return ProviderResponse::failure(
                'upload_too_large',
                'The uploaded file exceeds the configured size limit.',
            );
        }

        return $this->execute($account, function (FilesystemOperator $files) use (
            $path,
            $localFile,
        ): ProviderResponse {
            $stream = fopen($localFile, 'rb');

            if ($stream === false) {
                return ProviderResponse::failure(
                    'upload_invalid',
                    'The uploaded file could not be read.',
                );
            }

            try {
                $files->writeStream($path, $stream);
            } finally {
                fclose($stream);
            }

            return ProviderResponse::ok(true);
        });
    }

    public function download(
        PanelAccountCredentialsData $account,
        string $path,
    ): ProviderResponse {
        return $this->execute($account, function (FilesystemOperator $files) use (
            $path,
        ): ProviderResponse {
            $size = $files->fileSize($path);

            if ($size > $this->maxDownloadBytes()) {
                return ProviderResponse::failure(
                    'download_too_large',
                    'This file exceeds the browser download size limit.',
                );
            }

            return ProviderResponse::ok(
                new HostingFileContentData(
                    path: $path,
                    content: $files->read($path),
                    mimeType: $files->mimeType($path),
                    size: $size,
                ),
            );
        }, retryConnection: true);
    }

    private function execute(
        PanelAccountCredentialsData $account,
        callable $callback,
        bool $retryConnection = false,
    ): ProviderResponse {
        if (!$this->isConfigured()) {
            return ProviderResponse::failure(
                'file_manager_not_configured',
                'The file manager integration is not configured.',
            );
        }

        if (!(bool) config('hospedfree.file_manager.ssl')) {
            return ProviderResponse::failure(
                'file_manager_tls_required',
                'The file manager requires an encrypted provider connection.',
            );
        }

        if ($account->username === '' || $account->password === '') {
            return ProviderResponse::failure(
                'file_manager_credentials_unavailable',
                'Hosting file manager credentials are not available.',
            );
        }

        $attempts = $retryConnection
            ? min(3, max(1, (int) config('hospedfree.provider.retries', 2) + 1))
            : 1;

        for ($attempt = 1; $attempt <= $attempts; $attempt++) {
            try {
                return $callback($this->filesystem($account));
            } catch (FilesystemException $exception) {
                $code = $this->safeFailureCode($exception);

                if (
                    $attempt < $attempts &&
                    $this->shouldRetryReadOnlyFailure($code)
                ) {
                    continue;
                }

                return ProviderResponse::failure(
                    $code,
                    'The file manager operation could not be completed.',
                    retryable: true,
                );
            } catch (Throwable) {
                if ($attempt < $attempts) {
                    continue;
                }

                return ProviderResponse::failure(
                    'file_manager_unreachable',
                    'The file manager did not respond in time.',
                    retryable: true,
                );
            }
        }

        return ProviderResponse::failure(
            'file_manager_unreachable',
            'The file manager did not respond in time.',
            retryable: true,
        );
    }

    private function shouldRetryReadOnlyFailure(string $code): bool
    {
        return in_array(
            $code,
            [
                'file_manager_connection_failed',
                'file_manager_passive_mode_failed',
                'file_manager_request_failed',
            ],
            true,
        );
    }

    private function filesystem(
        PanelAccountCredentialsData $account,
    ): FilesystemOperator {
        if ($this->filesystemFactory) {
            return ($this->filesystemFactory)($account);
        }

        return new Filesystem(
            new FtpAdapter(
                FtpConnectionOptions::fromArray([
                    'host' => (string) config('hospedfree.file_manager.host'),
                    'root' => (string) config('hospedfree.file_manager.root', '/'),
                    'username' => $account->username,
                    'password' => $account->password,
                    'port' => (int) config('hospedfree.file_manager.port', 21),
                    'ssl' => true,
                    'timeout' => (int) config(
                        'hospedfree.provider.timeout_seconds',
                        15,
                    ),
                    'passive' => (bool) config(
                        'hospedfree.file_manager.passive',
                        true,
                    ),
                    // MOFH FTP does not consistently advertise OPTS UTF8 ON.
                    // Keep this opt-in so a successful login is not rejected
                    // only because the optional negotiation is unsupported.
                    'utf8' => (bool) config(
                        'hospedfree.file_manager.utf8',
                        false,
                    ),
                    'recurseManually' => true,
                ]),
            ),
        );
    }

    private function safeFailureCode(Throwable $exception): string
    {
        do {
            $code = match (true) {
                $exception instanceof UnableToAuthenticate =>
                    'file_manager_authentication_failed',
                $exception instanceof UnableToConnectToFtpHost =>
                    'file_manager_connection_failed',
                $exception instanceof UnableToEnableUtf8Mode =>
                    'file_manager_utf8_negotiation_failed',
                $exception instanceof UnableToMakeConnectionPassive =>
                    'file_manager_passive_mode_failed',
                $exception instanceof UnableToResolveConnectionRoot =>
                    'file_manager_root_unavailable',
                default => null,
            };

            if ($code) {
                return $code;
            }

            $exception = $exception->getPrevious();
        } while ($exception instanceof Throwable);

        return 'file_manager_request_failed';
    }

    private function isConfigured(): bool
    {
        $host = config('hospedfree.file_manager.host');

        return (bool) config('hospedfree.file_manager.enabled') &&
            is_string($host) &&
            $host !== '' &&
            !str_contains($host, '://') &&
            (filter_var($host, FILTER_VALIDATE_IP) ||
                filter_var($host, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME));
    }

    private function isEditable(string $path): bool
    {
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return in_array(
            $extension,
            (array) config('hospedfree.file_manager.editable_extensions', []),
            true,
        );
    }

    private function maxEditableBytes(): int
    {
        return (int) config('hospedfree.file_manager.max_editable_bytes', 1_048_576);
    }

    private function maxUploadBytes(): int
    {
        return (int) config('hospedfree.file_manager.max_upload_bytes', 25_165_824);
    }

    private function maxDownloadBytes(): int
    {
        return (int) config('hospedfree.file_manager.max_download_bytes', 25_165_824);
    }

    private function maxArchiveEntries(): int
    {
        return (int) config('hospedfree.file_manager.max_archive_entries', 500);
    }

    private function maxArchiveSourceBytes(): int
    {
        return (int) config(
            'hospedfree.file_manager.max_archive_source_bytes',
            25_165_824,
        );
    }

    private function maxArchiveBytes(): int
    {
        return (int) config('hospedfree.file_manager.max_archive_bytes', 25_165_824);
    }

    private function maxExtractEntries(): int
    {
        return (int) config('hospedfree.file_manager.max_extract_entries', 500);
    }

    private function maxExtractBytes(): int
    {
        return (int) config('hospedfree.file_manager.max_extract_bytes', 50_331_648);
    }

    private function zipOperationsEnabled(): bool
    {
        return (bool) config(
            'hospedfree.file_manager.allow_zip_operations',
            true,
        );
    }

    private function safeArchiveEntry(string $entry): ?string
    {
        if (
            $entry === '' ||
            str_starts_with($entry, '/') ||
            str_starts_with($entry, '\\') ||
            preg_match('/^[A-Za-z]:[\\\\\/]/', $entry)
        ) {
            return null;
        }

        try {
            return $this->paths->normalize(rtrim($entry, '/'), false);
        } catch (\Illuminate\Validation\ValidationException) {
            return null;
        }
    }

    private function relativeArchiveName(string $baseDirectory, string $path): string
    {
        if ($baseDirectory !== '' && str_starts_with($path, "{$baseDirectory}/")) {
            return substr($path, strlen($baseDirectory) + 1);
        }

        return basename($path);
    }
}
