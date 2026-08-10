<?php

namespace App\Bookings\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookingEmailUsage extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'workspace_id' => 'integer',
        'platform_sent' => 'integer',
    ];
}
