<?php

namespace App\Hosting\Controllers;

use App\Hosting\Contracts\HostingDatabaseProvider;
use App\Hosting\Contracts\HostingDomainProvider;
use App\Hosting\Contracts\HostingFileManagerProvider;
use App\Hosting\Data\HostingDatabaseData;
use App\Hosting\Data\HostingDomainData;
use App\Hosting\Data\HostingFileEntryData;
use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Enums\HostingAccountStatus;
use App\Hosting\Enums\HostingPlanType;
use App\Hosting\Enums\ProviderOperationStatus;
use App\Hosting\Enums\ProviderOperationType;
use App\Hosting\Jobs\ProvisionHostingOrder;
use App\Hosting\Jobs\RunHostingAccountOperation;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Models\HostingPlan;
use App\Hosting\Models\HostingOrder;
use App\Hosting\Models\HostingProviderOperation;
use App\Hosting\Resources\HostingAccountResource;
use App\Hosting\Resources\HostingOrderResource;
use App\Hosting\Resources\HostingProviderOperationResource;
use App\Hosting\Resources\HostingSslCertificateResource;
use App\Hosting\Services\HostingFilePath;
use App\Hosting\Support\AuthorizesHostingAdmin;
use Common\Billing\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminHostingController
{
    use AuthorizesHostingAdmin;

    public function accounts(Request $request): AnonymousResourceCollection
    {
        $this->authorizeHostingAdmin($request);
        $data = $request->validate([
            'query' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', Rule::enum(HostingAccountStatus::class)],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort' => [
                'nullable',
                'string',
                'regex:/^(fqdn|status|last_synced_at|created_at):(asc|desc)$/',
            ],
        ]);
        [$sortField, $sortDirection] = explode(
            ':',
            $data['sort'] ?? 'created_at:desc',
        );

        $accounts = HostingAccount::query()
            ->with(['plan.product', 'user:id,name,email'])
            ->when(
                $data['status'] ?? null,
                fn($query, $status) => $query->where('status', $status),
            )
            ->when($data['query'] ?? null, function ($query, string $search) {
                $like = "%{$search}%";
                $query->where(function ($query) use ($like) {
                    $query
                        ->where('fqdn', 'like', $like)
                        ->orWhere('username', 'like', $like)
                        ->orWhere('provider_account_id', 'like', $like)
                        ->orWhereHas(
                            'user',
                            fn($user) => $user
                                ->where('name', 'like', $like)
                                ->orWhere('email', 'like', $like),
                        )
                        ->orWhereHas(
                            'plan.product',
                            fn($product) => $product->where(
                                'name',
                                'like',
                                $like,
                            ),
                        );
                });
            })
            ->orderBy($sortField, $sortDirection)
            ->paginate($data['per_page'] ?? 30);
        return HostingAccountResource::collection($accounts);
    }

    public function orders(Request $request): AnonymousResourceCollection
    {
        $this->authorizeHostingAdmin($request);
        return HostingOrderResource::collection(
            HostingOrder::query()
                ->with('account.plan.product')
                ->latest()
                ->paginate(30),
        );
    }

    public function operations(Request $request): AnonymousResourceCollection
    {
        $this->authorizeHostingAdmin($request);
        $data = $request->validate([
            'query' => ['nullable', 'string', 'max:120'],
            'status' => [
                'nullable',
                Rule::enum(ProviderOperationStatus::class),
            ],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort' => [
                'nullable',
                'string',
                'regex:/^(operation|status|created_at):(asc|desc)$/',
            ],
        ]);
        [$sortField, $sortDirection] = explode(
            ':',
            $data['sort'] ?? 'created_at:desc',
        );

        return HostingProviderOperationResource::collection(
            HostingProviderOperation::query()
                ->when(
                    $data['status'] ?? null,
                    fn($query, $status) => $query->where('status', $status),
                )
                ->when($data['query'] ?? null, function (
                    $query,
                    string $search,
                ) {
                    $like = "%{$search}%";
                    $query->where(function ($query) use ($like) {
                        $query
                            ->where('operation', 'like', $like)
                            ->orWhere('provider', 'like', $like)
                            ->orWhere('safe_code', 'like', $like)
                            ->orWhere('safe_message', 'like', $like)
                            ->orWhereHas(
                                'account',
                                fn($account) => $account->where(
                                    'fqdn',
                                    'like',
                                    $like,
                                ),
                            );
                    });
                })
                ->orderBy($sortField, $sortDirection)
                ->paginate($data['per_page'] ?? 50),
        );
    }

    public function accountResources(
        Request $request,
        int $account,
        HostingDomainProvider $domainProvider,
        HostingFileManagerProvider $fileProvider,
        HostingDatabaseProvider $databaseProvider,
        HostingFilePath $paths,
    ): JsonResponse {
        $this->authorizeHostingAdmin($request);
        $path = $paths->normalize(
            (string) $request->validate([
                'path' => ['nullable', 'string', 'max:1024'],
            ])['path'] ?? '',
        );
        $model = HostingAccount::withTrashed()
            ->with(['plan.product', 'user:id,name,email', 'sslCertificates'])
            ->findOrFail($account);

        $domains = [
            'data' => [
                [
                    'domain' => $model->fqdn,
                    'type' => 'primary',
                    'status' => $model->status->value,
                    'is_primary' => true,
                ],
            ],
            'availability' => 'unavailable',
            'retryable' => false,
            'safe_code' => 'account_not_ready',
        ];
        if ($model->provider_account_id) {
            $result = $domainProvider->listDomains(
                $model->username ?: $model->provider_account_id,
                $model->fqdn,
            );
            $domains = [
                'data' =>
                    $result->success && is_array($result->data)
                        ? collect($result->data)
                            ->filter(
                                fn(mixed $domain) => $domain instanceof
                                    HostingDomainData,
                            )
                            ->map(
                                fn(HostingDomainData $domain) => [
                                    'domain' => $domain->domain,
                                    'type' => $domain->type,
                                    'status' => $domain->status,
                                    'is_primary' => $domain->isPrimary,
                                ],
                            )
                            ->push([
                                'domain' => $model->fqdn,
                                'type' => 'primary',
                                'status' => $model->status->value,
                                'is_primary' => true,
                            ])
                            ->unique('domain')
                            ->values()
                            ->all()
                        : $domains['data'],
                'availability' => $this->capabilityAvailability(
                    $result->success,
                    $result->code,
                ),
                'retryable' => $result->retryable,
                'safe_code' => $result->code,
            ];
        }

        $files = [
            'data' => [],
            'path' => $path,
            'settings' => $this->safeFileManagerSettings(),
            'availability' => 'unavailable',
            'retryable' => false,
            'safe_code' => 'account_not_ready',
        ];
        $databases = [
            'data' => [],
            'availability' => 'unavailable',
            'retryable' => false,
            'safe_code' => 'account_not_ready',
        ];
        if ($model->hasCredentials()) {
            $credentials = new PanelAccountCredentialsData(
                username: $model->username,
                password: $model->credential_secret,
            );
            $fileResult = $fileProvider->listDirectory($credentials, $path);
            $files = [
                'data' =>
                    $fileResult->success && is_array($fileResult->data)
                        ? collect($fileResult->data)
                            ->filter(
                                fn(mixed $entry) => $entry instanceof
                                    HostingFileEntryData,
                            )
                            ->map(
                                fn(HostingFileEntryData $entry) => [
                                    'name' => $entry->name,
                                    'path' => $entry->path,
                                    'type' => $entry->type,
                                    'size' => $entry->size,
                                    'modified_at' => $entry->modifiedAt,
                                    'permissions' => $entry->permissions,
                                ],
                            )
                            ->values()
                            ->all()
                        : [],
                'path' => $path,
                'settings' => $this->safeFileManagerSettings(),
                'availability' => $this->capabilityAvailability(
                    $fileResult->success,
                    $fileResult->code,
                ),
                'retryable' => $fileResult->retryable,
                'safe_code' => $fileResult->code,
            ];

            $databaseResult = $databaseProvider->listDatabases(
                $credentials,
                (string) $model->sql_host,
            );
            $databases = [
                'data' =>
                    $databaseResult->success && is_array($databaseResult->data)
                        ? collect($databaseResult->data)
                            ->filter(
                                fn(mixed $database) => $database instanceof
                                    HostingDatabaseData,
                            )
                            ->map(
                                fn(HostingDatabaseData $database) => [
                                    'name' => $database->name,
                                    'host' => $database->host,
                                    'username' => $database->username,
                                ],
                            )
                            ->values()
                            ->all()
                        : [],
                'availability' => $this->capabilityAvailability(
                    $databaseResult->success,
                    $databaseResult->code,
                ),
                'retryable' => $databaseResult->retryable,
                'safe_code' => $databaseResult->code,
            ];
        }

        $events = $model
            ->events()
            ->latest()
            ->limit(25)
            ->get()
            ->map(
                fn($event) => [
                    'id' => $event->id,
                    'event' => $event->event,
                    'safe_message' => $event->safe_message,
                    'from_status' => $event->from_status,
                    'to_status' => $event->to_status,
                    'created_at' => $event->created_at,
                ],
            )
            ->all();
        $model->events()->create([
            'actor_user_id' => $request->user()->id,
            'event' => 'admin_resources_inspected',
            'safe_message' =>
                'Hosting resources inspected by an administrator.',
            'metadata' => [
                'sections' => ['domains', 'files', 'databases', 'ssl'],
            ],
        ]);

        return response()->json([
            'data' => [
                'account' => (new HostingAccountResource($model))->resolve(
                    $request,
                ),
                'customer' => $model->user
                    ? [
                        'id' => $model->user->id,
                        'display_name' => $model->user->name,
                        'email' => $model->user->email,
                    ]
                    : null,
                'domains' => $domains,
                'files' => $files,
                'databases' => $databases,
                'ssl' => HostingSslCertificateResource::collection(
                    $model->sslCertificates,
                )->resolve($request),
                'events' => $events,
            ],
        ]);
    }

    /** @return array<string, bool|int|string> */
    private function safeFileManagerSettings(): array
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

    public function accountOperation(
        Request $request,
        int $account,
    ): JsonResponse {
        $this->authorizeHostingAdmin($request);
        $data = $request->validate([
            'operation' => [
                'required',
                Rule::in([
                    ProviderOperationType::Reconcile->value,
                    ProviderOperationType::Suspend->value,
                    ProviderOperationType::Unsuspend->value,
                    ProviderOperationType::Delete->value,
                    ProviderOperationType::ChangePassword->value,
                    ProviderOperationType::ChangePackage->value,
                ]),
            ],
            'target_plan_id' => [
                'required_if:operation,change_package',
                'nullable',
                'integer',
                'exists:hosting_plans,id',
            ],
        ]);
        $model = HostingAccount::withTrashed()->findOrFail($account);
        $type = ProviderOperationType::from($data['operation']);

        abort_if(
            in_array(
                $model->status,
                [HostingAccountStatus::Deleting, HostingAccountStatus::Deleted],
                true,
            ) && $type !== ProviderOperationType::Reconcile,
            409,
            'This hosting account can no longer receive remote changes.',
        );
        abort_if(
            $model->status === HostingAccountStatus::PendingDeletion &&
                !in_array(
                    $type,
                    [
                        ProviderOperationType::Reconcile,
                        ProviderOperationType::Delete,
                    ],
                    true,
                ),
            409,
            'Cancel the scheduled deletion before changing this hosting account.',
        );

        $targetPlan =
            $type === ProviderOperationType::ChangePackage
                ? $this->validatedTargetPlan(
                    $model,
                    (int) $data['target_plan_id'],
                )
                : null;

        if (
            $type === ProviderOperationType::Delete &&
            $model->status !== HostingAccountStatus::Deleting
        ) {
            abort_unless(
                ($model->status === HostingAccountStatus::Suspended ||
                    $model->status === HostingAccountStatus::PendingDeletion) &&
                    $model->suspended_at,
                409,
                'Suspend the hosting account before deleting it.',
            );

            if ($model->status !== HostingAccountStatus::PendingDeletion) {
                $model
                    ->fill([
                        'deletion_requested_at' => now(),
                        'deletes_at' => now(),
                        'desired_status' => HostingAccountStatus::Deleted,
                    ])
                    ->save();
                $model->transitionTo(
                    HostingAccountStatus::PendingDeletion,
                    $request->user()->id,
                    'Immediate deletion requested by an administrator.',
                );
            }
        }

        RunHostingAccountOperation::dispatch(
            $model->id,
            $type,
            "admin:{$type->value}:{$model->uuid}:" . Str::uuid7(),
            $data['target_plan_id'] ?? null,
            $request->user()->id,
        );

        $metadata = ['operation' => $type->value];
        if ($targetPlan) {
            $metadata['hosting_plan_id'] = $targetPlan->id;
        }

        $model->events()->create([
            'actor_user_id' => $request->user()->id,
            'event' => $this->adminAuditEvent($type),
            'safe_message' =>
                'Hosting operation requested by an administrator.',
            'metadata' => $metadata,
        ]);

        return response()->json(
            ['message' => 'Hosting operation queued.'],
            202,
        );
    }

    private function validatedTargetPlan(
        HostingAccount $account,
        int $targetPlanId,
    ): HostingPlan {
        $plan = HostingPlan::query()
            ->with('providerPackages')
            ->whereKey($targetPlanId)
            ->where('is_active', true)
            ->firstOrFail();

        abort_if(
            $plan->id === $account->hosting_plan_id,
            422,
            'The hosting account already uses this plan.',
        );
        abort_unless(
            $plan->packageFor($account->provider),
            422,
            'The target hosting plan is not configured for this provider.',
        );

        if ($plan->type === HostingPlanType::Paid) {
            $subscription = $account->subscription_id
                ? Subscription::query()->find($account->subscription_id)
                : null;

            abort_unless(
                $subscription &&
                    $subscription->user_id === $account->user_id &&
                    $subscription->product_id === $plan->product_id &&
                    $subscription->valid(),
                422,
                'A confirmed subscription for the target plan is required.',
            );
        }

        return $plan;
    }

    private function adminAuditEvent(ProviderOperationType $type): string
    {
        return match ($type) {
            ProviderOperationType::Suspend => 'admin_suspension_requested',
            ProviderOperationType::Unsuspend => 'admin_reactivation_requested',
            ProviderOperationType::Delete => 'admin_deletion_requested',
            ProviderOperationType::ChangePassword
                => 'admin_password_reset_requested',
            ProviderOperationType::ChangePackage
                => 'admin_package_change_requested',
            default => 'admin_operation_requested',
        };
    }

    public function retry(Request $request, int $operation): JsonResponse
    {
        $this->authorizeHostingAdmin($request);
        $data = $request->validate([
            'target_plan_id' => [
                'nullable',
                'integer',
                'exists:hosting_plans,id',
            ],
        ]);
        $model = HostingProviderOperation::findOrFail($operation);
        abort_unless(
            in_array(
                $model->status,
                [
                    ProviderOperationStatus::RetryableFailed,
                    ProviderOperationStatus::PermanentFailed,
                ],
                true,
            ),
            409,
            'Only failed operations can be retried.',
        );

        if ($model->operation === ProviderOperationType::Create) {
            abort_unless($model->hosting_order_id, 409);
            ProvisionHostingOrder::dispatch($model->hosting_order_id);
        } else {
            abort_unless($model->hosting_account_id, 409);
            if (
                $model->operation === ProviderOperationType::ChangePackage &&
                !isset($data['target_plan_id'])
            ) {
                abort(
                    422,
                    'target_plan_id is required to retry a package change.',
                );
            }
            RunHostingAccountOperation::dispatch(
                $model->hosting_account_id,
                $model->operation,
                $model->idempotency_key,
                $data['target_plan_id'] ?? null,
                $request->user()->id,
            );
        }

        $model->account?->events()->create([
            'actor_user_id' => $request->user()->id,
            'event' => 'operation_retried',
            'safe_message' => 'Provider operation retried by an administrator.',
            'metadata' => ['operation_id' => $model->id],
        ]);

        return response()->json(['message' => 'Retry queued.'], 202);
    }

    private function capabilityAvailability(bool $success, string $code): string
    {
        if ($success) {
            return 'available';
        }

        return $code === 'capability_not_configured'
            ? 'not_supported'
            : 'unavailable';
    }
}
