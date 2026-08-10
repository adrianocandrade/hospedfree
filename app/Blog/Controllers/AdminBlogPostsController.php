<?php

namespace App\Blog\Controllers;

use App\Blog\Actions\CrupdateBlogPost;
use App\Blog\Models\BlogPost;
use App\Blog\QueryBuilder\BlogPostsQueryBuilder;
use App\Blog\Requests\CrupdateBlogPostRequest;
use App\Blog\Resources\BlogPostResource;
use Common\Core\Demo\BlockedOnDemoSite;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;

/**
 * @tags Blog, Admin
 */
class AdminBlogPostsController extends Controller
{
    /**
     * List blog posts.
     *
     * @operationId listBlogPosts
     */
    public function index(Request $request)
    {
        Gate::authorize('index', BlogPost::class);

        $data = $request->validate([
            'query' => 'nullable|string',
            'per_page' => 'integer|min:1|max:100',
            'page' => 'integer|min:1',
            'sort' => 'string',
            'status' => 'string',
            'blog_category_id' => 'integer',
            'is_archived' => 'string',
            'created_at' => 'string',
            'updated_at' => 'string',
            'published_at' => 'string',
        ]);

        return BlogPostResource::collection(
            (new BlogPostsQueryBuilder($data))->paginate(),
        );
    }

    /**
     * Retrieve a blog post.
     *
     * @operationId retrieveBlogPost
     */
    public function show(int $id)
    {
        $post = BlogPost::with(['category', 'author'])->findOrFail($id);

        Gate::authorize('show', $post);

        return new BlogPostResource($post, 'show');
    }

    /**
     * Create a blog post.
     *
     * @operationId createBlogPost
     */
    #[BlockedOnDemoSite]
    public function store(CrupdateBlogPostRequest $request)
    {
        Gate::authorize('store', BlogPost::class);

        $post = (new CrupdateBlogPost())->execute(
            new BlogPost(),
            $request->validated(),
        );

        $post->load(['category', 'author']);

        return new BlogPostResource($post, 'show');
    }

    /**
     * Update a blog post.
     *
     * @operationId updateBlogPost
     */
    #[BlockedOnDemoSite]
    public function update(int $id, CrupdateBlogPostRequest $request)
    {
        $post = BlogPost::findOrFail($id);

        Gate::authorize('update', $post);

        $post = (new CrupdateBlogPost())->execute($post, $request->validated());
        $post->load(['category', 'author']);

        return new BlogPostResource($post, 'show');
    }

    /**
     * Delete a blog post.
     *
     * @operationId deleteBlogPost
     */
    #[BlockedOnDemoSite]
    public function destroy(int $id)
    {
        $post = BlogPost::findOrFail($id);

        Gate::authorize('destroy', $post);

        $post->inlineImages()->detach();
        $post->featuredImage()->detach();
        $post->delete();

        return response()->noContent();
    }
}
