<?php

namespace App\Core;

use Common\Core\Prerender\BaseUrlGenerator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

class UrlGenerator extends BaseUrlGenerator
{
    public function blogIndex(): string
    {
        return url('blog');
    }

    public function blogCategory(Model|array $category): string
    {
        return url('blog/categoria/' . slugify($this->slugFrom($category)));
    }

    public function blogPost(Model|array $post): string
    {
        return url('blog/' . slugify($this->slugFrom($post)));
    }

    private function slugFrom(Model|array $model): string
    {
        if ($model instanceof Model) {
            return $model->slug;
        }

        return Arr::get($model, 'slug') ??
            Arr::get($model, 'data.slug') ??
            Arr::get($model, 'post.slug') ??
            Arr::get($model, 'category.slug') ??
            '';
    }
}
