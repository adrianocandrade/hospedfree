<?php

namespace App\Hosting\Controllers;

use App\Hosting\Contracts\HostingPanelProvider;
use App\Hosting\Data\HostingStatsData;
use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Models\HostingAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class HostingAccountInsightsController
{
    public function stats(
        Request $request,
        int $account,
        HostingPanelProvider $provider,
    ): JsonResponse {
        $hosting = $this->ownedAccount($request, $account);

        if (!$hosting->provider_account_id || !$hosting->hasCredentials()) {
            return response()->json([
                'data' => $this->unavailableStats(
                    $hosting,
                    'account_not_ready',
                ),
            ]);
        }

        $result = $provider->stats(
            new PanelAccountCredentialsData(
                username: $hosting->username,
                password: $hosting->credential_secret,
            ),
        );

        if (!$result->success || !($result->data instanceof HostingStatsData)) {
            return response()->json([
                'data' => $this->unavailableStats(
                    $hosting,
                    $result->code,
                    $result->retryable,
                ),
            ]);
        }

        return response()->json([
            'data' => [
                'availability' => 'available',
                'retryable' => false,
                'safe_code' => 'ok',
                'measured_at' => now()->toIso8601String(),
                'is_stale' => false,
                'metrics' => [
                    'disk' => $this->metric(
                        $result->data->diskUsedBytes,
                        $this->quotaBytes($hosting, 'disk_mb') ??
                            $result->data->diskLimitBytes,
                        'bytes',
                    ),
                    'bandwidth' => $this->metric(
                        $result->data->bandwidthUsedBytes,
                        $this->quotaBytes($hosting, 'bandwidth_mb') ??
                            $result->data->bandwidthLimitBytes,
                        'bytes',
                    ),
                    'inodes' => $this->metric(
                        $result->data->inodesUsed,
                        $result->data->inodesLimit,
                        'count',
                    ),
                    'domains' => $this->metric(
                        $result->data->domainCount,
                        $this->quotaCount($hosting, 'domains'),
                        'count',
                    ),
                    'databases' => $this->metric(
                        $result->data->databaseCount,
                        $this->quotaCount($hosting, 'databases'),
                        'count',
                    ),
                ],
            ],
        ]);
    }

    public function activity(Request $request, int $account): JsonResponse
    {
        $hosting = $this->ownedAccount($request, $account);
        $events = $hosting
            ->events()
            ->latest()
            ->limit(10)
            ->get()
            ->map(
                fn($event) => [
                    'id' => $event->id,
                    'event' => $event->event,
                    'from_status' => $event->from_status,
                    'to_status' => $event->to_status,
                    'metadata' => array_intersect_key(
                        $event->metadata ?? [],
                        array_flip([
                            'tool',
                            'operation',
                            'plan_id',
                            'reason_code',
                        ]),
                    ),
                    'created_at' => $event->created_at,
                ],
            )
            ->values();

        return response()->json(['data' => $events]);
    }

    /**
     * @return array{used: ?int, limit: ?int, unit: string}
     */
    private function metric(?int $used, ?int $limit, string $unit): array
    {
        return ['used' => $used, 'limit' => $limit, 'unit' => $unit];
    }

    /**
     * @return array<string, mixed>
     */
    private function unavailableStats(
        HostingAccount $hosting,
        string $code,
        bool $retryable = false,
    ): array {
        return [
            'availability' =>
                $code === 'capability_not_configured'
                    ? 'not_supported'
                    : 'unavailable',
            'retryable' => $retryable,
            'safe_code' => $code,
            'measured_at' => null,
            'is_stale' => false,
            'metrics' => [
                'disk' => $this->metric(
                    null,
                    $this->quotaBytes($hosting, 'disk_mb'),
                    'bytes',
                ),
                'bandwidth' => $this->metric(
                    null,
                    $this->quotaBytes($hosting, 'bandwidth_mb'),
                    'bytes',
                ),
                'inodes' => $this->metric(null, null, 'count'),
                'domains' => $this->metric(
                    null,
                    $this->quotaCount($hosting, 'domains'),
                    'count',
                ),
                'databases' => $this->metric(
                    null,
                    $this->quotaCount($hosting, 'databases'),
                    'count',
                ),
            ],
        ];
    }

    private function quotaBytes(HostingAccount $hosting, string $key): ?int
    {
        $megabytes = $this->quotaCount($hosting, $key);

        return $megabytes === null ? null : $megabytes * 1024 * 1024;
    }

    private function quotaCount(HostingAccount $hosting, string $key): ?int
    {
        $value = data_get($hosting->plan?->quotas, $key);

        return is_numeric($value) ? max(0, (int) $value) : null;
    }

    private function ownedAccount(Request $request, int $id): HostingAccount
    {
        $hosting = HostingAccount::query()
            ->whereKey($id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        Gate::authorize('view', $hosting);

        return $hosting->loadMissing('plan');
    }
}
