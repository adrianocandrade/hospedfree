@php
  $siteName = settings('branding.site_name');
  $title = 'Central de ajuda - ' . $siteName;
  $description = 'Tutoriais da HospedFree para publicar sites, configurar FTP, MySQL, SSL, domínios e resolver problemas comuns.';
  $url = url('/faq');
  $items = collect($articles['data'] ?? [])->map(fn ($article) => [
    '@type' => 'ListItem',
    'position' => 0,
    'url' => url('/faq/' . $article['slug']),
    'name' => $article['title'],
  ])->values()->all();
  foreach ($items as $index => &$item) {
    $item['position'] = $index + 1;
  }
  unset($item);
  $schema = [
    '@context' => 'https://schema.org',
    '@type' => 'CollectionPage',
    'name' => $title,
    'description' => $description,
    'url' => $url,
    'mainEntity' => [
      '@type' => 'ItemList',
      'itemListElement' => $items,
    ],
  ];
@endphp

<title>{{ $title }}</title>
<meta name="description" content="{{ $description }}" />
<meta property="og:site_name" content="{{ $siteName }}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="{{ $title }}" />
<meta property="og:description" content="{{ $description }}" />
<meta property="og:url" content="{{ $url }}" />
<meta name="twitter:card" content="summary" />
<link rel="canonical" href="{{ $url }}" />
<script type="application/ld+json">{!! json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
