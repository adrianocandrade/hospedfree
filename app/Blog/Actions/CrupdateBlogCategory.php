<?php

namespace App\Blog\Actions;

use App\Blog\Models\BlogCategory;
use Illuminate\Support\Arr;

class CrupdateBlogCategory
{
    public function execute(BlogCategory $category, array $data): BlogCategory
    {
        if (!$category->exists) {
            $data['slug'] = $data['slug'] ?? slugify(Arr::get($data, 'name'));
        }

        $category->fill($data)->save();

        return $category;
    }
}
