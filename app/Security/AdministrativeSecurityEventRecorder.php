<?php

namespace App\Security;

use App\Models\User;
use App\Security\Models\AdministrativeSecurityEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AdministrativeSecurityEventRecorder
{
    public function __construct(
        private readonly RequestSecurityContext $context,
    ) {}

    public function record(
        User $actor,
        string $event,
        string $targetType,
        string|int|null $targetId,
        Request|null $request = null,
    ): AdministrativeSecurityEvent|null {
        if (!Schema::hasTable((new AdministrativeSecurityEvent())->getTable())) {
            return null;
        }

        return AdministrativeSecurityEvent::query()->create([
            'uuid' => (string) Str::uuid7(),
            'actor_user_id' => $actor->id,
            'event' => $event,
            'target_type' => $targetType,
            'target_id' => $targetId === null ? null : (string) $targetId,
            'ip_address' => $this->context->maskedIp($request),
        ]);
    }
}
