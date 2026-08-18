<?php

namespace Tests\Feature\Hosting;

use App\Hosting\Controllers\AdminHostingSettingsController;
use App\Hosting\Providers\FakeHostingProvider;
use App\Hosting\Services\CloudflareDnsService;
use App\Hosting\Data\ProviderResponse;
use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Data\SiteBuilderSessionData;
use App\Hosting\Contracts\HostingSiteBuilderProvider;
use App\Hosting\Providers\SiteProHostingSiteBuilderProvider;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class AdminHostingSettingsControllerTest extends TestCase
{
    public function test_valid_panel_url_and_file_manager_hostname_do_not_crash_validation(): void
    {
        $user = $this->getMockBuilder(User::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['hasPermission'])
            ->getMock();
        $user->method('hasPermission')->willReturn(true);

        $request = Request::create(
            '/api/v1/admin/hosting/settings',
            'PUT',
            [
                'control_panel_url' => 'https://cpanel.hsite.top',
                'file_manager_host' => 'ftpupload.net',
            ],
        );
        $request->setUserResolver(fn() => $user);

        try {
            app(AdminHostingSettingsController::class)->update($request);
            $this->fail('The incomplete settings payload should not validate.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey(
                'provider_driver',
                $exception->errors(),
            );
            $this->assertArrayNotHasKey(
                'control_panel_url',
                $exception->errors(),
            );
            $this->assertArrayNotHasKey(
                'file_manager_host',
                $exception->errors(),
            );
        }
    }

    public function test_health_response_only_contains_normalized_safe_fields(): void
    {
        $user = $this->getMockBuilder(User::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['hasPermission'])
            ->getMock();
        $user
            ->expects($this->once())
            ->method('hasPermission')
            ->with('hosting.settings')
            ->willReturn(true);

        $request = Request::create(
            '/api/v1/admin/hosting/settings/provider-health',
            'POST',
        );
        $request->setUserResolver(fn() => $user);

        $response = app(AdminHostingSettingsController::class)->health(
            $request,
            new FakeHostingProvider(),
        );
        $payload = $response->getData(true);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(
            [
                'success',
                'retryable',
                'code',
                'status',
                'provider',
                'checked_at',
            ],
            array_keys($payload['data']),
        );
        $this->assertTrue($payload['data']['success']);
        $this->assertSame('fake', $payload['data']['provider']);
        $this->assertArrayNotHasKey('message', $payload['data']);
    }

    public function test_cloudflare_health_response_does_not_expose_configuration(): void
    {
        $user = $this->getMockBuilder(User::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['hasPermission'])
            ->getMock();
        $user->method('hasPermission')->willReturn(true);
        $request = Request::create(
            '/api/v1/admin/hosting/settings/cloudflare-health',
            'POST',
        );
        $request->setUserResolver(fn() => $user);
        $cloudflare = $this->getMockBuilder(CloudflareDnsService::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['health'])
            ->getMock();
        $cloudflare
            ->method('health')
            ->willReturn(
                ProviderResponse::ok(['zone_name' => 'private.example']),
            );

        $response = app(
            AdminHostingSettingsController::class,
        )->cloudflareHealth($request, $cloudflare);
        $payload = $response->getData(true);

        $this->assertSame(
            [
                'success',
                'retryable',
                'code',
                'status',
                'provider',
                'checked_at',
            ],
            array_keys($payload['data']),
        );
        $this->assertSame('cloudflare', $payload['data']['provider']);
        $this->assertStringNotContainsString(
            'private.example',
            json_encode($payload),
        );
    }

    public function test_site_builder_health_response_only_contains_safe_fields(): void
    {
        $user = $this->getMockBuilder(User::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['hasPermission'])
            ->getMock();
        $user->method('hasPermission')->willReturn(true);
        $request = Request::create(
            '/api/v1/admin/hosting/settings/site-builder-health',
            'POST',
        );
        $request->setUserResolver(fn() => $user);
        $builder = $this->createMock(HostingSiteBuilderProvider::class);
        $builder->method('healthCheck')->willReturn(ProviderResponse::ok(true));

        $response = app(
            AdminHostingSettingsController::class,
        )->siteBuilderHealth($request, $builder);
        $payload = $response->getData(true);

        $this->assertSame(
            [
                'success',
                'retryable',
                'code',
                'status',
                'provider',
                'checked_at',
            ],
            array_keys($payload['data']),
        );
        $this->assertSame('site-builder', $payload['data']['provider']);
        $this->assertArrayNotHasKey('message', $payload['data']);
    }

    public function test_file_manager_health_reports_only_safe_requirements(): void
    {
        config()->set('hospedfree.file_manager.enabled', true);
        config()->set('hospedfree.file_manager.host', 'ftp.example.test');
        config()->set('hospedfree.file_manager.ssl', true);

        $user = $this->getMockBuilder(User::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['hasPermission'])
            ->getMock();
        $user->method('hasPermission')->willReturn(true);
        $request = Request::create(
            '/api/v1/admin/hosting/settings/file-manager-health',
            'POST',
        );
        $request->setUserResolver(fn() => $user);

        $response = app(
            AdminHostingSettingsController::class,
        )->fileManagerHealth($request);
        $payload = $response->getData(true);

        $this->assertSame('mofh-file-manager', $payload['data']['provider']);
        $this->assertSame(
            [
                'configured',
                'ftp_extension',
                'flysystem_adapter',
                'zip_extension',
                'temporary_directory',
                'tls_required',
            ],
            array_keys($payload['data']['checks']),
        );
        $this->assertStringNotContainsString(
            'ftp.example.test',
            json_encode($payload),
        );
    }

    public function test_site_builder_health_uses_a_non_session_head_request(): void
    {
        config()->set(
            'hospedfree.site_builder.endpoint',
            'https://builder.example.test',
        );
        config()->set('hospedfree.site_builder.username', 'builder-user');
        config()->set('hospedfree.site_builder.password', 'builder-secret');
        Http::fake([
            'builder.example.test/api/requestLogin' => Http::response('', 405),
        ]);

        $result = app(SiteProHostingSiteBuilderProvider::class)->healthCheck();

        $this->assertTrue($result->success);
        Http::assertSent(function ($request) {
            return $request->method() === 'HEAD' &&
                $request->url() ===
                    'https://builder.example.test/api/requestLogin' &&
                $request->body() === '';
        });
    }

    public function test_site_builder_accepts_only_login_hash_on_an_allowed_redirect_host(): void
    {
        config()->set(
            'hospedfree.site_builder.endpoint',
            'https://builder-api.example.test/api/requestLogin',
        );
        config()->set('hospedfree.site_builder.username', 'builder-user');
        config()->set('hospedfree.site_builder.password', 'builder-secret');
        config()->set('hospedfree.site_builder.allowed_redirect_hosts', [
            'builder.example.test',
        ]);
        Http::fake([
            'builder-api.example.test/api/requestLogin' => Http::response([
                'url' =>
                    'https://builder.example.test/editor?login_hash=opaque-session',
                'mlUrl' =>
                    'https://builder.example.test/editor?login_hash=opaque-session',
            ]),
        ]);

        $result = app(SiteProHostingSiteBuilderProvider::class)->createSession(
            new PanelAccountCredentialsData(
                username: 'panel-user',
                password: 'hosting-password',
                ftpHost: 'ftp.example.test',
            ),
            'site.example.test',
        );

        $this->assertTrue($result->success);
        $this->assertInstanceOf(SiteBuilderSessionData::class, $result->data);
        $this->assertSame(
            'https://builder.example.test/editor?login_hash=opaque-session',
            $result->data->url,
        );
        $this->assertStringNotContainsString(
            'hosting-password',
            $result->data->url,
        );
        Http::assertSent(
            fn($request) => $request->url() ===
                'https://builder-api.example.test/api/requestLogin' &&
                $request['username'] === 'panel-user' &&
                $request['password'] === 'hosting-password',
        );
    }
}
