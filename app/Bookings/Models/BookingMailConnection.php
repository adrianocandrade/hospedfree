<?php

namespace App\Bookings\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookingMailConnection extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'workspace_id' => 'integer',
        'credentials' => 'encrypted:array',
        'active' => 'boolean',
        'last_tested_at' => 'datetime',
    ];

    protected $hidden = ['credentials'];
}
