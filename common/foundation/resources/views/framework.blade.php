@php
    use Illuminate\Support\Js;
    use Sentry\Laravel\Integration;
@endphp

<!DOCTYPE html>
<html
    lang="{{ $bootstrapData->get('i18n.active') }}"
    dir="{{ $bootstrapData->get('i18n.direction') }}"
    @class ([
        'dark' => $bootstrapData->initialTheme->is_dark,
        'light' => !$bootstrapData->initialTheme->is_dark,
        'is-settings-preview' => $bootstrapData->get('is_settings_preview'),
        'radius-' . ($bootstrapData->initialTheme->radius ?? 'default')
    ])
>
<head>
    <base href="{{ $htmlBaseUri }}" />

    @foreach ($bootstrapData->cssThemes as $theme)
        <style>
            .{{
                $theme->is_dark
                    ? 'dark'
                    : 'light'
            }} {
                {!! $theme->getCssVariables() !!}
            }
        </style>
    @endforeach

    @if (isset($seoTags))
        {!! $seoTags !!}
    @else
        <title>
            {{
                settings(
                    'branding.site_name',
                )
            }}
        </title>
    @endif

    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register(@json(url('sw.js')), {
                    scope: @json(rtrim(request()->getBasePath(), '/') . '/'),
                });
            });
        }
    </script>

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=5"
        data-keep="true"
    />
    <link
        rel="icon"
        type="image/x-icon"
        href="{{ url('favicon/icon-144x144.png') }}"
        data-keep="true"
    />
    <link
        rel="apple-touch-icon"
        href="{{ url('favicon/icon-192x192.png') }}"
        data-keep="true"
    />
    <link rel="manifest" href="{{ url('manifest.webmanifest') }}" data-keep="true" />

    <meta
        name="theme-color"
        content="{{ $bootstrapData->initialTheme->getHtmlThemeColor() }}"
        data-keep="true"
    />

    @if ($fontFamily = $bootstrapData->initialTheme->getFontFamily())
        @if ($bootstrapData->initialTheme->isGoogleFont())
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
                crossorigin
            />
            <link
                href="https://fonts.googleapis.com/css2?family={{ $fontFamily }}:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />
        @endif
    @endif

    <script>
        window.bootstrapData = {!!
            json_encode(
                $bootstrapData->get(),
            )
        !!};
    </script>

    @if (isset($devCssPath))
        <link rel="stylesheet" href="{{ $devCssPath }}" />
    @endif

    @viteReactRefresh
    @vite ('resources/client/main.tsx')

    @if (file_exists($customCssPath))
        @if ($content = file_get_contents($customCssPath))
            <style>
                {!! $content !!}
            </style>
        @endif
    @endif

    @if (file_exists($customHtmlPath))
        @if ($content = file_get_contents($customHtmlPath))
            {!! $content !!}
        @endif
    @endif

    @yield ('head-end')
</head>

<body>
    <div id="root">
        <div
            class="hf-page-loader"
            data-slot="full-page-loader"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div class="hf-page-loader__visual" aria-hidden="true">
                <div class="hf-page-loader__glow"></div>
                <div class="hf-page-loader__mark">
                    <img
                        src="{{ asset('images/icon.png') }}"
                        alt=""
                        class="hf-page-loader__icon"
                        draggable="false"
                    />
                    <img
                        src="{{ asset('images/icon.png') }}"
                        alt=""
                        class="hf-page-loader__shine"
                        draggable="false"
                    />
                </div>
            </div>

            <div class="hf-page-loader__status">
                <span class="hf-page-loader__label">
                    {{ __('Preparing HospedFree...') }}
                </span>
                <span class="hf-page-loader__dots" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            </div>
        </div>
    </div>

    <noscript>
        You need to have javascript enabled in order to use
        <strong>{{
            config(
                'app.name',
            )
        }}</strong>
        .
    </noscript>

    @yield ('body-end')
</body>
</html>
