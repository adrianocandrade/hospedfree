<?php

namespace App\Bookings\Models;

use App\Biolinks\Models\Biolink;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingAvailabilityException extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'biolink_id' => 'integer',
        'exception_date' => 'date:Y-m-d',
        'active' => 'boolean',
    ];

    public function biolink(): BelongsTo
    {
        return $this->belongsTo(Biolink::class);
    }
}
