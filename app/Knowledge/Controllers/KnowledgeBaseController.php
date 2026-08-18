<?php

namespace App\Knowledge\Controllers;

use App\Knowledge\Models\KnowledgeArticle;
use App\Knowledge\Resources\KnowledgeArticleResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class KnowledgeBaseController
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $data = $request->validate([
            'query' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:180'],
        ]);

        $articles = KnowledgeArticle::query()
            ->published()
            ->with('category')
            ->when($data['query'] ?? null, function ($query, string $search): void {
                $escaped = addcslashes($search, '%_');
                $query->where(function ($query) use ($escaped): void {
                    $query->where('title', 'like', "%{$escaped}%")
                        ->orWhere('excerpt', 'like', "%{$escaped}%")
                        ->orWhere('body', 'like', "%{$escaped}%");
                });
            })
            ->when($data['category'] ?? null, fn($query, $slug) => $query->whereHas(
                'category',
                fn($query) => $query->where('slug', $slug),
            ))
            ->orderBy('sort_order')
            ->latest('published_at')
            ->paginate(20);

        return KnowledgeArticleResource::collection($articles);
    }

    public function show(string $article): KnowledgeArticleResource
    {
        $model = KnowledgeArticle::query()
            ->published()
            ->with('category')
            ->where('slug', $article)
            ->firstOrFail();

        return new KnowledgeArticleResource($model);
    }
}
