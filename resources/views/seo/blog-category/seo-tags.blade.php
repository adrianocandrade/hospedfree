@php
  $title = ($category['seo_title'] ?? null) ?: $category['name'];
  $fullTitle = $title . ' - ' . settings('branding.site_name');
  $description = ($category['seo_description'] ?? null) ?: ($category['description'] ?? null);
  $url = urls()->blogCategory($category);
  $postItems = $posts['data'] ?? [];
  $schema = [
    '@context' => 'https://schema.org',
    '@type' => 'CollectionPage',
    'name' => $title,
    'url' => $url,
    'description' => $description,
    'mainEntity' => collect($postItems)->take(10)->map(fn($post) => [
      '@type' => 'BlogPosting',
      'headline' => $post['title'] ?? null,
      'url' => urls()->blogPost($post),
      'datePublished' => $post['published_at'] ?? null,
    ])->values(),
  ];
@endphp

<meta property="og:site_name" content="{{ settings('branding.site_name') }}" />
<meta property="twitter:card" content="summary" />
<meta property="og:type" content="website" />
<title>{{ $fullTitle }}</title>
<meta property="og:title" content="{{ $fullTitle }}" />
<meta property="og:url" content="{{ $url }}" />
<link rel="canonical" href="{{ $url }}" />
@if ($description)
  <meta property="og:description" content="{{ $description }}" />
  <meta name="description" content="{{ $description }}" />
@endif
<script type="application/ld+json">{!! json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
