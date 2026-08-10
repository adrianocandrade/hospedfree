<?php

namespace App\Biolinks\Support;

use DOMDocument;
use DOMElement;
use DOMNode;
use Illuminate\Support\Str;

class BiolinkTextSanitizer
{
    private const ALLOWED_TAGS = [
        'b',
        'br',
        'em',
        'i',
        'p',
        'strong',
        'u',
    ];

    private const BLOCKED_TAGS = [
        'embed',
        'iframe',
        'math',
        'object',
        'script',
        'style',
        'svg',
    ];

    public function sanitize(mixed $html): string
    {
        if (!is_string($html)) {
            return '';
        }

        $html = trim($html);
        if ($html === '') {
            return '';
        }

        $html = Str::limit($html, 5000, '');
        // libxml may treat an HTML fragment as ISO-8859-1 even when the
        // document declares UTF-8. Encoding non-ASCII characters as entities
        // keeps accents intact while the sanitizer walks the DOM.
        $htmlForParser = function_exists('mb_encode_numericentity')
            ? mb_encode_numericentity($html, [0x80, 0x10ffff, 0, 0xffff], 'UTF-8')
            : $html;

        $document = new DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);
        $document->loadHTML(
            '<?xml encoding="UTF-8"?><!doctype html><html><head><meta charset="UTF-8"></head><body><div>' .
                $htmlForParser .
                '</div></body></html>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD,
        );
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $container = $document->getElementsByTagName('div')->item(0);
        if (!$container) {
            return '';
        }

        $output = '';
        foreach ($container->childNodes as $child) {
            $output .= $this->sanitizeNode($child);
        }

        return trim($output);
    }

    private function sanitizeNode(DOMNode $node): string
    {
        if ($node->nodeType === XML_TEXT_NODE) {
            return e($node->textContent);
        }

        if (!$node instanceof DOMElement) {
            return '';
        }

        $tag = Str::lower($node->tagName);
        if (in_array($tag, self::BLOCKED_TAGS, true)) {
            return '';
        }

        $children = '';
        foreach ($node->childNodes as $child) {
            $children .= $this->sanitizeNode($child);
        }

        if (!in_array($tag, self::ALLOWED_TAGS, true)) {
            return $children;
        }

        if ($tag === 'br') {
            return '<br>';
        }

        return "<$tag>$children</$tag>";
    }
}
