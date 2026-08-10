<?php

namespace App\Blog\Actions;

use App\Blog\Models\BlogPost;
use Common\Files\Actions\SyncFileEntryModels;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class CrupdateBlogPost
{
    public function execute(BlogPost $post, array $data): BlogPost
    {
        if (!$post->exists) {
            $data['user_id'] = Auth::id();
            $data['slug'] = $data['slug'] ?? slugify(Arr::get($data, 'title'));
        }

        if (array_key_exists('body', $data)) {
            $data['body'] = app(SanitizeBlogHtml::class)->execute($data['body']);
        }

        if (empty($data['excerpt']) && !empty($data['body'])) {
            $data['excerpt'] = Str::limit(strip_tags($data['body']), 220);
        }

        if (
            ($data['status'] ?? $post->status) === BlogPost::STATUS_PUBLISHED &&
            empty($data['published_at']) &&
            !$post->published_at
        ) {
            $data['published_at'] = now();
        }

        $post->fill($data)->save();

        $syncer = new SyncFileEntryModels();

        if (array_key_exists('body', $data)) {
            $syncer->fromHtml($data['body'], $post->inlineImages());
        }

        if (array_key_exists('featured_image', $data)) {
            $syncer->fromUrl($data['featured_image'], $post->featuredImage());
        }

        return $post;
    }
}
