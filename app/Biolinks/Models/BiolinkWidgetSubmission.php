<?php

namespace App\Biolinks\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BiolinkWidgetSubmission extends Model
{
    public const STATUS_NEW = 'new';
    public const STATUS_READ = 'read';
    public const STATUS_ARCHIVED = 'archived';

    protected $guarded = [];

    protected $casts = [
        'payload' => 'array',
        'consent_at' => 'datetime',
        'read_at' => 'datetime',
        'archived_at' => 'datetime',
    ];

    protected function payload(): Attribute
    {
        return Attribute::make(
            get: fn($value) => $value ? json_decode($value, true) ?: [] : [],
            set: fn($value) => is_string($value) ? $value : json_encode($value),
        );
    }

    public function biolink(): BelongsTo
    {
        return $this->belongsTo(Biolink::class);
    }

    public function widget(): BelongsTo
    {
        return $this->belongsTo(BiolinkWidget::class, 'widget_id');
    }
}
