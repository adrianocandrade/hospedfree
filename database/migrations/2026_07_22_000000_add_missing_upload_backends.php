<?php

use Common\Settings\Models\Setting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Arr;

return new class extends Migration {
    public function up(): void
    {
        $setting = Setting::query()->where('name', 'uploading')->first();

        if (!$setting || !is_array($setting->value)) {
            return;
        }

        $uploading = $setting->value;
        $localBackend = Arr::first(
            $uploading['backends'] ?? [],
            fn($backend) => ($backend['type'] ?? null) === 'local',
        );

        if (!$localBackend || empty($localBackend['id'])) {
            return;
        }

        $changed = false;
        $types = is_array($uploading['types'] ?? null)
            ? $uploading['types']
            : [];

        foreach (config('filesystems.upload_types', []) as $name => $config) {
            $type = is_array($types[$name] ?? null) ? $types[$name] : [];

            if (empty($type['backends'])) {
                $type['backends'] = [$localBackend['id']];
                $changed = true;
            }

            $defaultSize = Arr::get($config, 'defaults.max_file_size');
            if ($defaultSize && !isset($type['max_file_size'])) {
                $type['max_file_size'] = $defaultSize;
                $changed = true;
            }

            $defaultAccept = Arr::get($config, 'defaults.accept');
            if ($defaultAccept && !isset($type['accept'])) {
                $type['accept'] = $defaultAccept;
                $changed = true;
            }

            $types[$name] = $type;
        }

        if ($changed) {
            $uploading['types'] = $types;
            $setting->value = $uploading;
            $setting->save();
        }
    }

    public function down(): void
    {
        // Keep upload backend assignments intact on rollback.
    }
};
