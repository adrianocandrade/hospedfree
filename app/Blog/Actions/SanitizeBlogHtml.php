<?php

namespace App\Blog\Actions;

use HTMLPurifier;
use HTMLPurifier_Config;
use Illuminate\Support\Facades\File;

class SanitizeBlogHtml
{
    public function execute(string|null $html): string
    {
        if (!$html) {
            return '';
        }

        File::ensureDirectoryExists(storage_path('app/htmlpurifier'));

        $config = HTMLPurifier_Config::createDefault();
        $config->set('Cache.SerializerPath', storage_path('app/htmlpurifier'));
        $config->set(
            'HTML.Allowed',
            implode(',', [
                'a[href|title|target|rel]',
                'b',
                'blockquote',
                'br',
                'code',
                'div[class]',
                'em',
                'h1',
                'h2',
                'h3',
                'h4',
                'h5',
                'h6',
                'hr',
                'i',
                'img[src|alt|title|width|height]',
                'li',
                'ol',
                'p',
                'pre',
                's',
                'span[style]',
                'strong',
                'sub',
                'sup',
                'table',
                'tbody',
                'td[colspan|rowspan]',
                'th[colspan|rowspan]',
                'thead',
                'tr',
                'u',
                'ul',
            ]),
        );
        $config->set('CSS.AllowedProperties', [
            'background-color',
            'color',
            'text-align',
        ]);
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
