<?php

namespace App\Biolinks\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class CrupdateBiolinkProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:2000'],
            'image' => [
                'nullable',
                'string',
                'max:2048',
                function (
                    string $attribute,
                    mixed $value,
                    \Closure $fail,
                ): void {
                    if ($value === null || $value === '') {
                        return;
                    }

                    $isStoredPath =
                        is_string($value) &&
                        Str::startsWith($value, ['/storage/', '/uploads/']);
                    $isHttpUrl =
                        is_string($value) &&
                        filter_var($value, FILTER_VALIDATE_URL) &&
                        Str::startsWith(Str::lower($value), [
                            'http://',
                            'https://',
                        ]);
                    if (!$isStoredPath && !$isHttpUrl) {
                        $fail('The image URL is invalid.');
                    }
                },
            ],
            'price' => [
                'nullable',
                'required_with:compare_price',
                'numeric',
                'min:0',
                'max:999999999',
            ],
            'compare_price' => [
                'nullable',
                'numeric',
                'min:0',
                'max:999999999',
                'gt:price',
            ],
            'currency' => [
                'nullable',
                'string',
                'size:3',
                'regex:/^[A-Za-z]{3}$/',
            ],
            'badge' => ['nullable', 'string', 'max:40'],
            'rating' => ['nullable', 'numeric', 'min:0', 'max:5'],
            'stock_label' => ['nullable', 'string', 'max:80'],
            'url' => ['nullable', 'url:http,https', 'max:2048'],
            'active' => ['sometimes', 'boolean'],
            'position' => ['sometimes', 'integer', 'min:0', 'max:10000'],
        ];
    }
}
