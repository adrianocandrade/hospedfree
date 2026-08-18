<?php

namespace App\Hosting\Controllers;

use App\Hosting\Contracts\HostingFileManagerProvider;
use App\Hosting\Data\HostingFileContentData;
use App\Hosting\Data\HostingFileEntryData;
use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Services\HostingFilePath;
use App\Hosting\Support\AuthorizesHostingAdmin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class HostingFilesController
{
    use AuthorizesHostingAdmin;

    public function __construct(private readonly HostingFilePath $paths) {}

    public function index(
        Request $request,
        int $account,
        HostingFileManagerProvider $provider,
    ): JsonResponse {
        $hosting = $this->ownedAccount($request, $account);
        $path = $this->paths->normalize((string) $request->query('path', ''));
        $result = $provider->listDirectory($this->credentials($hosting), $path);

        if (!$result->success || !is_array($result->data)) {
            return response()->json([
                'data' => [],
                'path' => $path,
                'settings' => $this->safeSettings(),
                'availability' =>
                    $result->code === 'capability_not_configured'
                        ? 'not_supported'
                        : 'unavailable',
                'retryable' => $result->retryable,
                'safe_code' => $result->code,
            ]);
        }

        return response()->json([
            'data' => collect($result->data)
                ->filter(fn(mixed $entry) => $entry instanceof HostingFileEntryData)
                ->map(fn(HostingFileEntryData $entry) => [
                    'name' => $entry->name,
                    'path' => $entry->path,
                    'type' => $entry->type,
                    'size' => $entry->size,
                    'modified_at' => $entry->modifiedAt,
                    'permissions' => $entry->permissions,
                ])
                ->values(),
            'path' => $path,
            'settings' => $this->safeSettings(),
            'availability' => 'available',
            'retryable' => false,
            'safe_code' => 'ok',
        ]);
    }

    public function show(
        Request $request,
        int $account,
        HostingFileManagerProvider $provider,
    ): JsonResponse {
        $hosting = $this->ownedAccount($request, $account);
        $path = $this->paths->normalize(
            (string) $request->validate([
                'path' => ['required', 'string', 'max:1024'],
            ])['path'],
            false,
        );
        $result = $provider->readFile($this->credentials($hosting), $path);
        $this->abortForFailure($result->success, $result->retryable);
        abort_unless($result->data instanceof HostingFileContentData, 502);

        return response()->json([
            'data' => [
                'path' => $result->data->path,
                'content' => $result->data->content,
                'mime_type' => $result->data->mimeType,
                'size' => $result->data->size,
            ],
        ]);
    }

    public function store(
        Request $request,
        int $account,
        HostingFileManagerProvider $provider,
    ): JsonResponse {
        $hosting = $this->ownedAccount($request, $account);
        $payload = $request->validate([
            'type' => ['required', Rule::in(['file', 'directory'])],
            'directory' => ['nullable', 'string', 'max:1024'],
            'name' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string', 'max:1048576'],
        ]);
        $path = $this->paths->join(
            (string) ($payload['directory'] ?? ''),
            $payload['name'],
        );
        $credentials = $this->credentials($hosting);
        $result = $payload['type'] === 'directory'
            ? $provider->createDirectory($credentials, $path)
            : $provider->writeFile(
                $credentials,
                $path,
                (string) ($payload['content'] ?? ''),
            );
        $this->abortForFailure($result->success, $result->retryable);
        $this->event($request, $hosting, 'file_created');

        return response()->json(['created' => true, 'path' => $path], 201);
    }

    public function upload(
        Request $request,
        int $account,
        HostingFileManagerProvider $provider,
    ): JsonResponse {
        $hosting = $this->ownedAccount($request, $account);
        $maxKilobytes = max(
            1,
            (int) ceil(
                (int) config(
                    'hospedfree.file_manager.max_upload_bytes',
                    25_165_824,
                ) / 1024,
            ),
        );
        $payload = $request->validate([
            'directory' => ['nullable', 'string', 'max:1024'],
            'file' => ['required', 'file', "max:{$maxKilobytes}"],
        ]);
        $file = $payload['file'];
        abort_unless($file instanceof UploadedFile && $file->isValid(), 422);
        $path = $this->paths->join(
            (string) ($payload['directory'] ?? ''),
            $file->getClientOriginalName(),
        );
        $localFile = $file->getRealPath();
        abort_unless(is_string($localFile) && $localFile !== '', 422);

        $result = $provider->upload(
            $this->credentials($hosting),
            $path,
            $localFile,
        );
        $this->abortForFailure($result->success, $result->retryable);
        $this->event($request, $hosting, 'file_uploaded');

        return response()->json(['uploaded' => true, 'path' => $path], 201);
    }

    public function download(
        Request $request,
        int $account,
        HostingFileManagerProvider $provider,
    ): StreamedResponse {
        $hosting = $this->ownedAccount($request, $account);
        $path = $this->paths->normalize(
            (string) $request->validate([
                'path' => ['required', 'string', 'max:1024'],
            ])['path'],
            false,
        );
        $result = $provider->download($this->credentials($hosting), $path);
        $this->abortForFailure($result->success, $result->retryable);
        abort_unless($result->data instanceof HostingFileContentData, 502);
        $content = $result->data->content;

        return response()->streamDownload(
            static function () use ($content): void {
                echo $content;
            },
            basename($path),
            [
                'Cache-Control' => 'private, no-store',
                'Content-Type' => 'application/octet-stream',
                'X-Content-Type-Options' => 'nosniff',
            ],
        );
    }

    public function update(
        Request $request,
        int $account,
        HostingFileManagerProvider $provider,
    ): JsonResponse {
        $hosting = $this->ownedAccount($request, $account);
        $payload = $request->validate([
            'path' => ['required', 'string', 'max:1024'],
            'operation' => [
                'required',
                Rule::in([
                    'write',
                    'rename',
                    'copy',
                    'move',
                    'archive',
                    'extract',
                ]),
            ],
            'content' => ['nullable', 'string', 'max:1048576'],
            'name' => ['nullable', 'string', 'max:255'],
            'destination' => ['nullable', 'string', 'max:1024'],
        ]);
        $path = $this->paths->normalize($payload['path'], false);
        $credentials = $this->credentials($hosting);
        $result = match ($payload['operation']) {
            'write' => $provider->writeFile(
                $credentials,
                $path,
                (string) ($payload['content'] ?? ''),
            ),
            'rename' => $provider->rename(
                $credentials,
                $path,
                $this->paths->name((string) ($payload['name'] ?? '')),
            ),
            'copy' => $provider->copy(
                $credentials,
                $path,
                $this->paths->normalize(
                    (string) ($payload['destination'] ?? ''),
                    false,
                ),
            ),
            'move' => $provider->move(
                $credentials,
                $path,
                $this->paths->normalize(
                    (string) ($payload['destination'] ?? ''),
                    false,
                ),
            ),
            'archive' => $provider->archive(
                $credentials,
                [$path],
                $this->paths->normalize(
                    (string) ($payload['destination'] ?? ''),
                    false,
                ),
            ),
            'extract' => $provider->extract(
                $credentials,
                $path,
                $this->paths->normalize(
                    (string) ($payload['destination'] ?? ''),
                ),
            ),
        };
        $this->abortForFailure($result->success, $result->retryable);
        $this->event(
            $request,
            $hosting,
            match ($payload['operation']) {
                'archive' => 'file_archived',
                'extract' => 'file_extracted',
                default => 'file_changed',
            },
        );

        return response()->json(['updated' => true]);
    }

    public function destroy(
        Request $request,
        int $account,
        HostingFileManagerProvider $provider,
    ): JsonResponse {
        $hosting = $this->ownedAccount($request, $account);

        return $this->deletePath($request, $hosting, $provider, false);
    }

    public function adminDestroy(
        Request $request,
        int $account,
        HostingFileManagerProvider $provider,
    ): JsonResponse {
        $this->authorizeHostingAdmin($request);
        $hosting = HostingAccount::withTrashed()->findOrFail($account);

        return $this->deletePath($request, $hosting, $provider, true);
    }

    private function deletePath(
        Request $request,
        HostingAccount $hosting,
        HostingFileManagerProvider $provider,
        bool $admin,
    ): JsonResponse {
        $path = $this->paths->normalize(
            (string) $request->validate([
                'path' => ['required', 'string', 'max:1024'],
            ])['path'],
            false,
        );
        $result = $provider->deletePath($this->credentials($hosting), $path);
        $this->abortForFailure($result->success, $result->retryable);
        $this->event(
            $request,
            $hosting,
            $admin ? 'admin_file_deleted' : 'file_deleted',
            $admin
                ? [
                    'reason_code' => 'admin_file_deleted',
                    'path_hash' => hash('sha256', $path),
                ]
                : ['reason_code' => 'file_operation_completed'],
        );

        return response()->json(['deleted' => true]);
    }

    private function abortForFailure(bool $success, bool $retryable): void
    {
        abort_unless(
            $success,
            $retryable ? 503 : 409,
            'The file operation could not be completed.',
        );
    }

    private function credentials(
        HostingAccount $hosting,
    ): PanelAccountCredentialsData {
        abort_unless($hosting->hasCredentials(), 409, 'The hosting account is not ready.');

        return new PanelAccountCredentialsData(
            username: $hosting->username,
            password: $hosting->credential_secret,
        );
    }

    private function event(
        Request $request,
        HostingAccount $hosting,
        string $event,
        array $metadata = ['reason_code' => 'file_operation_completed'],
    ): void {
        $hosting->events()->create([
            'actor_user_id' => $request->user()->id,
            'event' => $event,
            'safe_message' => 'Hosting file operation completed.',
            'metadata' => $metadata,
        ]);
    }

    private function ownedAccount(Request $request, int $id): HostingAccount
    {
        $hosting = HostingAccount::query()
            ->whereKey($id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        Gate::authorize('view', $hosting);

        return $hosting;
    }

    /** @return array<string, bool|int|string> */
    private function safeSettings(): array
    {
        return [
            'external_fallback' => (bool) config(
                'hospedfree.file_manager.external_fallback',
                false,
            ),
            'allow_zip_operations' => (bool) config(
                'hospedfree.file_manager.allow_zip_operations',
                true,
            ),
            'editor_theme' => (string) config(
                'hospedfree.file_manager.editor_theme',
                'auto',
            ),
            'code_beautify' => (bool) config(
                'hospedfree.file_manager.code_beautify',
                true,
            ),
            'code_suggestion' => (bool) config(
                'hospedfree.file_manager.code_suggestion',
                true,
            ),
            'auto_complete' => (bool) config(
                'hospedfree.file_manager.auto_complete',
                true,
            ),
            'max_upload_bytes' => (int) config(
                'hospedfree.file_manager.max_upload_bytes',
                25_165_824,
            ),
            'max_editable_bytes' => (int) config(
                'hospedfree.file_manager.max_editable_bytes',
                1_048_576,
            ),
        ];
    }
}
