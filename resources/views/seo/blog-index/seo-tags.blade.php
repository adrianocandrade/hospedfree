@php
  $title = 'Blog - ' . settings('branding.site_name');
  $description = 'Guias e novidades sobre presenca digital, links, QR codes e analytics.';
  $url = urls()->blogIndex();
  $postItems = $posts['data'] ?? [];
  $schema = [
    '@context' => 'https://schema.org',
    '@type' => 'Blog',
    'name' => settings('branding.site_name') . ' Blog',
    'url' => $url,
    'description' => $description,
    'blogPost' => collect($postItems)->take(10)->map(fn($post) => [
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
<title>{{ $title }}</title>
<meta property="og:title" content="{{ $title }}" />
<meta property="og:url" content="{{ $url }}" />
<link rel="canonical" href="{{ $url }}" />
<meta property="og:description" content="{{ $description }}" />
<meta name="description" content="{{ $description }}" />
<script type="application/ld+json">{!! json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
