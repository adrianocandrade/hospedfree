@extends('common::prerender.base')

@section('head')
  {!! $seoTags !!}
@endsection

@section('body')
  <main>
    <h1>{{ $category['name'] }}</h1>
    @isset ($category['description'])
      <p>{{ $category['description'] }}</p>
    @endisset

    @if (!empty($categories['data']))
      <nav>
        <a href="{{ urls()->blogIndex() }}">Todos os posts</a>
        @foreach ($categories['data'] as $item)
          <a href="{{ urls()->blogCategory($item) }}">{{ $item['name'] }}</a>
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
