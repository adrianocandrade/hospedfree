<?php

namespace App\Bookings\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingAppointmentEvent extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'appointment_id' => 'integer',
        'actor_id' => 'integer',
        'metadata' => 'array',
    ];

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(BookingAppointment::class, 'appointment_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
