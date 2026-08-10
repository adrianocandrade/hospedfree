<?php

namespace App\Bookings\Support;

use App\Bookings\Mail\BookingAppointmentMailable;
use App\Bookings\Models\BookingAppointment;
use App\Bookings\Models\BookingEmailUsage;
use App\Bookings\Models\BookingMailConnection;
use App\Bookings\Models\BookingSettings;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Throwable;

final class BookingMailSender
{
    public function send(BookingAppointment $appointment, string $event, ?string $recipient = null): bool
    {
        $biolink = $appointment->biolink;
        $settings = BookingSettings::query()->where('biolink_id', $biolink->id)->first();
        $connection = $settings?->mail_connection_id
            ? BookingMailConnection::query()->where('id', $settings->mail_connection_id)->where('workspace_id', $appointment->workspace_id)->first()
            : BookingMailConnection::query()->where('workspace_id', $appointment->workspace_id)->where('active', true)->first();

        $provider = $connection?->provider ?: 'platform';
        if ($provider === 'platform' && !$this->consumeQuota($appointment->workspace_id, $biolink)) {
            return false;
        }

        try {
            if ($connection && $provider !== 'platform') {
                $this->configure($connection);
            }

            $mailer = $connection && $provider !== 'platform' ? Mail::mailer('booking') : Mail::mailer();
            $message = $mailer->to($recipient ?: $appointment->customer_email);
            if ($connection?->reply_to) {
                $message->replyTo($connection->reply_to);
            }
            $message->send(new BookingAppointmentMailable($appointment, $event));
            return true;
        } catch (Throwable $e) {
            if ($connection) {
                $connection->forceFill(['last_error' => $e->getMessage()])->save();
            }
            return false;
        }
    }

    public function sendToResponsible(BookingAppointment $appointment, string $event): bool
    {
        $email = $appointment->relationLoaded('biolink')
            ? $appointment->biolink->user?->email
            : $appointment->biolink()->with('user')->first()?->user?->email;

        return $email ? $this->send($appointment, $event, $email) : false;
    }

    public function testConnection(BookingMailConnection $connection, string $recipient): bool
    {
        try {
            $provider = $connection->provider ?: 'platform';
            if ($provider !== 'platform') {
                $this->configure($connection);
            }

            $mailer = $provider === 'platform' ? Mail::mailer() : Mail::mailer('booking');
            $mailer->raw(__('Booking email connection test.'), function ($message) use ($connection, $recipient) {
                $message->to($recipient);
                if ($connection->reply_to) {
                    $message->replyTo($connection->reply_to);
                }
            });

            $connection->forceFill(['last_tested_at' => now(), 'last_error' => null])->save();
            return true;
        } catch (Throwable $e) {
            $connection->forceFill(['last_error' => $e->getMessage()])->save();
            return false;
        }
    }

    private function consumeQuota(int $workspaceId, object $biolink): bool
    {
        $limit = app(BookingPlanGuard::class)->emailLimit($biolink);
        $period = now()->format('Y-m');

        return DB::transaction(function () use ($workspaceId, $period, $limit) {
            $usage = BookingEmailUsage::query()->lockForUpdate()->firstOrCreate(
                ['workspace_id' => $workspaceId, 'period' => $period],
                ['platform_sent' => 0],
            );
            if ($usage->platform_sent >= $limit) {
                return false;
            }
            $usage->increment('platform_sent');
            return true;
        });
    }

    private function configure(BookingMailConnection $connection): void
    {
        $credentials = $connection->credentials ?: [];
        $provider = $connection->provider;

        if ($provider === 'mailgun') {
            config()->set('mail.mailers.booking', [
                'transport' => 'mailgun',
                'domain' => $credentials['domain'] ?? config('services.mailgun.domain'),
                'secret' => $credentials['secret'] ?? config('services.mailgun.secret'),
                'endpoint' => $credentials['endpoint'] ?? config('services.mailgun.endpoint'),
            ]);
        } elseif ($provider === 'ses') {
            config()->set('mail.mailers.booking', [
                'transport' => 'ses',
                'key' => $credentials['key'] ?? config('services.ses.key'),
                'secret' => $credentials['secret'] ?? config('services.ses.secret'),
                'region' => $credentials['region'] ?? config('services.ses.region'),
            ]);
        } else {
            config()->set('mail.mailers.booking', [
                'transport' => 'smtp',
                'host' => $credentials['host'] ?? config('mail.mailers.smtp.host'),
                'port' => $credentials['port'] ?? config('mail.mailers.smtp.port'),
                'encryption' => $credentials['encryption'] ?? config('mail.mailers.smtp.encryption'),
                'username' => $credentials['username'] ?? null,
                'password' => $credentials['password'] ?? null,
                'timeout' => 10,
            ]);
        }
        config()->set('mail.from', [
            'address' => $connection->from_address ?: config('mail.from.address'),
            'name' => $connection->from_name ?: config('mail.from.name'),
        ]);
    }
}
