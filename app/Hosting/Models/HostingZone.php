<?php

namespace App\Hosting\Models;

use Illuminate\Database\Eloquent\Model;

class HostingZone extends Model
{
    protected $guarded = [];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];
}
