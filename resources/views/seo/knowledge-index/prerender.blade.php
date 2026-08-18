@extends('common::prerender.base')

@section('head')
  {!! $seoTags !!}
@endsection

@section('body')
  <main>
    <h1>Central de ajuda</h1>
    <p>Encontre orientações para publicar e manter sua hospedagem.</p>
    <ul>
      @foreach (($articles['data'] ?? []) as $article)
        <li>
          <a href="{{ url('/faq/' . $article['slug']) }}">{{ $article['title'] }}</a>
          @if (!empty($article['excerpt']))
            <p>{{ $article['excerpt'] }}</p>
          @endif
        </li>
      @endforeach
    </ul>
  </main>
@endsection
