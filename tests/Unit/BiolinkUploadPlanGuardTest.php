<?php

namespace Tests\Unit;

use App\Biolinks\Support\BiolinkUploadPlanGuard;
use Common\Files\Uploads\Uploads;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class BiolinkUploadPlanGuardTest extends TestCase
{
    public function test_video_upload_requires_background_video_feature(): void
    {
        $request = Request::create('/api/v1/file-entries', 'POST');
        $request->setUserResolver(fn() => new UploadPlanGuardUser([]));
        $this->app->instance('request', $request);

        $this->expectException(ValidationException::class);
        app(BiolinkUploadPlanGuard::class)->validate(
            'biolinkMedia',
            'video/mp4',
            'mp4',
            new UploadPlanGuardUser([]),
        );
    }

    public function test_image_upload_does_not_require_video_feature(): void
    {
        $request = Request::create('/api/v1/file-entries', 'POST');
        $request->setUserResolver(fn() => new UploadPlanGuardUser([]));
        $this->app->instance('request', $request);

        app(BiolinkUploadPlanGuard::class)->validate(
            'biolinkMedia',
            'image/webp',
            'webp',
            new UploadPlanGuardUser([]),
        );

        $this->assertTrue(true);
    }

    public function test_audio_and_cursor_use_their_own_restrictions(): void
    {
        $request = Request::create('/api/v1/file-entries', 'POST');
        $request->setUserResolver(
            fn() => new UploadPlanGuardUser([
                'profile_audio' => true,
                'custom_cursor' => true,
            ]),
        );
        $this->app->instance('request', $request);

        app(BiolinkUploadPlanGuard::class)->validate(
            'biolinkAudio',
            'audio/mpeg',
            'mp3',
            new UploadPlanGuardUser([
                'profile_audio' => true,
                'custom_cursor' => true,
            ]),
        );
        app(BiolinkUploadPlanGuard::class)->validate(
            'biolinkCursors',
            'image/png',
            'png',
            new UploadPlanGuardUser([
                'profile_audio' => true,
                'custom_cursor' => true,
            ]),
        );

        $this->assertTrue(true);
    }

    public function test_biolink_upload_types_fall_back_to_local_backend(): void
    {
        $settings = settings();
        $uploadingTypes = $settings->get('uploading.types', []);
        $originalTypes = $uploadingTypes;
        $originalBackends = $settings->get('uploading.backends', []);

        foreach (
            [
                'biolinkMedia',
                'biolinkAudio',
                'biolinkDocuments',
                'biolinkCursors',
            ]
            as $name
        ) {
            $uploadingTypes[$name] = [];
        }

        $settings->set('uploading.backends', [
            ['id' => 'test-local', 'name' => 'Local', 'type' => 'local'],
        ]);
        $settings->set('uploading.types', $uploadingTypes);

        try {
            foreach (
                [
                    'biolinkMedia',
                    'biolinkAudio',
                    'biolinkDocuments',
                    'biolinkCursors',
                ]
                as $name
            ) {
                $this->assertNotEmpty(Uploads::type($name)?->backendIds, $name);
            }
        } finally {
            $settings->set('uploading.backends', $originalBackends);
            $settings->set('uploading.types', $originalTypes);
        }
    }
}

class UploadPlanGuardUser
{
    public function __construct(private readonly array $restrictions) {}

    public function hasPermission(string $permission): bool
    {
        return false;
    }

    public function getRestrictionValue(
        string $permissionName,
        string $restriction,
    ): bool|null {
        return $this->restrictions[$restriction] ?? null;
    }
}
