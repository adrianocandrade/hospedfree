<?php

namespace App\Knowledge\Controllers;

use App\Hosting\Support\AuthorizesHostingAdmin;
use App\Knowledge\Models\KnowledgeArticle;
use App\Knowledge\Models\KnowledgeCategory;
use App\Knowledge\Resources\KnowledgeArticleResource;
use App\Knowledge\Services\KnowledgeHtmlSanitizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminKnowledgeController
{
    use AuthorizesHostingAdmin;

    public function __construct(private KnowledgeHtmlSanitizer $sanitizer) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorizeHostingAdmin($request, 'knowledge.manage');
        return KnowledgeArticleResource::collection(
            KnowledgeArticle::query()->with('category')->latest()->paginate(30),
        );
    }

    public function categories(Request $request): JsonResponse
    {
        $this->authorizeHostingAdmin($request, 'knowledge.manage');
        return response()->json([
            'data' => KnowledgeCategory::query()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $this->authorizeHostingAdmin($request, 'knowledge.manage');
        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:1000'],
            'status' => ['nullable', Rule::in(['draft', 'published'])],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ]);
        $category = KnowledgeCategory::create([
            ...$data,
            'slug' => $this->uniqueSlug(KnowledgeCategory::class, $data['name']),
        ]);
        return response()->json($category, 201);
    }

    public function store(Request $request): KnowledgeArticleResource
    {
        $this->authorizeHostingAdmin($request, 'knowledge.manage');
        $data = $this->validateArticle($request);
        $data['title'] = trim(strip_tags($data['title']));
        $data['excerpt'] = isset($data['excerpt']) ? trim(strip_tags($data['excerpt'])) : null;
        $data['body'] = $this->sanitizer->sanitize($data['body']);
        $article = KnowledgeArticle::create([
            ...$data,
            'slug' => $this->uniqueSlug(KnowledgeArticle::class, $data['title']),
            'author_user_id' => $request->user()->id,
            'published_at' => ($data['status'] ?? 'draft') === 'published' ? now() : null,
        ]);
        return new KnowledgeArticleResource($article->load('category'));
    }

    public function update(Request $request, int $article): KnowledgeArticleResource
    {
        $this->authorizeHostingAdmin($request, 'knowledge.manage');
        $model = KnowledgeArticle::findOrFail($article);
        $data = $this->validateArticle($request, partial: true);
        if (isset($data['title'])) {
            $data['title'] = trim(strip_tags($data['title']));
        }
        if (array_key_exists('excerpt', $data)) {
            $data['excerpt'] = $data['excerpt'] ? trim(strip_tags($data['excerpt'])) : null;
        }
        if (isset($data['body'])) {
            $data['body'] = $this->sanitizer->sanitize($data['body']);
        }
        if (isset($data['title']) && $data['title'] !== $model->title) {
            $data['slug'] = $this->uniqueSlug(KnowledgeArticle::class, $data['title'], $model->id);
        }
        if (($data['status'] ?? null) === 'published' && !$model->published_at) {
            $data['published_at'] = now();
        }
        if (($data['status'] ?? null) === 'draft') {
            $data['published_at'] = null;
        }
        $model->update($data);
        return new KnowledgeArticleResource($model->load('category'));
    }

    public function destroy(Request $request, int $article): JsonResponse
    {
        $this->authorizeHostingAdmin($request, 'knowledge.manage');
        KnowledgeArticle::findOrFail($article)->delete();
        return response()->json(null, 204);
    }

    private function validateArticle(Request $request, bool $partial = false): array
    {
        $presence = $partial ? 'sometimes' : 'required';
        return $request->validate([
            'knowledge_category_id' => [$presence, 'integer', 'exists:knowledge_categories,id'],
            'title' => [$presence, 'string', 'max:200'],
            'excerpt' => ['nullable', 'string', 'max:1000'],
            'body' => [$presence, 'string', 'max:100000'],
            'status' => [$partial ? 'sometimes' : 'nullable', Rule::in(['draft', 'published'])],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);
    }

    private function uniqueSlug(string $model, string $value, ?int $ignoreId = null): string
    {
        $base = Str::slug($value) ?: 'article';
        $slug = $base;
        $suffix = 2;
        while ($model::query()->where('slug', $slug)->when($ignoreId, fn($query) => $query->whereKeyNot($ignoreId))->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }
        return $slug;
    }
}
