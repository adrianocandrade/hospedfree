<?php

namespace App\Blog\QueryBuilder;

use App\Blog\Models\BlogCategory;
use Common\Database\QueryBuilder\BaseQueryBuilder;
use Common\Database\QueryBuilder\Filter;
use Illuminate\Database\Eloquent\Builder;

class BlogCategoriesQueryBuilder extends BaseQueryBuilder
{
    protected string $model = BlogCategory::class;

    public function __construct(
        array $params,
        protected bool $publicOnly = false,
    ) {
        parent::__construct($params);
    }

    protected function getBaseBuilder(): Builder
    {
        $builder = BlogCategory::withCount(['posts', 'publishedPosts']);

        if ($this->publicOnly) {
            $builder->whereHas('publishedPosts');
        }

        return $builder;
    }

    protected function filterableFields(): array
    {
        return [...parent::filterableFields(), 'name', 'slug', 'is_archived'];
    }

    protected function defaultSort(): array
    {
        return ['sort_order' => 'asc'];
    }

    protected function transformSort(array $sort): array
    {
        return [...$sort, 'name' => 'asc'];
    }

    protected function applyFilter(Filter $filter): Builder
    {
        return match ($filter->key) {
            'name', 'slug' => $this->stringFilter($filter),
            'is_archived' => filter_var($filter->value, FILTER_VALIDATE_BOOL)
                ? $this->builder->onlyTrashed()
                : $this->builder->withoutTrashed(),
            'created_at', 'updated_at', 'deleted_at' => $this->simpleFilter(
                $filter,
            ),
        };
    }
}
