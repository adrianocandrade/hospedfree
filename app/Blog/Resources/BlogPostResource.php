<?php

namespace App\Blog\Resources;

use App\Blog\Models\BlogPost;
use App\Models\User;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin BlogPost
 */
#[SchemaName('BlogPost')]
class BlogPostResource extends JsonResource
{
    public function __construct(
        mixed $resource,
        protected string|null $fieldsPreset = null,
    ) {
        parent::__construct($resource);
    }

    public function toArray($request): array
    {
        $fieldsPreset = $this->fieldsPreset ?? request()->input('fieldsPreset');

        return [
            'id' => $this->id,
            'blog_category_id' => $this->blog_category_id,
            /** @var array{id: int, name: string, slug: string, description?: string|null, seo_title?: string|null, seo_description?: string|null, sort_order?: int, posts_count?: int, published_posts_count?: int, created_at?: string|null, updated_at?: string|null, deleted_at?: string|null, model_type: "blogCategory"}|null */
            'category' => $this->whenLoaded(
                'category',
                fn() => (new BlogCategoryResource($this->category))->resolve(
                    $request,
                ),
            ),
            'user_id' => $this->user_id,
            'author' => $this->whenLoaded(
                'author',
                fn(User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'image' => $user->image,
                ],
            ),
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'body' => $this->when($fieldsPreset === 'show', $this->body),
            'featured_image' => $this->featured_image,
            'seo_title' => $this->seo_title,
            'seo_description' => $this->seo_description,
            'status' => $this->status,
            'published_at' => $this->published_at,
            'reading_time_minutes' => $this->getReadingTimeMinutes(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,
            /** @var "blogPost" */
            'model_type' => $this->model_type,
        ];
    }
}
