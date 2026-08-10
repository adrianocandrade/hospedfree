@extends('common::prerender.base')

@section('head')
  {!! $seoTags !!}
@endsection

@section('body')
  <article>
    <a href="{{ urls()->blogIndex() }}">Blog</a>
    @if (!empty($post['category']))
      <a href="{{ urls()->blogCategory($post['category']) }}">{{ $post['category']['name'] }}</a>
    @endif
    <h1>{{ $post['title'] }}</h1>
    @isset ($post['excerpt'])
      <p>{{ $post['excerpt'] }}</p>
    @endisset
    @isset ($post['featured_image'])
      <img src="{{ $post['featured_image'] }}" alt="" />
    @endisset
    <main>
      {!! $post['body'] ?? '' !!}
    </main>
  </article>
@endsection
