<?php

namespace App\Security\Controllers;

use App\Models\User;
use App\Security\CustomerCommunicationRecorder;
use App\Security\CustomerSecurityEventRecorder;
use App\Security\Enums\CustomerSecurityEventType;
use App\Security\Notifications\EmailChangedNotice;
use App\Security\Notifications\VerifyEmailChange;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class EmailChangeController
{
    public function __construct(
        private readonly CustomerCommunicationRecorder $communicationRecorder,
        private readonly CustomerSecurityEventRecorder $securityEventRecorder,
    ) {}

    public function requestChange(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validate([
            'email' => [
                'required',
                'email:rfc',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
                Rule::unique('users', 'pending_email')->ignore($user->id),
            ],
            'current_password' => ['required', 'string', 'max:1000'],
        ]);

        if (!$user->password || !Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => __('The current password is incorrect.'),
            ]);
        }

        $email = strtolower(trim($data['email']));
        if (hash_equals(strtolower($user->email), $email)) {
            throw ValidationException::withMessages([
                'email' => __('Enter an email address different from the current one.'),
            ]);
        }

        $code = (string) random_int(100000, 999999);
        $user->forceFill([
            'pending_email' => $email,
            'pending_email_verification_hash' => Hash::make($code),
            'pending_email_requested_at' => now(),
        ])->save();

        $notification = new VerifyEmailChange($code);
        $notification->id = (string) Str::uuid();

        try {
            Notification::route('mail', $email)->notify($notification);
            $this->communicationRecorder->record($user, $notification, 'mail', 'sent');
        } catch (Throwable $exception) {
            $this->communicationRecorder->record($user, $notification, 'mail', 'failed');
            throw $exception;
        }

        $this->securityEventRecorder->record(
            $user,
            CustomerSecurityEventType::EmailChangeRequested,
            $request,
        );

        return response()->json([
            'pending_email' => $email,
            'expires_at' => now()->addMinutes(30)->toIso8601String(),
        ])->header('Cache-Control', 'no-store, private');
    }

    public function confirm(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validate([
            'code' => ['required', 'digits:6'],
        ]);

        $expired = !$user->pending_email_requested_at ||
            $user->pending_email_requested_at->lt(now()->subMinutes(30));
        $valid = $user->pending_email &&
            $user->pending_email_verification_hash &&
            Hash::check($data['code'], $user->pending_email_verification_hash);

        if ($expired || !$valid) {
            throw ValidationException::withMessages([
                'code' => __('The security code is invalid or has expired.'),
            ]);
        }

        $previousEmail = $user->email;

        DB::transaction(function () use ($user): void {
            $emailTaken = User::query()
                ->where('email', $user->pending_email)
                ->whereKeyNot($user->id)
                ->exists();

            if ($emailTaken) {
                throw ValidationException::withMessages([
                    'code' => __('This email address is no longer available.'),
                ]);
            }

            $user->forceFill([
                'email' => $user->pending_email,
                'email_verified_at' => now(),
                'pending_email' => null,
                'pending_email_verification_hash' => null,
                'pending_email_requested_at' => null,
            ])->save();
            $user->tokens()->delete();
        });

        $this->securityEventRecorder->record(
            $user,
            CustomerSecurityEventType::EmailChanged,
            $request,
        );
        $this->notifyPreviousEmail($user, $previousEmail);

        return response()->json(['email' => $user->fresh()->email])
            ->header('Cache-Control', 'no-store, private');
    }

    public function cancel(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $hadPendingChange = (bool) $user->pending_email;

        $user->forceFill([
            'pending_email' => null,
            'pending_email_verification_hash' => null,
            'pending_email_requested_at' => null,
        ])->save();

        if ($hadPendingChange) {
            $this->securityEventRecorder->record(
                $user,
                CustomerSecurityEventType::EmailChangeCancelled,
                $request,
            );
        }

        return response()->json(['cancelled' => true]);
    }

    private function notifyPreviousEmail(User $user, string $previousEmail): void
    {
        $notification = new EmailChangedNotice();
        $notification->id = (string) Str::uuid();

        try {
            Notification::route('mail', $previousEmail)->notify($notification);
            $this->communicationRecorder->record($user, $notification, 'mail', 'sent');
        } catch (Throwable $exception) {
            $this->communicationRecorder->record($user, $notification, 'mail', 'failed');
            report($exception);
        }
    }
}
