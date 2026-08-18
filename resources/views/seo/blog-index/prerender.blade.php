@extends('common::prerender.base')

@section('head')
  {!! $seoTags !!}
@endsection

@section('body')
  <main>
    <h1>Blog</h1>
    <p>Guias práticos sobre hospedagem, domínios, arquivos, bancos MySQL, SSL e publicação de sites.</p>

    @if (!empty($categories['data']))
      <nav>
        <a href="{{ urls()->blogIndex() }}">Todos os posts</a>
        @foreach ($categories['data'] as $category)
          <a href="{{ urls()->blogCategory($category) }}">{{ $category['name'] }}</a>
        @endforeach
      </nav>
    @endif

    @if (!empty($posts['data']))
      <section>
        @foreach ($posts['data'] as $post)
          <article>
            <h2><a href="{{ urls()->blogPost($post) }}">{{ $post['title'] }}</a></h2>
            @isset ($post['excerpt'])
              <p>{{ $post['excerpt'] }}</p>
            @endisset
          </article>
        @endforeach
      </section>
    @endif
  </main>
@endsection
