<?php

namespace App\Blog\Resources;

use App\Blog\Models\BlogCategory;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin BlogCategory
 */
#[SchemaName('BlogCategory')]
class BlogCategoryResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'seo_title' => $this->seo_title,
            'seo_description' => $this->seo_description,
            'sort_order' => $this->sort_order,
            'posts_count' => $this->whenCounted('posts'),
            'published_posts_count' => $this->whenCounted('publishedPosts'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,
            /** @var "blogCategory" */
            'model_type' => $this->model_type,
        ];
    }
}
