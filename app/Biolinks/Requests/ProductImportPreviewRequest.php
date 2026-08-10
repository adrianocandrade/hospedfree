<?php

namespace App\Biolinks\Requests;

use App\Biolinks\Models\Biolink;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

#[SchemaName('ProductImportPreviewRequest')]
class ProductImportPreviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        $biolink = Biolink::query()->find((int) $this->route('biolinkId'));

        return $biolink !== null && Gate::allows('update', $biolink);
    }

    public function rules(): array
    {
        return [
            'url' => ['required', 'string', 'url:http,https', 'max:2048'],
        ];
    }
}
