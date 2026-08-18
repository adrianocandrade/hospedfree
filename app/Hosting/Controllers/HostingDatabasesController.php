<?php

namespace App\Hosting\Controllers;

use App\Hosting\Contracts\HostingDatabaseProvider;
use App\Hosting\Data\HostingDatabaseData;
use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Models\HostingAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;

final class HostingDatabasesController
{
    public function index(
        Request $request,
        int $account,
        HostingDatabaseProvider $provider,
    ): JsonResponse {
        $hosting = $this->ownedAccount($request, $account);

        if (!$hosting->hasCredentials()) {
            return response()->json([
                'data' => [],
                'availability' => 'unavailable',
                'retryable' => false,
                'safe_code' => 'account_not_ready',
            ]);
        }

        $result = $provider->listDatabases(
            $this->credentials($hosting),
            (string) $hosting->sql_host,
        );

        if (!$result->success || !is_array($result->data)) {
            return response()->json([
                'data' => [],
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
                ->filter(
                    fn(mixed $database) => $database instanceof HostingDatabaseData,
                )
                ->map(fn(HostingDatabaseData $database) => $this->databaseArray($database))
                ->values(),
            'availability' => 'available',
            'retryable' => false,
            'safe_code' => 'ok',
        ]);
    }

    public function store(
        Request $request,
        int $account,
        HostingDatabaseProvider $provider,
    ): JsonResponse {
        $hosting = $this->ownedAccount($request, $account);
        $name = strtolower(
            (string) $request->validate([
                'name' => [
                    'required',
                    'string',
                    'min:1',
                    'max:32',
                    'regex:/^[a-zA-Z][a-zA-Z0-9_]*$/',
                ],
            ])['name'],
        );
        $lock = Cache::lock("hosting:database-change:{$hosting->id}", 60);
        abort_unless(
            $lock->get(),
            409,
            'Another database change is already in progress.',
        );

        try {
            $result = $provider->createDatabase(
                $this->credentials($hosting),
                (string) $hosting->sql_host,
                $name,
            );
        } finally {
            $lock->release();
        }

        abort_unless(
            $result->success,
            $result->retryable ? 503 : 409,
            'The database could not be created.',
        );
        abort_unless(
            $result->data instanceof HostingDatabaseData,
            502,
            'The hosting panel returned an invalid database response.',
        );

        $hosting->events()->create([
            'actor_user_id' => $request->user()->id,
            'event' => 'database_created',
            'safe_message' => 'Hosting database created.',
            'metadata' => ['reason_code' => 'database_created'],
        ]);

        return response()->json(
            ['data' => $this->databaseArray($result->data)],
            201,
        );
    }

    private function credentials(
        HostingAccount $hosting,
    ): PanelAccountCredentialsData {
        abort_unless(
            $hosting->provider_account_id && $hosting->hasCredentials(),
            409,
            'The hosting account is not ready.',
        );

        return new PanelAccountCredentialsData(
            username: $hosting->username,
            password: $hosting->credential_secret,
        );
    }

    /** @return array{name: string, host: string, username: ?string} */
    private function databaseArray(HostingDatabaseData $database): array
    {
        return [
            'name' => $database->name,
            'host' => $database->host,
            'username' => $database->username,
        ];
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
}
