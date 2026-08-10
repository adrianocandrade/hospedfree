<?php

namespace App\Biolinks\Models;

use Illuminate\Database\Eloquent\Model;

class BiolinkTheme extends Model
{
    protected $guarded = [];

    protected $casts = [
        'id' => 'integer',
        'config' => 'array',
        'metadata' => 'array',
        'sort_order' => 'integer',
        'is_published' => 'boolean',
        'is_system' => 'boolean',
        'created_by' => 'integer',
    ];

    const MODEL_TYPE = 'biolinkTheme';

    public static function getModelTypeAttribute(): string
    {
        return static::MODEL_TYPE;
    }
}
