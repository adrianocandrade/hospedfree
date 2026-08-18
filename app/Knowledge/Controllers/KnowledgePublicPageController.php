<?php

namespace App\Knowledge\Controllers;

use App\Knowledge\Models\KnowledgeArticle;
use App\Knowledge\Resources\KnowledgeArticleResource;
use Common\Core\Rendering\RendersClientSideApp;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

class KnowledgePublicPageController extends Controller
{
    use RendersClientSideApp;

    public function index(Request $request)
    {
        $articles = KnowledgeArticle::query()
            ->published()
            ->with('category')
            ->orderBy('sort_order')
            ->latest('published_at')
            ->paginate(100);

        return $this->clientSideOrPrerenderedResponse([
            'pageName' => 'knowledge-index',
            'loader' => 'knowledgeIndex',
            'data' => [
                'articles' => KnowledgeArticleResource::collection($articles)
                    ->response($request)
                    ->getData(true),
            ],
        ]);
    }

    public function show(string $article, Request $request)
    {
        $model = KnowledgeArticle::query()
            ->published()
            ->with('category')
            ->where('slug', $article)
            ->firstOrFail();
        $payload = (new KnowledgeArticleResource($model))->resolve($request);
        $payload['seo_description'] = Str::limit(
            trim((string) ($model->excerpt ?: strip_tags($model->body))),
            155,
            '…',
        );

        return $this->clientSideOrPrerenderedResponse([
            'pageName' => 'knowledge-article',
            'loader' => 'knowledgeArticle',
            'data' => ['article' => $payload],
        ]);
    }
}
