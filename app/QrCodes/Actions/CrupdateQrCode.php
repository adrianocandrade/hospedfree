<?php

namespace App\QrCodes\Actions;

use App\Biolinks\Models\Biolink;
use App\Folders\Models\Folder;
use App\Links\Actions\CrupdateLink;
use App\Links\Linkeable\CrupdateLinkeable;
use App\Links\Models\Link;
use App\QrCodes\Models\QrCode;
use App\QrCodes\QrCodeType;
use App\QrCodes\Services\QrCodePayloadBuilder;
use Common\Workspaces\ActiveWorkspace;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class CrupdateQrCode extends CrupdateLinkeable
{
    public function execute(
        array $specifiedData,
        Link|Folder|Biolink|null $linkeable = null,
        QrCode|null $qrCode = null,
    ): QrCode {
        $isCreating = is_null($qrCode);

        $specifiedData = $this->filterOutDataBasedOnUserPermissions(
            $specifiedData,
        );

        $type = $this->resolveType($specifiedData, $qrCode, $linkeable);
        $typeData = array_key_exists('data', $specifiedData)
            ? $specifiedData['data'] ?? []
            : $qrCode?->data ?? [];
        $hasPayloadChanges =
            $isCreating ||
            array_key_exists('type', $specifiedData) ||
            array_key_exists('data', $specifiedData) ||
            array_key_exists('long_url', $specifiedData);

        if (!$type->supportsRedirectCapabilities()) {
            $specifiedData = Arr::except($specifiedData, [
                'utm',
                'utm_custom',
                'pixels',
                'rules',
                'password',
                'expires_at',
                'activates_at',
                'short_link',
            ]);
        }

        $payloadInlineData = $hasPayloadChanges
            ? [
                'type' => $type->value,
                'data' => $typeData ?: null,
                ...$this->getDestinationInlineData(
                    $type,
                    $typeData,
                    $specifiedData,
                ),
            ]
            : [];

        $qrCodeInlineData = [
            ...Arr::only($specifiedData, ['style', 'name']),
            ...$payloadInlineData,
        ];

        $linkeableInlineData = [
            ...Arr::only($specifiedData, ['name']),
            ...$type->supportsRedirectCapabilities()
                ? $this->getDestinationInlineData(
                    $type,
                    $typeData,
                    $specifiedData,
                )
                : [],
            ...$this->getUtmInlineData($specifiedData),
            ...$this->getExpirationAndPasswordInlineData($specifiedData),
        ];

        if ($isCreating) {
            if (Arr::get($specifiedData, 'short_link.create')) {
                $linkeable = (new CrupdateLink())->execute([
                    ...$linkeableInlineData,
                    'back_half' =>
                        Arr::get($specifiedData, 'short_link.back_half') ??
                        Str::random(5),
                    'domain_id' =>
                        Arr::get($specifiedData, 'short_link.domain_id') ??
                        null,
                ]);
            }

            $qrCode = QrCode::create([
                ...$qrCodeInlineData,
                'back_half' => Str::random(5),
                'user_id' => Auth::id(),
                'workspace_id' => ActiveWorkspace::get()->id,
                'linkeable_id' => $linkeable?->id,
                'linkeable_type' => $linkeable?->model_type,
            ]);
        } else {
            $qrCode->fill($qrCodeInlineData)->save();
            $linkeable = $qrCode->linkeable;

            if ($linkeable) {
                $linkeable->fill($linkeableInlineData)->save();
            }
        }

        // if linkeable exist, then set all the linkeable data on that linkeable, otherwise set it on the qr code
        $this->saveLinkeableRules($linkeable ?? $qrCode, $specifiedData);
        $this->saveLinkeableTags($linkeable ?? $qrCode, $specifiedData);
        $this->saveLinkeableTrackingPixels(
            $linkeable ?? $qrCode,
            $specifiedData,
        );

        return $qrCode;
    }

    /** @param array<string, mixed> $specifiedData */
    private function resolveType(
        array $specifiedData,
        ?QrCode $qrCode,
        Link|Folder|Biolink|null $linkeable,
    ): QrCodeType {
        if ($linkeable || $qrCode?->linkeable_id) {
            return QrCodeType::Url;
        }

        $currentType = $qrCode?->type ?? QrCodeType::Url;
        return QrCodeType::tryFrom(
            (string) ($specifiedData['type'] ?? $currentType->value),
        ) ?? QrCodeType::Url;
    }

    /**
     * @param array<string, mixed> $typeData
     * @param array<string, mixed> $specifiedData
     * @return array{long_url?: string|null}
     */
    private function getDestinationInlineData(
        QrCodeType $type,
        array $typeData,
        array $specifiedData,
    ): array {
        if ($type === QrCodeType::Url) {
            return $this->getLongUrlInlineData($specifiedData);
        }

        if ($type === QrCodeType::Whatsapp) {
            return [
                'long_url' => app(QrCodePayloadBuilder::class)->buildDirect(
                    $type,
                    $typeData,
                ),
            ];
        }

        return ['long_url' => null];
    }
}
