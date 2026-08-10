<?php

namespace App\Blog\QueryBuilder;

use App\Blog\Models\BlogPost;
use Common\Database\QueryBuilder\BaseQueryBuilder;
use Common\Database\QueryBuilder\Filter;
use Illuminate\Database\Eloquent\Builder;

class BlogPostsQueryBuilder extends BaseQueryBuilder
{
    protected string $model = BlogPost::class;

    public function __construct(
        array $params,
        protected bool $publicOnly = false,
    ) {
        parent::__construct($params);
    }

    protected function getBaseBuilder(): Builder
    {
        $builder = BlogPost::with(['category', 'author']);

        if ($this->publicOnly) {
            $builder->published();
        }

        return $builder;
    }

    protected function filterableFields(): array
    {
        return [
            ...parent::filterableFields(),
            'title',
            'slug',
            'category_slug',
            'is_archived',
        ];
    }

    protected function defaultSort(): array
    {
        return $this->publicOnly
            ? ['published_at' => 'desc']
            : ['created_at' => 'desc'];
    }

    protected function transformSort(array $sort): array
    {
        return [...$sort, 'id' => 'desc'];
    }

    protected function applyFilter(Filter $filter): Builder
    {
        return match ($filter->key) {
            'title', 'slug', 'status' => $this->stringFilter($filter),
            'blog_category_id',
            'user_id',
            'published_at',
            'created_at',
            'updated_at',
            'deleted_at' => $this->simpleFilter($filter),
            'category_slug' => $this->builder->whereHas(
                'category',
                fn(Builder $builder) => $builder->where('slug', $filter->value),
            ),
            'is_archived' => filter_var($filter->value, FILTER_VALIDATE_BOOL)
                ? $this->builder->onlyTrashed()
                : $this->builder->withoutTrashed(),
        };
    }
}
