<?php

namespace Tests\Unit;

use Common\Core\Middleware\SetAppLocale;
use Tests\TestCase;

class SetAppLocaleTest extends TestCase
{
    private array $supportedLocales = ['en', 'pt-BR', 'pt-PT'];

    public function test_browser_portuguese_brazil_resolves_to_pt_br(): void
    {
        $this->assertSame(
            'pt-BR',
            SetAppLocale::resolveLanguageFromHeader(
                'pt-BR,pt;q=0.9,en;q=0.5',
                $this->supportedLocales,
            ),
        );
    }

    public function test_browser_portuguese_portugal_resolves_to_pt_pt(): void
    {
        $this->assertSame(
            'pt-PT',
            SetAppLocale::resolveLanguageFromHeader(
                'pt-PT,pt;q=0.9,en;q=0.5',
                $this->supportedLocales,
            ),
        );
    }

    public function test_generic_browser_portuguese_prefers_pt_br(): void
    {
        $this->assertSame(
            'pt-BR',
            SetAppLocale::resolveLanguageFromHeader(
                'pt,en;q=0.5',
                $this->supportedLocales,
            ),
        );
    }

    public function test_legacy_manual_portuguese_normalizes_to_pt_pt(): void
    {
        $this->assertSame(
            'pt-PT',
            SetAppLocale::normalizeManualLanguage('pt'),
        );
        $this->assertSame(
            'pt-BR',
            SetAppLocale::normalizeManualLanguage('pt-BR'),
        );
        $this->assertSame(
            'pt-PT',
            SetAppLocale::normalizeManualLanguage('pt-PT'),
        );
    }

    public function test_non_portuguese_browser_locale_still_resolves_normally(): void
    {
        $this->assertSame(
            'en',
            SetAppLocale::resolveLanguageFromHeader(
                'en-US,en;q=0.9,pt;q=0.5',
                $this->supportedLocales,
            ),
        );
    }
}
