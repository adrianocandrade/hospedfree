<?php

namespace App\Biolinks\Requests;

use App\Biolinks\Models\BiolinkTheme;
use App\Biolinks\Support\BiolinkModelPlanGuard;
use App\Links\Linkeable\CrupdateLinkeableRequest;
use Common\Workspaces\ActiveWorkspace;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Validation\Validator;
use Illuminate\Validation\Rule;

#[SchemaName('CrupdateBiolinkBody')]
class CrupdateBiolinkRequest extends CrupdateLinkeableRequest
{
    public function rules(): array
    {
        return [
            'name' => [
                Rule::when($this->isCreating(), 'required'),
                'min:3',
                'max:160',
                Rule::unique('biolinks')
                    ->where('workspace_id', ActiveWorkspace::get()->id)
                    ->ignore($this->route('id')),
            ],

            'domain_id' => 'nullable|integer',
            'model_id' => [
                $this->isCreating() ? 'nullable' : 'prohibited',
                'integer',
                Rule::exists('biolink_themes', 'id')->where(
                    fn($query) => $query->where('is_published', true),
                ),
            ],
            'back_half' => $this->getBackHalfRule(
                isCreating: $this->isCreating(),
                domainId: $this->input('domain_id'),
                ignoreBiolinkId: $this->route('id'),
            ),

            ...$this->getQrCodeRules(),
            ...$this->getTrackingRules(),
            ...$this->getRetargetingRules(),
            ...$this->getExpirationAndPasswordRules(),
            ...$this->getTagsRules(),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $modelId = $this->integer('model_id');
            if (!$modelId || !$this->isCreating()) {
                return;
            }

            $model = BiolinkTheme::query()->find($modelId);
            if (
                !$model ||
                !$model->is_published ||
                !($model->metadata['isModel'] ?? false)
            ) {
                $validator
                    ->errors()
                    ->add('model_id', __('The selected model is unavailable.'));
                return;
            }

            foreach (
                app(BiolinkModelPlanGuard::class)->validate(
                    $this->user(),
                    $model,
                )
                as $path => $message
            ) {
                $validator->errors()->add($path, $message);
            }
        });
    }
}
