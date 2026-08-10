<?php

namespace App\Core;

use App\Blog\Models\BlogCategory;
use App\Blog\Models\BlogPost;
use Common\Admin\Sitemap\BaseSitemapGenerator;

class SitemapGenerator extends BaseSitemapGenerator
{
    protected function getAppQueries(): array
    {
        return [
            BlogCategory::query()
                ->select(['id', 'name', 'slug', 'updated_at'])
                ->whereHas('publishedPosts'),
            BlogPost::query()
                ->published()
                ->select(['id', 'title', 'slug', 'updated_at']),
        ];
    }

    protected function getAppStaticUrls(): array
    {
        $lastUpdated =
            BlogPost::query()->published()->max('updated_at') ?:
            $this->currentDateTimeString;

        return [
            [
                'path' => 'blog',
                'updated_at' => $lastUpdated,
            ],
        ];
    }
}
