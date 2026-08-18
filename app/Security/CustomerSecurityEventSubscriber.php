<?php

namespace App\Security;

use App\Models\User;
use App\Security\Enums\CustomerSecurityEventType;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Events\Dispatcher;
use Laravel\Fortify\Events\PasswordUpdatedViaController;

class CustomerSecurityEventSubscriber
{
    public function __construct(
        private readonly CustomerSecurityEventRecorder $recorder,
    ) {}

    public function login(Login $event): void
    {
        $this->record($event->user, CustomerSecurityEventType::LoginSucceeded);
    }

    public function failed(Failed $event): void
    {
        $this->record($event->user, CustomerSecurityEventType::LoginFailed);
    }

    public function logout(Logout $event): void
    {
        $this->record($event->user, CustomerSecurityEventType::Logout);
    }

    public function passwordChanged(PasswordUpdatedViaController|PasswordReset $event): void
    {
        $this->record($event->user, CustomerSecurityEventType::PasswordChanged);
    }

    public function subscribe(Dispatcher $events): array
    {
        return [
            Login::class => 'login',
            Failed::class => 'failed',
            Logout::class => 'logout',
            PasswordUpdatedViaController::class => 'passwordChanged',
            PasswordReset::class => 'passwordChanged',
        ];
    }

    private function record(mixed $user, CustomerSecurityEventType $event): void
    {
        if ($user instanceof User) {
            $this->recorder->record($user, $event, request());
        }
    }
}
