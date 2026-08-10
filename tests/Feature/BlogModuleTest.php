<?php

namespace Tests\Feature;

use App\Blog\Models\BlogCategory;
use App\Blog\Models\BlogPost;
use App\Core\SitemapGenerator;
use App\Models\User;
use Common\Auth\Middleware\OptionalAuthenticate;
use Common\Auth\Middleware\VerifyApiAccessMiddleware;
use Common\Core\Rendering\CrawlerDetector;
use Common\Permissions\Models\Permission;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class BlogModuleTest extends TestCase
{
    private string $publicPath;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');
        DB::reconnect('sqlite');

        $this->publicPath = base_path('tmp/testing-public');
        File::ensureDirectoryExists($this->publicPath);
        $this->app->usePublicPath($this->publicPath);
        $this->app['router']->aliasMiddleware(
            'optionalAuth',
            OptionalAuthenticate::class,
        );
        $this->app['router']->aliasMiddleware(
            'verifyApiAccess',
            VerifyApiAccessMiddleware::class,
        );

        $this->createSchema();
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->publicPath);

        parent::tearDown();
    }

    public function test_admin_blog_requires_blog_permission(): void
    {
        $this->actingAs($this->userWithPermissions(['api.access']), 'sanctum');

        $this->getJson('/api/v1/admin/blog/posts')->assertForbidden();
    }

    public function test_admin_can_create_update_and_delete_blog_post(): void
    {
        $category = $this->createCategory([
            'name' => 'Marketing',
            'slug' => 'marketing',
        ]);
        $this->actingAs($this->adminUser(), 'sanctum');

        $createResponse = $this
            ->postJson('/api/v1/admin/blog/posts', [
                'blog_category_id' => $category->id,
                'title' => 'Primeiro post',
                'slug' => 'primeiro-post',
                'excerpt' => 'Resumo do post',
                'body' => '<p>Conteudo publicado</p>',
                'status' => BlogPost::STATUS_DRAFT,
                'published_at' => null,
            ])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'primeiro-post');

        $postId = $createResponse->json('data.id');

        $this
            ->postJson('/api/v1/admin/blog/posts', [
                'blog_category_id' => $category->id,
                'title' => 'Slug duplicado',
                'slug' => 'primeiro-post',
                'body' => '<p>Outro conteudo</p>',
                'status' => BlogPost::STATUS_DRAFT,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('slug');

        $this
            ->putJson("/api/v1/admin/blog/posts/$postId", [
                'blog_category_id' => $category->id,
                'title' => 'Primeiro post atualizado',
                'slug' => 'primeiro-post-atualizado',
                'excerpt' => 'Resumo atualizado',
                'body' => '<p>Conteudo atualizado</p>',
                'status' => BlogPost::STATUS_PUBLISHED,
                'published_at' => now()->subMinute()->toISOString(),
            ])
            ->assertOk()
            ->assertJsonPath('data.status', BlogPost::STATUS_PUBLISHED)
            ->assertJsonPath('data.slug', 'primeiro-post-atualizado');

        $this
            ->deleteJson("/api/v1/admin/blog/posts/$postId")
            ->assertNoContent();

        $this->assertSoftDeleted('blog_posts', ['id' => $postId]);
    }

    public function test_public_api_only_returns_published_posts_due_now(): void
    {
        $category = $this->createCategory();
        $published = $this->createPost([
            'blog_category_id' => $category->id,
            'slug' => 'publicado',
            'title' => 'Post publicado',
            'status' => BlogPost::STATUS_PUBLISHED,
            'published_at' => now()->subDay(),
        ]);
        $draft = $this->createPost([
            'blog_category_id' => $category->id,
            'slug' => 'rascunho',
            'title' => 'Post rascunho',
        ]);
        $scheduled = $this->createPost([
            'blog_category_id' => $category->id,
            'slug' => 'agendado',
            'title' => 'Post agendado',
            'status' => BlogPost::STATUS_PUBLISHED,
            'published_at' => now()->addDay(),
        ]);

        $this
            ->getJson('/api/v1/blog/posts')
            ->assertOk()
            ->assertJsonFragment(['slug' => $published->slug])
            ->assertJsonMissing(['slug' => $draft->slug])
            ->assertJsonMissing(['slug' => $scheduled->slug]);

        $this->getJson("/api/v1/blog/posts/$published->slug")->assertOk();
        $this->getJson("/api/v1/blog/posts/$draft->slug")->assertNotFound();
        $this
            ->getJson("/api/v1/blog/posts/$scheduled->slug")
            ->assertNotFound();
    }

    public function test_public_blog_post_page_renders_seo_tags(): void
    {
        $category = $this->createCategory();
        $this->createPost([
            'blog_category_id' => $category->id,
            'slug' => 'post-publico',
            'title' => 'Post publico',
            'status' => BlogPost::STATUS_PUBLISHED,
            'published_at' => now()->subDay(),
        ]);

        $this->app->instance(
            CrawlerDetector::class,
            new class extends CrawlerDetector {
                public function isCrawler(): bool
                {
                    return true;
                }
            },
        );

        $this
            ->get('/blog/post-publico')
            ->assertOk()
            ->assertSee('Post publico', false)
            ->assertSee('/blog/post-publico', false);
    }

    public function test_sitemap_includes_blog_and_published_resources_only(): void
    {
        $publishedCategory = $this->createCategory([
            'slug' => 'conteudo',
        ]);
        $draftOnlyCategory = $this->createCategory([
            'slug' => 'rascunhos',
        ]);
        $this->createPost([
            'blog_category_id' => $publishedCategory->id,
            'slug' => 'post-no-sitemap',
            'status' => BlogPost::STATUS_PUBLISHED,
            'published_at' => now()->subDay(),
        ]);
        $this->createPost([
            'blog_category_id' => $draftOnlyCategory->id,
            'slug' => 'draft-fora-sitemap',
        ]);
        $this->createPost([
            'blog_category_id' => $publishedCategory->id,
            'slug' => 'future-fora-sitemap',
            'status' => BlogPost::STATUS_PUBLISHED,
            'published_at' => now()->addDay(),
        ]);

        (new SitemapGenerator())->generate();

        $staticMap = File::get(
            public_path('storage/sitemaps/static-urls-sitemap.xml'),
        );
        $categoryMap = File::get(
            public_path('storage/sitemaps/blog-categories-sitemap-0.xml'),
        );
        $postMap = File::get(
            public_path('storage/sitemaps/blog-posts-sitemap-0.xml'),
        );

        $this->assertStringContainsString('http://localhost/blog', $staticMap);
        $this->assertStringContainsString(
            'http://localhost/blog/categoria/conteudo',
            $categoryMap,
        );
        $this->assertStringNotContainsString('rascunhos', $categoryMap);
        $this->assertStringContainsString(
            'http://localhost/blog/post-no-sitemap',
            $postMap,
        );
        $this->assertStringNotContainsString('draft-fora-sitemap', $postMap);
        $this->assertStringNotContainsString('future-fora-sitemap', $postMap);
    }

    public function test_blog_body_is_sanitized_before_public_response(): void
    {
        $category = $this->createCategory();
        $this->actingAs($this->adminUser(), 'sanctum');

        $response = $this
            ->postJson('/api/v1/admin/blog/posts', [
                'blog_category_id' => $category->id,
                'title' => 'Post seguro',
                'slug' => 'post-seguro',
                'body' =>
                    '<p onclick="alert(1)">Texto seguro</p><script>alert(1)</script><a href="javascript:alert(1)">link</a>',
                'status' => BlogPost::STATUS_PUBLISHED,
                'published_at' => now()->subMinute()->toISOString(),
            ])
            ->assertCreated();

        $this->assertStringNotContainsString(
            '<script',
            $response->json('data.body'),
        );
        $this->assertStringNotContainsString(
            'onclick',
            $response->json('data.body'),
        );
        $this->assertStringNotContainsString(
            'javascript:',
            $response->json('data.body'),
        );

        $this
            ->getJson('/api/v1/blog/posts/post-seguro')
            ->assertOk()
            ->assertJsonPath('data.slug', 'post-seguro')
            ->assertJsonMissing(['body' => '<script>alert(1)</script>']);
    }

    private function adminUser(): User
    {
        return $this->userWithPermissions(['api.access', 'blog.update']);
    }

    private function userWithPermissions(array $permissionNames): User
    {
        $user = User::query()->create([
            'name' => 'Admin',
            'email' => 'user-' . str_replace('.', '', uniqid('', true)) . '@example.com',
            'email_verified_at' => now(),
            'password' => 'password',
        ]);

        $permissions = collect($permissionNames)->map(
            fn(string $name) => Permission::query()->create([
                'name' => $name,
                'group' => 'tests',
            ]),
        );

        $user->setRelation('permissions', $permissions);
        $user->setRelation('roles', collect());

        return $user;
    }

    private function createCategory(array $attributes = []): BlogCategory
    {
        $suffix = str_replace('.', '', uniqid('', true));

        return BlogCategory::query()->create([
            'name' => $attributes['name'] ?? "Category $suffix",
            'slug' => $attributes['slug'] ?? "category-$suffix",
            'description' => $attributes['description'] ?? null,
            'seo_title' => $attributes['seo_title'] ?? null,
            'seo_description' => $attributes['seo_description'] ?? null,
            'sort_order' => $attributes['sort_order'] ?? 0,
        ]);
    }

    private function createPost(array $attributes = []): BlogPost
    {
        $suffix = str_replace('.', '', uniqid('', true));
        $categoryId =
            $attributes['blog_category_id'] ?? $this->createCategory()->id;
        $userId = $attributes['user_id'] ?? $this->createAuthor()->id;

        return BlogPost::query()->create([
            'blog_category_id' => $categoryId,
            'user_id' => $userId,
            'title' => $attributes['title'] ?? "Post $suffix",
            'slug' => $attributes['slug'] ?? "post-$suffix",
            'excerpt' => $attributes['excerpt'] ?? 'Resumo do post',
            'body' => $attributes['body'] ?? '<p>Conteudo do post</p>',
            'featured_image' => $attributes['featured_image'] ?? null,
            'seo_title' => $attributes['seo_title'] ?? null,
            'seo_description' => $attributes['seo_description'] ?? null,
            'status' => $attributes['status'] ?? BlogPost::STATUS_DRAFT,
            'published_at' => $attributes['published_at'] ?? null,
        ]);
    }

    private function createAuthor(): User
    {
        return User::query()->create([
            'name' => 'Author',
            'email' =>
                'author-' . str_replace('.', '', uniqid('', true)) . '@example.com',
            'email_verified_at' => now(),
            'password' => 'password',
        ]);
    }

    private function createSchema(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('username')->nullable();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable();
            $table->string('image')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name', 30)->unique();
            $table->string('group', 30);
            $table->timestamps();
        });

        Schema::create('permissionables', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('permission_id')->index();
            $table->unsignedInteger('permissionable_id')->index();
            $table->string('permissionable_type', 40)->index();
            $table->text('restrictions')->nullable();
            $table->unique(
                ['permission_id', 'permissionable_id', 'permissionable_type'],
                'permissionable_unique',
            );
        });

        Schema::create('user_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->index();
            $table->string('browser')->nullable();
            $table->string('platform')->nullable();
            $table->string('device')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->timestamps();
        });

        Schema::create('blog_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 120)->unique();
            $table->text('description')->nullable();
            $table->string('seo_title', 160)->nullable();
            $table->string('seo_description', 320)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('blog_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('blog_category_id')->nullable();
            $table->foreignId('user_id');
            $table->string('title', 200);
            $table->string('slug', 220)->unique();
            $table->text('excerpt')->nullable();
            $table->longText('body');
            $table->string('featured_image', 2048)->nullable();
            $table->string('seo_title', 160)->nullable();
            $table->string('seo_description', 320)->nullable();
            $table->string('status', 20)->default(BlogPost::STATUS_DRAFT);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('custom_pages', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            $table->string('slug')->nullable();
            $table->longText('body')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('file_entry_models', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('file_entry_id')->index();
            $table->unsignedInteger('model_id')->index();
            $table->string('model_type')->index();
            $table->string('tag')->nullable();
            $table->boolean('owner')->default(false);
            $table->string('permissions')->nullable();
            $table->timestamps();
        });
    }
}
