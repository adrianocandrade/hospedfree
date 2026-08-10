<?php

namespace App\Biolinks\Requests;

use App\Biolinks\Models\Biolink;
use App\Biolinks\Support\BiolinkAppearanceConfig;
use App\Biolinks\Support\BiolinkAppearancePlanGuard;
use App\Biolinks\Support\BiolinkBadgeOwnershipGuard;
use Common\Workspaces\ActiveWorkspace;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Validator;

class UpdateBiolinkAppearanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $biolink = Biolink::query()->find($this->route('id'));

        return $biolink && Gate::allows('update', $biolink);
    }

    public function rules(): array
    {
        return [
            /** @var array<string, mixed> */
            'config' => 'required|array',
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

            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $biolink = Biolink::query()
                ->with('appearance')
                ->find($this->route('id'));

            $owner = ActiveWorkspace::get()?->getOwnerUser() ?? $this->user();
            $planErrors = app(BiolinkAppearancePlanGuard::class)->validate(
                app(BiolinkAppearanceConfig::class)->normalize($this->input('config', [])),
                $biolink?->appearance?->config ?? [],
                $owner,
            );

            foreach ($planErrors as $path => $message) {
                $validator->errors()->add($path, $message);
            }

            $ownershipErrors = app(BiolinkBadgeOwnershipGuard::class)->validate(
                app(BiolinkAppearanceConfig::class)->normalize(
                    $this->input('config', []),
                ),
                $owner,
            );

            foreach ($ownershipErrors as $path => $message) {
                $validator->errors()->add($path, $message);
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

        return $data;
    }
}
