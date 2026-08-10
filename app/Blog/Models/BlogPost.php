<?php

namespace App\Blog\Models;

use App\Blog\Factories\BlogPostFactory;
use App\Models\User;
use Common\Core\BaseModel;
use Common\Files\Traits\HasAttachedFileEntries;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Laravel\Scout\Searchable;

class BlogPost extends BaseModel
{
    use HasAttachedFileEntries, HasFactory, Searchable, SoftDeletes;

    const MODEL_TYPE = 'blogPost';
    const STATUS_DRAFT = 'draft';
    const STATUS_PUBLISHED = 'published';

    protected $guarded = [];

    protected $casts = [
        'id' => 'integer',
        'blog_category_id' => 'integer',
        'user_id' => 'integer',
        'published_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $appends = ['model_type'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(BlogCategory::class, 'blog_category_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function inlineImages()
    {
        return $this->attachedFileEntriesRelation('inline_image');
    }

    public function featuredImage()
    {
        return $this->attachedFileEntriesRelation('featured_image');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query
            ->where('status', self::STATUS_PUBLISHED)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED &&
            $this->published_at &&
            $this->published_at->lessThanOrEqualTo(now());
    }

    public function getSeoTitle(): string
    {
        return $this->seo_title ?: $this->title;
    }

    public function getSeoDescription(): ?string
    {
        return $this->seo_description ?: $this->excerpt;
    }

    public function getReadingTimeMinutes(): int
    {
        $wordCount = str_word_count(strip_tags($this->body ?? ''));
        return max(1, (int) ceil($wordCount / 220));
    }

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'body' => $this->body,
            'status' => $this->status,
            'published_at' => $this->published_at?->timestamp ?? '_null',
            'created_at' => $this->created_at->timestamp ?? '_null',
            'updated_at' => $this->updated_at->timestamp ?? '_null',
            'deleted_at' => $this->deleted_at->timestamp ?? '_null',
        ];
    }

    public function toNormalizedArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->title,
            'image' => $this->featured_image,
            'description' => $this->excerpt ?: Str::limit(strip_tags($this->body), 100),
            'model_type' => static::MODEL_TYPE,
        ];
    }

    public static function filterableFields(): array
    {
        return [
            'id',
            'blog_category_id',
            'user_id',
            'status',
            'published_at',
            'created_at',
            'updated_at',
            'deleted_at',
        ];
    }

    public static function sortableFields(): array
    {
        return ['id', 'title', 'published_at', 'created_at', 'updated_at'];
    }

    public static function getModelTypeAttribute(): string
    {
        return static::MODEL_TYPE;
    }

    protected static function newFactory(): BlogPostFactory
    {
        return BlogPostFactory::new();
    }
}
