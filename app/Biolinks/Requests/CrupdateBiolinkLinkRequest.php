<?php

namespace App\Biolinks\Requests;

use App\Biolinks\Support\BiolinkAssetCatalog;
use App\Links\Requests\CrupdateLinkRequest;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

#[SchemaName('CrupdateBiolinkLinkBody')]
class CrupdateBiolinkLinkRequest extends CrupdateLinkRequest
{
    private const STYLE_KEYS = [
        'backgroundColor',
        'textColor',
        'borderColor',
        'iconColor',
    ];

    public function rules(): array
    {
        return [
            ...parent::rules(),
            /** Indicates whether link is publicly visible. True by default. */
            'active' => 'nullable|boolean',
            /** Indicates where link should appear in the list. By default this will be the last position. */
            'position' => 'nullable|integer',
            'animation' => 'nullable|string',
            'leap_until' => 'nullable|date',
            'pinned' => 'nullable|in:top,bottom',
            /** @var 'image'|'asset'|'none'|null */
            'thumbnail_type' => ['nullable', Rule::in(['image', 'asset', 'none'])],
            'thumbnail_asset' => ['nullable', 'string', 'max:1000'],
            /** @var array{backgroundColor?: string, textColor?: string, borderColor?: string, iconColor?: string}|null */
            'style' => ['nullable', 'array'],
            'style.backgroundColor' => ['nullable', 'regex:/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/'],
            'style.textColor' => ['nullable', 'regex:/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/'],
            'style.borderColor' => ['nullable', 'regex:/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/'],
            'style.iconColor' => ['nullable', 'regex:/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/'],
        ];
    }

    protected function withValidator(Validator $validator)
    {
        parent::withValidator($validator);

        return $validator->after(function (Validator $validator) {
            $thumbnailType = $this->input('thumbnail_type');
            $thumbnailAsset = $this->input('thumbnail_asset');

            if ($thumbnailType === 'asset' && !$thumbnailAsset) {
                $validator->errors()->add(
                    'thumbnail_asset',
                    'An asset is required when asset thumbnail is selected.',
                );
            }

            if (
                $thumbnailAsset &&
                !app(BiolinkAssetCatalog::class)->isAllowedPath($thumbnailAsset)
            ) {
                $validator->errors()->add(
                    'thumbnail_asset',
                    'The selected asset is not allowed.',
                );
            }

            $style = $this->input('style');
            if (is_array($style)) {
                $unknownKeys = array_values(
                    array_diff(array_keys($style), self::STYLE_KEYS),
                );

                if ($unknownKeys) {
                    $validator->errors()->add(
                        'style',
                        'Unsupported style keys: ' . implode(', ', $unknownKeys) . '.',
                    );
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

        if (array_key_exists('thumbnail_asset', $data)) {
            $data['thumbnail_asset'] = app(BiolinkAssetCatalog::class)
                ->normalizePath($data['thumbnail_asset']);
        }

        if (($data['thumbnail_type'] ?? null) === 'none') {
            $data['thumbnail_asset'] = null;
        }

        if (isset($data['style']) && is_array($data['style'])) {
            $data['style'] = array_filter(
                Arr::only($data['style'], self::STYLE_KEYS),
                fn(mixed $value) => $value !== null && $value !== '',
            ) ?: null;
        }

        return $data;
    }
}
