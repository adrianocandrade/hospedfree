<?php

namespace App\Hosting\Models;

use Illuminate\Database\Eloquent\Model;

class HostingIntegrationSecret extends Model
{
    protected $guarded = [];

    protected $hidden = ['value'];

    protected $casts = [
        'value' => 'encrypted',
    ];
}
