<?php

namespace App\Biolinks\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class BiolinkProduct extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'price' => 'decimal:2',
        'compare_price' => 'decimal:2',
        'rating' => 'decimal:1',
        'active' => 'boolean',
        'position' => 'integer',
    ];

    public function biolink(): BelongsTo
    {
        return $this->belongsTo(Biolink::class);
    }
}
