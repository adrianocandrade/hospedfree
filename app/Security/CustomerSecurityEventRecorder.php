<?php

namespace App\Security;

use App\Models\User;
use App\Security\Enums\CustomerSecurityEventType;
use App\Security\Models\CustomerSecurityEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class CustomerSecurityEventRecorder
{
    public function __construct(
        private readonly RequestSecurityContext $context,
    ) {}

    public function record(
        User $user,
        CustomerSecurityEventType $event,
        Request|null $request = null,
    ): CustomerSecurityEvent|null {
        if (!Schema::hasTable((new CustomerSecurityEvent())->getTable())) {
            return null;
        }

        return CustomerSecurityEvent::query()->create([
            'uuid' => (string) Str::uuid7(),
            'user_id' => $user->id,
            'event' => $event,
            'ip_address' => $this->context->maskedIp($request),
        ]);
    }
}
