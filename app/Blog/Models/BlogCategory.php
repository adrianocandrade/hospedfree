<?php

namespace App\Blog\Models;

use App\Blog\Factories\BlogCategoryFactory;
use Common\Core\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Scout\Searchable;

class BlogCategory extends BaseModel
{
    use HasFactory, Searchable, SoftDeletes;

    const MODEL_TYPE = 'blogCategory';

    protected $guarded = [];

    protected $casts = [
        'id' => 'integer',
        'sort_order' => 'integer',
        'deleted_at' => 'datetime',
    ];

    protected $appends = ['model_type'];

    public function posts(): HasMany
    {
        return $this->hasMany(BlogPost::class);
    }

    public function publishedPosts(): HasMany
    {
        return $this->posts()->published();
    }

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'created_at' => $this->created_at->timestamp ?? '_null',
            'updated_at' => $this->updated_at->timestamp ?? '_null',
        ];
    }

    public function toNormalizedArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'model_type' => static::MODEL_TYPE,
        ];
    }

    public static function filterableFields(): array
    {
        return ['id', 'created_at', 'updated_at', 'deleted_at'];
    }

    public static function sortableFields(): array
    {
        return ['id', 'name', 'sort_order', 'created_at', 'updated_at'];
    }

    public static function getModelTypeAttribute(): string
    {
        return static::MODEL_TYPE;
    }

    protected static function newFactory(): BlogCategoryFactory
    {
        return BlogCategoryFactory::new();
    }
}
