<?php

namespace App\Blog\Controllers;

use App\Blog\Models\BlogCategory;
use App\Blog\Models\BlogPost;
use App\Blog\QueryBuilder\BlogPostsQueryBuilder;
use App\Blog\Resources\BlogCategoryResource;
use App\Blog\Resources\BlogPostResource;
use Common\Core\Rendering\RendersClientSideApp;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * @tags Blog
 */
class BlogPublicController extends Controller
{
    use RendersClientSideApp;

    /**
     * Show public blog index.
     *
     * @operationId showBlogIndex
     */
    public function index(Request $request)
    {
        return $this->clientSideOrPrerenderedResponse([
            'pageName' => 'blog-index',
            'loader' => 'blogIndex',
            'data' => $this->indexData($request),
        ]);
    }

    /**
     * Show public blog category.
     *
     * @operationId showBlogCategory
     */
    public function category(string $categorySlug, Request $request)
    {
        $category = BlogCategory::query()
            ->where('slug', $categorySlug)
            ->whereHas('publishedPosts')
            ->withCount('publishedPosts')
            ->firstOrFail();

        return $this->clientSideOrPrerenderedResponse([
            'pageName' => 'blog-category',
            'loader' => 'blogCategory',
            'data' => $this->categoryData($category, $request),
        ]);
    }

    /**
     * Show public blog post.
     *
     * @operationId showBlogPost
     */
    public function show(string $postSlug)
    {
        $post = BlogPost::query()
            ->published()
            ->with(['category', 'author'])
            ->where('slug', $postSlug)
            ->firstOrFail();

        return $this->clientSideOrPrerenderedResponse([
            'pageName' => 'blog-post',
            'loader' => 'blogPost',
            'data' => [
                'post' => (new BlogPostResource($post, 'show'))->resolve(),
            ],
        ]);
    }

    /**
     * List public blog posts.
     *
     * @operationId listPublicBlogPosts
     */
    public function apiIndex(Request $request)
    {
        $params = $request->validate([
            'query' => 'nullable|string',
            'per_page' => 'integer|min:1|max:30',
            'page' => 'integer|min:1',
            'sort' => 'string',
        ]);

        return BlogPostResource::collection(
            (new BlogPostsQueryBuilder($params, publicOnly: true))->paginate(),
        );
    }

    /**
     * List public blog categories.
     *
     * @operationId listPublicBlogCategories
     */
    public function apiCategories()
    {
        return BlogCategoryResource::collection($this->publicCategories());
    }

    /**
     * List public blog category posts.
     *
     * @operationId listPublicBlogCategoryPosts
     */
    public function apiCategory(string $categorySlug, Request $request)
    {
        $params = $request->validate([
            'query' => 'nullable|string',
            'per_page' => 'integer|min:1|max:30',
            'page' => 'integer|min:1',
            'sort' => 'string',
        ]);

        $category = BlogCategory::query()
            ->where('slug', $categorySlug)
            ->whereHas('publishedPosts')
            ->firstOrFail();

        return BlogPostResource::collection(
            (new BlogPostsQueryBuilder(
                [
                    ...$params,
                    'blog_category_id' => $category->id,
                ],
                publicOnly: true,
            ))->paginate(),
        );
    }

    /**
     * Retrieve a public blog post.
     *
     * @operationId retrievePublicBlogPost
     */
    public function apiShow(string $postSlug)
    {
        $post = BlogPost::query()
            ->published()
            ->with(['category', 'author'])
            ->where('slug', $postSlug)
            ->firstOrFail();

        return new BlogPostResource($post, 'show');
    }

    private function indexData(Request $request): array
    {
        $posts = (new BlogPostsQueryBuilder(
            $this->validatedPostListParams($request),
            publicOnly: true,
        ))->paginate();

        return [
            'posts' => BlogPostResource::collection($posts)
                ->response($request)
                ->getData(true),
            'categories' => BlogCategoryResource::collection(
                $this->publicCategories(),
            )
                ->response($request)
                ->getData(true),
        ];
    }

    private function categoryData(
        BlogCategory $category,
        Request $request,
    ): array {
        $posts = (new BlogPostsQueryBuilder(
            [
                ...$this->validatedPostListParams($request),
                'blog_category_id' => $category->id,
            ],
            publicOnly: true,
        ))->paginate();

        return [
            'category' => (new BlogCategoryResource($category))->resolve(),
            'posts' => BlogPostResource::collection($posts)
                ->response($request)
                ->getData(true),
            'categories' => BlogCategoryResource::collection(
                $this->publicCategories(),
            )
                ->response($request)
                ->getData(true),
        ];
    }

    private function publicCategories()
    {
        return BlogCategory::query()
            ->whereHas('publishedPosts')
            ->withCount('publishedPosts')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    private function validatedPostListParams(Request $request): array
    {
        return $request->validate([
            'query' => 'nullable|string',
            'per_page' => 'integer|min:1|max:30',
            'page' => 'integer|min:1',
            'sort' => 'string',
        ]);
    }
}
