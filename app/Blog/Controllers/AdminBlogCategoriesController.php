<?php

namespace App\Blog\Controllers;

use App\Blog\Actions\CrupdateBlogCategory;
use App\Blog\Models\BlogCategory;
use App\Blog\QueryBuilder\BlogCategoriesQueryBuilder;
use App\Blog\Requests\CrupdateBlogCategoryRequest;
use App\Blog\Resources\BlogCategoryResource;
use Common\Core\Demo\BlockedOnDemoSite;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

/**
 * @tags Blog, Admin
 */
class AdminBlogCategoriesController extends Controller
{
    /**
     * List blog categories.
     *
     * @operationId listBlogCategories
     */
    public function index(Request $request)
    {
        Gate::authorize('index', BlogCategory::class);

        $data = $request->validate([
            'query' => 'nullable|string',
            'per_page' => 'integer|min:1|max:100',
            'page' => 'integer|min:1',
            'sort' => 'string',
            'is_archived' => 'string',
            'created_at' => 'string',
            'updated_at' => 'string',
        ]);

        return BlogCategoryResource::collection(
            (new BlogCategoriesQueryBuilder($data))->paginate(),
        );
    }

    /**
     * Retrieve a blog category.
     *
     * @operationId retrieveBlogCategory
     */
    public function show(int $id)
    {
        $category = BlogCategory::withCount([
            'posts',
            'publishedPosts',
        ])->findOrFail($id);

        Gate::authorize('show', $category);

        return new BlogCategoryResource($category);
    }

    /**
     * Create a blog category.
     *
     * @operationId createBlogCategory
     */
    #[BlockedOnDemoSite]
    public function store(CrupdateBlogCategoryRequest $request)
    {
        Gate::authorize('store', BlogCategory::class);

        $category = (new CrupdateBlogCategory())->execute(
            new BlogCategory(),
            $request->validated(),
        );

        return new BlogCategoryResource($category);
    }

    /**
     * Update a blog category.
     *
     * @operationId updateBlogCategory
     */
    #[BlockedOnDemoSite]
    public function update(int $id, CrupdateBlogCategoryRequest $request)
    {
        $category = BlogCategory::findOrFail($id);

        Gate::authorize('update', $category);

        $category = (new CrupdateBlogCategory())->execute(
            $category,
            $request->validated(),
        );

        return new BlogCategoryResource($category);
    }

    /**
     * Delete a blog category.
     *
     * @operationId deleteBlogCategory
     */
    #[BlockedOnDemoSite]
    public function destroy(int $id)
    {
        $category = BlogCategory::findOrFail($id);

        Gate::authorize('destroy', $category);

        if ($category->posts()->exists()) {
            throw ValidationException::withMessages([
                'category' => __(
                    'Move or delete posts in this category before deleting it.',
                ),
            ]);
        }

        $category->delete();

        return response()->noContent();
    }
}
