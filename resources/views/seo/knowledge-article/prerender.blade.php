@extends('common::prerender.base')

@section('head')
  {!! $seoTags !!}
@endsection

@section('body')
  <article>
    <a href="{{ url('/faq') }}">Central de ajuda</a>
    @if (!empty($article['category']))
      <p>{{ $article['category']['name'] }}</p>
    @endif
    <h1>{{ $article['title'] }}</h1>
    @if (!empty($article['excerpt']))
      <p>{{ $article['excerpt'] }}</p>
    @endif
    <main>{!! $article['body'] !!}</main>
  </article>
@endsection
