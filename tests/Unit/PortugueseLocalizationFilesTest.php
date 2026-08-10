<?php

namespace Tests\Unit;

use Tests\TestCase;

class PortugueseLocalizationFilesTest extends TestCase
{
    public function test_portuguese_localization_files_have_same_keys_as_english(): void
    {
        $english = $this->readLocale('en');
        $brazilianPortuguese = $this->readLocale('pt-BR');
        $portugalPortuguese = $this->readLocale('pt-PT');

        $this->assertSame(
            array_keys($english),
            array_keys($brazilianPortuguese),
        );
        $this->assertSame(array_keys($english), array_keys($portugalPortuguese));
    }

    public function test_brazilian_portuguese_is_independent_from_english(): void
    {
        $english = $this->readLocale('en');
        $brazilianPortuguese = $this->readLocale('pt-BR');

        $this->assertNotSame($english, $brazilianPortuguese);
    }

    public function test_php_language_groups_are_available_for_pt_br(): void
    {
        app()->setLocale('pt-BR');

        $this->assertSame(
            'O e-mail ou a senha informados estão incorretos.',
            __('auth.failed'),
        );
        $this->assertSame(
            'O campo email é obrigatório.',
            __('validation.required', ['attribute' => 'email']),
        );
    }

    public function test_php_language_groups_are_available_for_underscore_alias(): void
    {
        app()->setLocale('pt_BR');

        $this->assertSame(
            'O e-mail ou a senha informados estão incorretos.',
            __('auth.failed'),
        );
        $this->assertSame(
            'Número máximo de links que o usuário poderá criar. Deixe vazio para ilimitado.',
            __('policies.count_description', ['resources' => 'links']),
        );
    }

    public function test_php_language_groups_match_english_keys(): void
    {
        foreach (['auth', 'passwords', 'policies', 'validation'] as $group) {
            $this->assertSame(
                $this->arrayKeysRecursive(
                    require resource_path("lang/en/$group.php"),
                ),
                $this->arrayKeysRecursive(
                    require resource_path("lang/pt-BR/$group.php"),
                ),
            );
            $this->assertSame(
                require resource_path("lang/pt-BR/$group.php"),
                require resource_path("lang/pt_BR/$group.php"),
            );
        }
    }

    private function readLocale(string $locale): array
    {
        $contents = file_get_contents(resource_path("lang/$locale.json"));

        $this->assertIsString($contents);

        return json_decode($contents, true, flags: JSON_THROW_ON_ERROR);
    }

    private function arrayKeysRecursive(array $array): array
    {
        return collect($array)
            ->map(
                fn($value, $key) => is_array($value)
                    ? [$key => $this->arrayKeysRecursive($value)]
                    : $key,
            )
            ->values()
            ->all();
    }
}
