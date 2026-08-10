<?php

namespace App\Bookings\Models;

use App\Biolinks\Models\Biolink;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookingService extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'biolink_id' => 'integer',
        'service_type' => 'string',
        'duration_minutes' => 'integer',
        'slot_interval_minutes' => 'integer',
        'capacity' => 'integer',
        'buffer_before_minutes' => 'integer',
        'buffer_after_minutes' => 'integer',
        'price' => 'decimal:2',
        'payment_method' => 'string',
        'release_info_after_booking' => 'boolean',
        'active' => 'boolean',
        'position' => 'integer',
    ];

    public function biolink(): BelongsTo
    {
        return $this->belongsTo(Biolink::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(BookingAppointment::class, 'service_id');
    }
}
