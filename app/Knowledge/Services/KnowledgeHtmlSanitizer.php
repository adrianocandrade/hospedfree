<?php

namespace App\Knowledge\Services;

use HTMLPurifier;
use HTMLPurifier_Config;
use Illuminate\Support\Facades\File;

class KnowledgeHtmlSanitizer
{
    public function sanitize(?string $html): string
    {
        if (!$html) {
            return '';
        }

        File::ensureDirectoryExists(storage_path('app/htmlpurifier'));
        $config = HTMLPurifier_Config::createDefault();
        $config->set('Cache.SerializerPath', storage_path('app/htmlpurifier'));
        $config->set('HTML.Allowed', implode(',', [
            'a[href|title|target|rel]',
            'blockquote',
            'br',
            'code',
            'em',
            'h2',
            'h3',
            'h4',
            'hr',
            'li',
            'ol',
            'p',
            'pre',
            'strong',
            'table',
            'tbody',
            'td[colspan|rowspan]',
            'th[colspan|rowspan]',
            'thead',
            'tr',
            'ul',
        ]));
        $config->set('Attr.AllowedFrameTargets', ['_blank']);
        $config->set('URI.AllowedSchemes', [
            'http' => true,
            'https' => true,
            'mailto' => true,
        ]);
        $config->set('HTML.Nofollow', true);
        $config->set('HTML.TargetBlank', true);

        return (new HTMLPurifier($config))->purify($html);
    }
}
