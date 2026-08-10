<?php

namespace App\Biolinks\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BiolinkWidgetItem extends Model
{
    protected $guarded = [];

    protected $casts = [
        'active' => 'boolean',
        'sort_order' => 'integer',
        'price' => 'decimal:2',
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
        return $this->belongsTo(BiolinkWidget::class, 'biolink_widget_id');
    }
}
