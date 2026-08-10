<?php

namespace App\QrCodes\Requests;

use App\Links\Linkeable\CrupdateLinkeableRequest;
use App\QrCodes\Models\QrCode;
use App\QrCodes\QrCodeType;
use App\QrCodes\Services\QrCodePayloadBuilder;
use Common\Validation\CaptchaTokenValid;
use Common\Workspaces\ActiveWorkspace;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use InvalidArgumentException;

#[SchemaName('CrupdateQrCodeBody')]
class CrupdateQrCodeRequest extends CrupdateLinkeableRequest
{
    public function rules(): array
    {
        $type = $this->qrCodeType();

        $rules = [
            'name' => [
                'string',
                'nullable',
                'min:3',
                'max:100',
                Rule::unique('qr_codes')
                    ->where('workspace_id', ActiveWorkspace::get()?->id)
                    ->ignore($this->route('id')),
            ],

            'type' => ['required', Rule::enum(QrCodeType::class)],
            /** @var array<string, mixed>|null */
            'data' => ['nullable', 'array'],

            'long_url' => [
                'nullable',
                Rule::string()
                    ->min(settings('links.min_len', 3))
                    ->max(settings('links.max_len', 1000)),
                Rule::requiredIf(
                    $this->isCreating() && $type === QrCodeType::Url,
                ),
            ],

            'data.key_type' => [
                Rule::requiredIf($type === QrCodeType::Pix),
                'nullable',
                Rule::in(['cpf', 'cnpj', 'phone', 'email', 'random']),
            ],
            'data.key' => [
                Rule::requiredIf($type === QrCodeType::Pix),
                'nullable',
                'string',
                'max:77',
            ],
            'data.receiver_name' => [
                Rule::requiredIf($type === QrCodeType::Pix),
                'nullable',
                'string',
                'max:80',
            ],
            'data.receiver_city' => [
                Rule::requiredIf($type === QrCodeType::Pix),
                'nullable',
                'string',
                'max:80',
            ],
            'data.amount' => [
                'nullable',
                'string',
                'regex:/^\d{1,10}(?:[.,]\d{1,2})?$/',
            ],
            'data.description' => ['nullable', 'string', 'max:72'],
            'data.txid' => [
                'nullable',
                'string',
                'max:25',
                'regex:/^[A-Za-z0-9*]+$/',
            ],

            'data.ssid' => [
                Rule::requiredIf($type === QrCodeType::Wifi),
                'nullable',
                'string',
                'max:32',
            ],
            'data.security' => [
                Rule::requiredIf($type === QrCodeType::Wifi),
                'nullable',
                Rule::in(['WPA', 'WEP', 'nopass']),
            ],
            'data.password' => [
                Rule::requiredIf(
                    $type === QrCodeType::Wifi &&
                        $this->input('data.security', 'WPA') !== 'nopass',
                ),
                'nullable',
                'string',
                'max:63',
            ],
            'data.hidden' => ['nullable', 'boolean'],

            'data.phone' => [
                Rule::requiredIf(
                    in_array(
                        $type,
                        [
                            QrCodeType::Whatsapp,
                            QrCodeType::Phone,
                            QrCodeType::Sms,
                        ],
                        true,
                    ),
                ),
                'nullable',
                'string',
                'max:30',
            ],
            'data.message' => ['nullable', 'string', 'max:500'],
            'data.email' => [
                Rule::requiredIf($type === QrCodeType::Email),
                'nullable',
                'email:rfc',
                'max:190',
            ],
            'data.subject' => ['nullable', 'string', 'max:190'],
            'data.content' => [
                Rule::requiredIf($type === QrCodeType::Text),
                'nullable',
                'string',
                'max:1500',
            ],

            'data.first_name' => [
                Rule::requiredIf($type === QrCodeType::Vcard),
                'nullable',
                'string',
                'max:100',
            ],
            'data.last_name' => ['nullable', 'string', 'max:100'],
            'data.company' => ['nullable', 'string', 'max:150'],
            'data.job_title' => ['nullable', 'string', 'max:150'],
            'data.website' => [
                'nullable',
                'string',
                'max:1000',
                'url:http,https',
            ],
            'data.address' => ['nullable', 'string', 'max:300'],
            'data.notes' => ['nullable', 'string', 'max:500'],

            'data.latitude' => [
                Rule::requiredIf($type === QrCodeType::Location),
                'nullable',
                'numeric',
                'between:-90,90',
            ],
            'data.longitude' => [
                Rule::requiredIf($type === QrCodeType::Location),
                'nullable',
                'numeric',
                'between:-180,180',
            ],
            'data.location_name' => ['nullable', 'string', 'max:190'],

            'short_link' => 'array',
            'short_link.create' => 'nullable|boolean',
            'short_link.back_half' => $this->getBackHalfRule(
                isCreating: $this->isCreating(),
                domainId: $this->input('domain_id'),
            ),
            'short_link.domain_id' => 'nullable|integer',

            'style' => 'array|nullable',
            'style.color' => 'nullable|string',
            'style.bgColor' => 'nullable|string',
            'style.showLogo' => 'nullable|boolean',
            'style.logoUrl' => 'nullable|string',

            ...$this->getTrackingRules(),
            ...$this->getRetargetingRules(),
            ...$this->getExpirationAndPasswordRules(),
            ...$this->getTagsRules(),
        ];

        if (array_key_exists('captcha_token', $this->request->all())) {
            $rules['captcha_token'] = new CaptchaTokenValid('landing_new_link');
        }

        return $rules;
    }

    protected function withValidator(Validator $validator)
    {
        return $validator->after(function (Validator $validator) {
            $type = $this->qrCodeType();
            if (
                $type === QrCodeType::Url &&
                ($longUrl = $this->input('long_url'))
            ) {
                if (preg_match('/^(?:javascript|data|vbscript):/i', $longUrl)) {
                    $validator
                        ->errors()
                        ->add('long_url', 'Use uma URL HTTP ou HTTPS segura.');
                    return;
                }
                $this->runCustomValidationsForUrl(
                    $longUrl,
                    $validator,
                    'long_url',
                );
            }

            if (!$type->supportsRedirectCapabilities()) {
                $this->validateUnsupportedCapabilities($validator);
            }

            $this->validateTypeDataKeys($type, $validator);

            if (
                !$validator->errors()->isEmpty() ||
                (!$this->isCreating() &&
                    !$this->hasAny(['type', 'data', 'long_url']))
            ) {
                return;
            }

            $qrCode = $this->existingQrCode();
            try {
                app(QrCodePayloadBuilder::class)->buildDirect(
                    $type,
                    $this->input('data', $qrCode?->data ?? []),
                    $this->input('long_url', $qrCode?->long_url),
                );
            } catch (InvalidArgumentException $exception) {
                $validator
                    ->errors()
                    ->add(
                        $this->payloadErrorKey($type, $exception),
                        $exception->getMessage(),
                    );
            }
        });
    }

    protected function prepareForValidation(): void
    {
        if (!$this->has('type')) {
            $this->merge([
                'type' =>
                    $this->existingQrCode()?->type?->value ??
                    QrCodeType::Url->value,
            ]);
        }
    }

    private function qrCodeType(): QrCodeType
    {
        return QrCodeType::tryFrom(
            (string) ($this->input('type') ?? QrCodeType::Url->value),
        ) ?? QrCodeType::Url;
    }

    private function existingQrCode(): ?QrCode
    {
        $id = $this->route('id');
        return $id ? QrCode::query()->find($id) : null;
    }

    private function validateUnsupportedCapabilities(Validator $validator): void
    {
        $fields = [
            'utm',
            'utm_custom',
            'pixels',
            'rules',
            'password',
            'expires_at',
            'activates_at',
        ];

        foreach ($fields as $field) {
            if ($this->filled($field)) {
                $validator
                    ->errors()
                    ->add(
                        $field,
                        'Esta opção está disponível somente para QR Codes com redirecionamento.',
                    );
            }
        }

        if ($this->boolean('short_link.create')) {
            $validator
                ->errors()
                ->add(
                    'short_link.create',
                    'Links curtos não são compatíveis com este tipo de QR Code.',
                );
        }
    }

    private function validateTypeDataKeys(
        QrCodeType $type,
        Validator $validator,
    ): void {
        $data = $this->input('data', []);
        if (!is_array($data)) {
            return;
        }

        $allowed = match ($type) {
            QrCodeType::Url => [],
            QrCodeType::Pix => [
                'key_type',
                'key',
                'receiver_name',
                'receiver_city',
                'amount',
                'description',
                'txid',
            ],
            QrCodeType::Wifi => ['ssid', 'security', 'password', 'hidden'],
            QrCodeType::Whatsapp => ['phone', 'message'],
            QrCodeType::Phone => ['phone'],
            QrCodeType::Email => ['email', 'subject', 'message'],
            QrCodeType::Sms => ['phone', 'message'],
            QrCodeType::Text => ['content'],
            QrCodeType::Vcard => [
                'first_name',
                'last_name',
                'company',
                'job_title',
                'phone',
                'email',
                'website',
                'address',
                'notes',
            ],
            QrCodeType::Location => ['latitude', 'longitude', 'location_name'],
        };

        if (array_diff(array_keys($data), $allowed)) {
            $validator
                ->errors()
                ->add(
                    'data',
                    'Existem campos incompatíveis com o tipo de QR Code selecionado.',
                );
        }
    }

    private function payloadErrorKey(
        QrCodeType $type,
        InvalidArgumentException $exception,
    ): string {
        $message = mb_strtolower($exception->getMessage());
        if ($type === QrCodeType::Pix) {
            return str_contains($message, 'valor')
                ? 'data.amount'
                : (str_contains($message, 'txid')
                    ? 'data.txid'
                    : 'data.key');
        }

        return match ($type) {
            QrCodeType::Url => 'long_url',
            QrCodeType::Wifi => 'data.ssid',
            QrCodeType::Whatsapp,
            QrCodeType::Phone,
            QrCodeType::Sms
                => 'data.phone',
            QrCodeType::Email => 'data.email',
            QrCodeType::Text => 'data.content',
            QrCodeType::Vcard => 'data.first_name',
            QrCodeType::Location => str_contains($message, 'longitude')
                ? 'data.longitude'
                : 'data.latitude',
            QrCodeType::Pix => 'data.key',
        };
    }

    protected function isCreating(): bool
    {
        return $this->getMethod() === 'POST';
    }
}
