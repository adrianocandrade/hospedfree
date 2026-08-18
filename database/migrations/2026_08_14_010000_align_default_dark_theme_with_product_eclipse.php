<?php

use Common\Settings\Themes\CssTheme;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    public function up(): void
    {
        $theme = $this->defaultDarkTheme();

        if (!$theme || !$this->valuesMatch($theme->values, $this->previousValues())) {
            return;
        }

        $theme->values = config('themes.dark');
        $theme->save();
    }

    public function down(): void
    {
        $theme = $this->defaultDarkTheme();

        if (!$theme || !$this->valuesMatch($theme->values, config('themes.dark'))) {
            return;
        }

        $theme->values = $this->previousValues();
        $theme->save();
    }

    private function defaultDarkTheme(): ?CssTheme
    {
        return CssTheme::query()
            ->where('type', 'site')
            ->where('default_dark', true)
            ->first();
    }

    private function valuesMatch(array $current, array $expected): bool
    {
        ksort($current);
        ksort($expected);

        return $current === $expected;
    }

    private function previousValues(): array
    {
        return [
            '--be-background' => '#171725',
            '--be-foreground' => '#F8F8FC',
            '--be-card' => '#202034',
            '--be-card-foreground' => '#F8F8FC',
            '--be-popover' => '#272640',
            '--be-popover-foreground' => '#F8F8FC',
            '--be-primary' => '#ACA9D4',
            '--be-primary-foreground' => '#202034',
            '--be-secondary' => '#2B2A44',
            '--be-secondary-foreground' => '#F8F8FC',
            '--be-muted' => '#2A293E',
            '--be-muted-foreground' => '#B9B7C9',
            '--be-accent' => '#3A385B',
            '--be-accent-foreground' => '#F8F8FC',
            '--be-destructive' => '#FCA5A5',
            '--be-positive' => '#4ADE80',
            '--be-warning' => '#FBBF24',
            '--be-info' => '#7DD3FC',
            '--be-border' => '#44435E',
            '--be-input' => '#706D8C',
            '--be-sidebar' => '#1C1C2E',
            '--be-sidebar-foreground' => '#F8F8FC',
            '--be-sidebar-primary' => '#ACA9D4',
            '--be-sidebar-primary-foreground' => '#202034',
            '--be-sidebar-accent' => '#302F4B',
            '--be-sidebar-accent-foreground' => '#F8F8FC',
            '--be-sidebar-border' => '#44435E',
        ];
    }
};
