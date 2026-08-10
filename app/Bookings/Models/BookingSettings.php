<?php

namespace App\Bookings\Models;

use App\Biolinks\Models\Biolink;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingSettings extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'biolink_id' => 'integer',
        'mail_connection_id' => 'integer',
        'default_slot_interval_minutes' => 'integer',
        'default_capacity' => 'integer',
        'cancellation_deadline_minutes' => 'integer',
        'customer_can_cancel' => 'boolean',
        'customer_can_reschedule' => 'boolean',
        'reminder_enabled' => 'boolean',
        'reminder_minutes' => 'integer',
    ];

    public function biolink(): BelongsTo
    {
        return $this->belongsTo(Biolink::class);
    }
}
