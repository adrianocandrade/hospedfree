<?php

use Common\Settings\LoadDefaultSettings;
use Common\Settings\Models\Setting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;

return new class extends Migration {
    public function up(): void
    {
        $defaultSettings = collect((new LoadDefaultSettings())->execute());

        $defaultLandingPage = $this->jsonDefault($defaultSettings, 'landingPage');
        if ($defaultLandingPage && $this->shouldReplaceLandingPage()) {
            $this->saveSetting('landingPage', $defaultLandingPage);
        }

        $defaultMenus = $this->jsonDefault($defaultSettings, 'menus') ?? [];
        $this->addLandingNavbarMenu($defaultMenus);

        Cache::forget('settings.public');
    }

    public function down(): void
    {
        // Intentionally left blank. Do not remove user-edited landing content.
    }

    private function shouldReplaceLandingPage(): bool
    {
        $setting = Setting::where('name', 'landingPage')->first();

        if (!$setting) {
            return true;
        }

        $landingPage = $setting->value;
        $sections = is_array($landingPage)
            ? Arr::get($landingPage, 'sections', [])
            : [];

        if (empty($sections)) {
            return true;
        }

        foreach ($sections as $section) {
            if (str_starts_with($section['name'] ?? '', 'meulinkbio-')) {
                return false;
            }
        }

        $firstSection = $sections[0] ?? [];

        return ($firstSection['name'] ?? null) ===
            'hero-split-with-screenshot' &&
            ($firstSection['title'] ?? null) ===
                'Every link you share, built to convert';
    }

    private function addLandingNavbarMenu(array $defaultMenus): void
    {
        $landingMenu = Arr::first(
            $defaultMenus,
            fn($menu) => in_array(
                'landing-page-navbar',
                $menu['positions'] ?? [],
                true,
            ),
        );

        if (!$landingMenu) {
            return;
        }

        $setting = Setting::firstOrNew(['name' => 'menus']);
        $menus = $setting->exists && is_array($setting->value)
            ? $setting->value
            : [];

        $hasLandingNavbar = collect($menus)->contains(
            fn($menu) => in_array(
                'landing-page-navbar',
                $menu['positions'] ?? [],
                true,
            ),
        );

        if ($hasLandingNavbar) {
            return;
        }

        $menus[] = $landingMenu;
        $setting->value = $menus;
        $setting->save();
    }

    private function jsonDefault(
        Illuminate\Support\Collection $defaultSettings,
        string $name,
    ): ?array {
        $setting = $defaultSettings->firstWhere('name', $name);

        if (!$setting) {
            return null;
        }

        return json_decode($setting['value'], true);
    }

    private function saveSetting(string $name, array $value): void
    {
        $setting = Setting::firstOrNew(['name' => $name]);
        $setting->value = $value;
        $setting->save();
    }
};
