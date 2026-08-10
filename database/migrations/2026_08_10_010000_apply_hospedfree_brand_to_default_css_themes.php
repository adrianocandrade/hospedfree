<?php

use Common\Settings\Themes\CssTheme;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    public function up(): void
    {
        foreach ($this->previousThemes() as $scheme => $previousValues) {
            $defaultColumn =
                $scheme === 'dark' ? 'default_dark' : 'default_light';
            $theme = CssTheme::query()
                ->where('type', 'site')
                ->where($defaultColumn, true)
                ->first();

            if (
                !$theme ||
                !$this->valuesMatch($theme->values, $previousValues)
            ) {
                continue;
            }

            $theme->values = config("themes.$scheme");
            $theme->save();
        }
    }

    public function down(): void
    {
        foreach ($this->previousThemes() as $scheme => $previousValues) {
            $defaultColumn =
                $scheme === 'dark' ? 'default_dark' : 'default_light';
            $theme = CssTheme::query()
                ->where('type', 'site')
                ->where($defaultColumn, true)
                ->first();

            if (
                !$theme ||
                !$this->valuesMatch($theme->values, config("themes.$scheme"))
            ) {
                continue;
            }

            $theme->values = $previousValues;
            $theme->save();
        }
    }

    private function valuesMatch(array $current, array $expected): bool
    {
        ksort($current);
        ksort($expected);

        return $current === $expected;
    }

    private function previousThemes(): array
    {
        return [
            'light' => [
                '--be-background' => '#F7F9FC',
                '--be-foreground' => '#231F20',
                '--be-card' => '#FFFFFF',
                '--be-card-foreground' => '#231F20',
                '--be-popover' => '#FFFFFF',
                '--be-popover-foreground' => '#231F20',
                '--be-primary' => '#33BCDB',
                '--be-primary-foreground' => '#231F20',
                '--be-secondary' => '#DAF3F9',
                '--be-secondary-foreground' => '#231F20',
                '--be-muted' => '#EEF3F6',
                '--be-muted-foreground' => '#667085',
                '--be-accent' => '#ECE9F8',
                '--be-accent-foreground' => '#231F20',
                '--be-destructive' => '#B42318',
                '--be-border' => '#D8DEE6',
                '--be-input' => '#C8D0DA',
                '--be-sidebar' => '#FFFFFF',
                '--be-sidebar-foreground' => '#231F20',
                '--be-sidebar-primary' => '#33BCDB',
                '--be-sidebar-primary-foreground' => '#231F20',
                '--be-sidebar-accent' => '#DAF3F9',
                '--be-sidebar-accent-foreground' => '#231F20',
                '--be-sidebar-border' => '#E4E7EC',
            ],
            'dark' => [
                '--be-background' => '#171516',
                '--be-foreground' => '#F7F9FC',
                '--be-card' => '#231F20',
                '--be-card-foreground' => '#F7F9FC',
                '--be-popover' => '#231F20',
                '--be-popover-foreground' => '#F7F9FC',
                '--be-primary' => '#33BCDB',
                '--be-primary-foreground' => '#231F20',
                '--be-secondary' => '#2D3538',
                '--be-secondary-foreground' => '#F7F9FC',
                '--be-muted' => '#302C2E',
                '--be-muted-foreground' => '#BFC5CF',
                '--be-accent' => '#343044',
                '--be-accent-foreground' => '#F7F9FC',
                '--be-destructive' => '#F97066',
                '--be-border' => '#494345',
                '--be-input' => '#5B5356',
                '--be-sidebar' => '#1D1A1B',
                '--be-sidebar-foreground' => '#F7F9FC',
                '--be-sidebar-primary' => '#33BCDB',
                '--be-sidebar-primary-foreground' => '#231F20',
                '--be-sidebar-accent' => '#29383C',
                '--be-sidebar-accent-foreground' => '#F7F9FC',
                '--be-sidebar-border' => '#3C3739',
            ],
        ];
    }
};
