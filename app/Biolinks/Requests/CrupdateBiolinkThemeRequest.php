<?php

namespace App\Biolinks\Requests;

use App\Biolinks\Models\BiolinkTheme;
use App\Biolinks\Support\BiolinkAppearanceConfig;
use App\Biolinks\Support\BiolinkAssetCatalog;
use App\Biolinks\Support\BiolinkContentBlueprint;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class CrupdateBiolinkThemeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $theme = $this->route('biolinkTheme');

        return [
            'name' => ['required', 'string', 'min:3', 'max:80'],
            'slug' => [
                'nullable',
                'string',
                'max:80',
                'regex:/^[a-z0-9-]+$/',
                Rule::unique('biolink_themes', 'slug')->ignore($theme?->id),
            ],
            'category' => ['required', Rule::in(['customizable', 'curated', 'user', 'community'])],
            /** @var array<string, mixed> */
            'config' => ['required', 'array'],
            /** @var array<string, mixed> */
            'metadata' => ['nullable', 'array'],
            'metadata.previewImage' => ['nullable', 'string', 'max:1000'],
            'metadata.isModel' => ['nullable', 'boolean'],
            'metadata.device' => ['nullable', Rule::in(['mobile', 'desktop', 'both'])],
            'metadata.tags' => ['nullable', 'array'],
            'metadata.tags.*' => ['string', 'max:40'],
            'metadata.requiredFeatures' => ['nullable', 'array'],
            'metadata.requiredFeatures.*' => [
                'string',
                Rule::in([
                    'advanced_appearance',
                    'desktop_layout',
                    'model_gallery',
                    'premium_models',
                    'background_video',
                    'profile_audio',
                    'custom_cursor',
                    'visual_effects',
                    'badges',
                    'custom_badges',
                    'discord_presence',
                    'hide_branding',
                    'custom_css',
                ]),
            ],
            /** @var array<string, mixed> */
            'metadata.contentBlueprint' => ['nullable', 'array'],
            'metadata.seedVersion' => ['nullable', 'string', 'max:80'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $errors = app(BiolinkAppearanceConfig::class)->validate(
                $this->input('config', []),
            );

            foreach ($errors as $path => $message) {
                $validator->errors()->add($path, $message);
            }

            $assetErrors = [];
            app(BiolinkAssetCatalog::class)->validatePath(
                $assetErrors,
                'metadata.previewImage',
                $this->input('metadata.previewImage'),
                true,
            );

            foreach ($assetErrors as $path => $message) {
                $validator->errors()->add($path, $message);
            }

            $blueprint = $this->input('metadata.contentBlueprint');
            if (is_array($blueprint)) {
                foreach (
                    app(BiolinkContentBlueprint::class)->validate($blueprint)
                    as $path => $message
                ) {
                    $validator->errors()->add($path, $message);
                }
            }
        });
    }

    public function validated($key = null, $default = null): mixed
    {
        $data = parent::validated($key, $default);

        if ($key !== null) {
            return $data;
        }

        $data['config'] = app(BiolinkAppearanceConfig::class)->normalize(
            $data['config'],
        );

        if (isset($data['metadata']) && is_array($data['metadata'])) {
            $data['metadata'] = array_filter([
                'previewImage' => Arr::get($data, 'metadata.previewImage'),
                'isModel' => Arr::get($data, 'metadata.isModel'),
                'device' => Arr::get($data, 'metadata.device'),
                'tags' => array_values(Arr::get($data, 'metadata.tags', [])),
                'requiredFeatures' => array_values(Arr::get($data, 'metadata.requiredFeatures', [])),
                'contentBlueprint' => is_array(
                    Arr::get($data, 'metadata.contentBlueprint'),
                )
                    ? app(BiolinkContentBlueprint::class)->normalize(
                        Arr::get($data, 'metadata.contentBlueprint'),
                    )
                    : null,
                'seedVersion' => Arr::get($data, 'metadata.seedVersion'),
            ], fn(mixed $value) => $value !== null && $value !== [] && $value !== '');
        }

        return $data;
    }
}
