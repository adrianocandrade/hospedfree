<?php

namespace App\Blog\Requests;

use App\Blog\Models\BlogCategory;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

#[SchemaName('CrupdateBlogCategoryBody')]
class CrupdateBlogCategoryRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->filled('name') || $this->filled('slug')) {
            $this->merge([
                'slug' => slugify($this->input('slug') ?: $this->input('name')),
            ]);
        }
    }

    public function rules(): array
    {
        $categoryId = $this->route('id');

        return [
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'slug' => [
                'required',
                'string',
                'min:2',
                'max:120',
                Rule::unique('blog_categories', 'slug')->ignore($categoryId),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'seo_title' => ['nullable', 'string', 'max:160'],
            'seo_description' => ['nullable', 'string', 'max:320'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999999'],
        ];
    }

    public function authorize(): bool
    {
        return $this->user()?->hasPermission('blog.update') ?? false;
    }
}
