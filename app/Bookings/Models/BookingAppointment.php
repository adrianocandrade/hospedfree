<?php

namespace App\Bookings\Models;

use App\Biolinks\Models\Biolink;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookingAppointment extends Model
{
    use HasFactory;

    public const CONFIRMED = 'confirmed';
    public const CANCELLED_BY_CUSTOMER = 'cancelled_by_customer';
    public const CANCELLED_BY_PROVIDER = 'cancelled_by_provider';
    public const RESCHEDULED = 'rescheduled';
    public const COMPLETED = 'completed';
    public const NO_SHOW = 'no_show';

    protected $guarded = [];

    protected $casts = [
        'biolink_id' => 'integer',
        'workspace_id' => 'integer',
        'service_id' => 'integer',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'manage_token_expires_at' => 'datetime',
        'price' => 'decimal:2',
        'cancelled_at' => 'datetime',
        'metadata' => 'array',
        'release_info_after_booking' => 'boolean',
    ];

    public function biolink(): BelongsTo
    {
        return $this->belongsTo(Biolink::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(BookingService::class, 'service_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(BookingAppointmentEvent::class, 'appointment_id');
    }

    public function isActive(): bool
    {
        return $this->status === self::CONFIRMED;
    }
}
