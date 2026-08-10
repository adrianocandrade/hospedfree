@php
  $title = ($post['seo_title'] ?? null) ?: $post['title'];
  $fullTitle = $title . ' - ' . settings('branding.site_name');
  $description = ($post['seo_description'] ?? null) ?: ($post['excerpt'] ?? null);
  $url = urls()->blogPost($post);
  $image = $post['featured_image'] ?? null;
  $author = $post['author']['name'] ?? settings('branding.site_name');
  $schema = array_filter([
    '@context' => 'https://schema.org',
    '@type' => 'BlogPosting',
    'headline' => $post['title'] ?? null,
    'description' => $description,
    'image' => $image ? [$image] : null,
    'url' => $url,
    'datePublished' => $post['published_at'] ?? null,
    'dateModified' => $post['updated_at'] ?? null,
    'author' => [
      '@type' => 'Person',
      'name' => $author,
    ],
    'publisher' => [
      '@type' => 'Organization',
      'name' => settings('branding.site_name'),
    ],
    'mainEntityOfPage' => [
      '@type' => 'WebPage',
      '@id' => $url,
    ],
  ]);
@endphp

<meta property="og:site_name" content="{{ settings('branding.site_name') }}" />
<meta property="twitter:card" content="{{ $image ? 'summary_large_image' : 'summary' }}" />
<meta property="og:type" content="article" />
<title>{{ $fullTitle }}</title>
<meta property="og:title" content="{{ $fullTitle }}" />
<meta property="og:url" content="{{ $url }}" />
<link rel="canonical" href="{{ $url }}" />
@if ($description)
  <meta property="og:description" content="{{ $description }}" />
  <meta name="description" content="{{ $description }}" />
@endif
@if ($image)
  <meta property="og:image" content="{{ $image }}" />
  <meta property="twitter:image" content="{{ $image }}" />
@endif
@isset ($post['published_at'])
  <meta property="article:published_time" content="{{ $post['published_at'] }}" />
@endisset
@isset ($post['updated_at'])
  <meta property="article:modified_time" content="{{ $post['updated_at'] }}" />
@endisset
<script type="application/ld+json">{!! json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
