<?php

namespace Common\Core\Middleware;

use Closure;
use Common\Localizations\Localization;
use Common\Localizations\UserLocaleController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Negotiation\LanguageNegotiator;

class SetAppLocale
{
    public const LEGACY_PORTUGUESE_LOCALE = 'pt';
    public const PORTUGUESE_BRAZIL_LOCALE = 'pt-BR';
    public const PORTUGUESE_PORTUGAL_LOCALE = 'pt-PT';

    public function handle(Request $request, Closure $next)
    {
        if (settings('i18n.enable')) {
            $langCode = self::resolveLanguageFromRequest($request);
            if ($langCode) {
                app()->setLocale($langCode);
            }
        }

        return $next($request);
    }

    public static function resolveLanguageFromRequest(
        Request $request,
    ): string|null {
        // 1. Check if current user has manually selected a specific language
        $langCode =
            $request->get('lang') ??
            ($request->user()?->language ??
                Cookie::get(UserLocaleController::COOKIE_NAME));
        $langCode = self::normalizeManualLanguage($langCode);

        $defaultLocale = settings('locale.default', 'auto');

        // 2. if admin manually selected a specific default locale, use that
        if (!$langCode && $defaultLocale && $defaultLocale !== 'auto') {
            $langCode = self::normalizeManualLanguage($defaultLocale);
        }

        // 3. Try to use language based on browser settings
        if (!$langCode && ($header = $request->header('Accept-Language'))) {
            $languages = Localization::pluck('language');
            if ($languages->isNotEmpty()) {
                $langCode = self::resolveLanguageFromHeader(
                    $header,
                    $languages->toArray(),
                );
            }
        }

        return $langCode;
    }

    public static function normalizeManualLanguage(
        string|null $language,
    ): string|null {
        return $language === self::LEGACY_PORTUGUESE_LOCALE
            ? self::PORTUGUESE_PORTUGAL_LOCALE
            : $language;
    }

    public static function resolveLanguageFromHeader(
        string $header,
        array $supportedLanguages,
    ): string|null {
        $languages = self::prioritizePortugueseBrowserFallback(
            $supportedLanguages,
        );

        if (empty($languages)) {
            return null;
        }

        $bestLanguage = (new LanguageNegotiator())->getBest(
            $header,
            $languages,
        );

        return $bestLanguage?->getValue();
    }

    /**
     * Generic browser locale "pt" should resolve to Brazilian Portuguese first.
     * Manual legacy values are handled separately and continue to mean pt-PT.
     */
    public static function prioritizePortugueseBrowserFallback(
        array $supportedLanguages,
    ): array {
        $languages = array_values(
            array_unique(
                array_filter(
                    $supportedLanguages,
                    fn($language) => is_string($language) && $language !== '',
                ),
            ),
        );

        $priority = [
            self::PORTUGUESE_BRAZIL_LOCALE,
            self::PORTUGUESE_PORTUGAL_LOCALE,
            self::LEGACY_PORTUGUESE_LOCALE,
        ];

        return [
            ...array_values(array_intersect($priority, $languages)),
            ...array_values(array_diff($languages, $priority)),
        ];
    }
}
