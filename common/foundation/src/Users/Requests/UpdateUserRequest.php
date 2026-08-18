<?php

namespace Common\Users\Requests;

use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Unique;
use Illuminate\Validation\Rules\Password;

#[SchemaName('UpdateUserBody')]
class UpdateUserRequest extends FormRequest
{
    public function rules(): array
    {
        // A missing user only occurs while the OpenAPI schema is generated.
        // Runtime requests are authenticated and still use the least-privilege branch.
        $isAdmin = !$this->user() ||
            (bool) $this->user()->hasPermission('users.update');

        if (!$isAdmin) {
            return [
                'name' => 'sometimes|nullable|string|min:2|max:255|regex:/^[\pL\s\-]+$/u',
                'image' => 'sometimes|nullable|string|max:255',
                'image_entry_id' => 'sometimes|nullable|integer',
                'country' => 'sometimes|nullable|string|max:20',
                'language' => 'sometimes|nullable|string|max:20',
                'timezone' => 'sometimes|nullable|string|max:50',
                'email' => 'prohibited',
                'password' => 'prohibited',
                'email_is_verified' => 'prohibited',
                'permissions' => 'prohibited',
                'roles' => 'prohibited',
            ];
        }

        return [
            'email' => [
                'email',
                'min:3',
                'max:255',
                (new Unique('users', 'email'))->ignore($this->route('id')),
            ],
            'password' => ['sometimes', 'nullable', Password::min(8), 'max:255'],
            'image' => 'string|max:255|nullable',
            'image_entry_id' => 'int|nullable',
            'email_is_verified' => 'boolean',
            // alpha and space/dash
            'name' => 'string|min:2|max:255|nullable|regex:/^[\pL\s\-]+$/u',

            'permissions' => 'array',
            'permissions.*.id' => 'integer',
            'permissions.*.restrictions' => 'array',
            'permissions.*.restrictions.*.name' => 'string',
            'permissions.*.restrictions.*.value' => '',

            'roles' => 'array',
            'roles.*' => 'int',

            'country' => 'nullable|string|max:20',
            'language' => 'nullable|string|max:20',
            'timezone' => 'nullable|string|max:50',
        ];
    }
}
