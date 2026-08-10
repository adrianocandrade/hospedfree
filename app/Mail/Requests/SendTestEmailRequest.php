<?php

namespace App\Mail\Requests;

use App\Mail\TestEmailTemplate;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

#[SchemaName('SendTestEmailBody')]
class SendTestEmailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('settings.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'recipient' => ['required', 'email:rfc', 'max:254'],
            'template' => ['required', Rule::enum(TestEmailTemplate::class)],
        ];
    }
}
