@php
  $siteName = settings('branding.site_name');
  $title = $article['title'] . ' - ' . $siteName;
  $description = $article['seo_description'] ?: $article['title'];
  $url = url('/faq/' . $article['slug']);
  $schema = array_filter([
    '@context' => 'https://schema.org',
    '@type' => 'TechArticle',
    'headline' => $article['title'],
    'description' => $description,
    'url' => $url,
    'datePublished' => $article['published_at'] ?? null,
    'dateModified' => $article['updated_at'] ?? null,
    'publisher' => [
      '@type' => 'Organization',
      'name' => $siteName,
    ],
    'mainEntityOfPage' => [
      '@type' => 'WebPage',
      '@id' => $url,
    ],
  ]);
@endphp

<title>{{ $title }}</title>
<meta name="description" content="{{ $description }}" />
<meta property="og:site_name" content="{{ $siteName }}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="{{ $title }}" />
<meta property="og:description" content="{{ $description }}" />
<meta property="og:url" content="{{ $url }}" />
<meta name="twitter:card" content="summary" />
<link rel="canonical" href="{{ $url }}" />
@isset ($article['published_at'])
  <meta property="article:published_time" content="{{ $article['published_at'] }}" />
@endisset
@isset ($article['updated_at'])
  <meta property="article:modified_time" content="{{ $article['updated_at'] }}" />
@endisset
<script type="application/ld+json">{!! json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
