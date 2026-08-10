<?php

namespace App\Biolinks\Support;

use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BiolinkUploadPlanGuard
{
    public function validate(
        string $uploadType,
        ?string $mime = null,
        ?string $extension = null,
        object|null $owner = null,
    ): void {
        $feature = $this->featureFor($uploadType, $mime, $extension);
        if (!$feature) {
            return;
        }

        $owner ??= request()->user();
        if (!$owner || (method_exists($owner, 'hasPermission') && $owner->hasPermission('admin'))) {
            return;
        }

        $allowed = method_exists($owner, 'getRestrictionValue') &&
            (bool) $owner->getRestrictionValue('biolinks.create', $feature);

        if (!$allowed) {
            throw ValidationException::withMessages([
                'uploadType' => __('This feature is not included in the current plan.'),
            ]);
        }
    }

    private function featureFor(
        string $uploadType,
        ?string $mime,
        ?string $extension,
    ): ?string {
        return match (true) {
            $uploadType === 'biolinkAudio' => 'profile_audio',
            $uploadType === 'biolinkCursors' => 'custom_cursor',
            $uploadType === 'biolinkMedia' && $this->isVideo($mime, $extension) => 'background_video',
            default => null,
        };
    }

    private function isVideo(?string $mime, ?string $extension): bool
    {
        if ($mime && Str::startsWith(Str::lower($mime), 'video/')) {
            return true;
        }

        return in_array(Str::lower((string) $extension), [
            'mp4',
            'webm',
            'mov',
            'm4v',
            'avi',
            'ogv',
        ], true);
    }
}
