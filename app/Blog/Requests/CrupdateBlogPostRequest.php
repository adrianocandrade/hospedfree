<?php

namespace App\Blog\Requests;

use App\Blog\Models\BlogPost;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

#[SchemaName('CrupdateBlogPostBody')]
class CrupdateBlogPostRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->filled('title') || $this->filled('slug')) {
            $this->merge([
                'slug' => slugify($this->input('slug') ?: $this->input('title')),
            ]);
        }
    }

    public function rules(): array
    {
        $postId = $this->route('id');

        return [
            'blog_category_id' => [
                'required',
                'integer',
                Rule::exists('blog_categories', 'id')->whereNull('deleted_at'),
            ],
            'title' => ['required', 'string', 'min:3', 'max:200'],
            'slug' => [
                'required',
                'string',
                'min:3',
                'max:220',
                Rule::unique('blog_posts', 'slug')->ignore($postId),
            ],
            'excerpt' => ['nullable', 'string', 'max:1000'],
            'body' => ['required', 'string', 'min:1'],
            'featured_image' => ['nullable', 'string', 'max:2048'],
            'seo_title' => ['nullable', 'string', 'max:160'],
            'seo_description' => ['nullable', 'string', 'max:320'],
            'status' => [
                'required',
                Rule::in([BlogPost::STATUS_DRAFT, BlogPost::STATUS_PUBLISHED]),
            ],
            'published_at' => ['nullable', 'date'],
        ];
    }

    public function authorize(): bool
    {
        return $this->user()?->hasPermission('blog.update') ?? false;
    }
}
