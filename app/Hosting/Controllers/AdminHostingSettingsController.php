<?php

namespace App\Hosting\Controllers;

use App\Hosting\Contracts\HostingProvider;
use App\Hosting\Contracts\HostingSiteBuilderProvider;
use App\Hosting\Rules\Hostname;
use App\Hosting\Services\CloudflareDnsService;
use App\Hosting\Services\HostingSecretStore;
use App\Hosting\Support\AuthorizesHostingAdmin;
use Common\Settings\DotEnvEditor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;
use League\Flysystem\Ftp\FtpAdapter;
use ZipArchive;

class AdminHostingSettingsController
{
    use AuthorizesHostingAdmin;

    public function __construct(private readonly HostingSecretStore $secrets) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorizeHostingAdmin($request, 'hosting.settings');

        return response()->json(['data' => $this->safeSettings()]);
    }

    public function update(Request $request): JsonResponse
    {
        $this->authorizeHostingAdmin($request, 'hosting.settings');

        $data = $request->validate([
            'provider_driver' => ['required', Rule::in(['fake', 'mofh'])],
            'provider_timeout_seconds' => [
                'required',
                'integer',
                'min:1',
                'max:120',
            ],
            'provider_connect_timeout_seconds' => [
                'required',
                'integer',
                'min:1',
                'max:60',
            ],
            'provider_retries' => ['required', 'integer', 'min:0', 'max:10'],
            'mofh_base_url' => [
                'nullable',
                'url',
                'starts_with:https://',
                'max:500',
            ],
            'mofh_username' => ['nullable', 'string', 'max:255'],
            'mofh_password' => ['nullable', 'string', 'max:1000'],
            'mofh_ftp_host' => ['nullable', 'string', 'max:255'],
            'domain_cname_target' => [
                'required',
                'string',
                'max:253',
                'regex:/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/',
            ],
            'control_panel_url' => [
                'nullable',
                'url',
                'starts_with:https://',
                'max:500',
            ],
            'webftp_url' => [
                'nullable',
                'url',
                'starts_with:https://',
                'max:500',
            ],
            'installer_url' => [
                'nullable',
                'url',
                'starts_with:https://',
                'max:500',
            ],
            'installer_allowed_hosts' => [
                'nullable',
                'string',
                'max:1000',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $hosts = array_values(array_filter(array_map(
                        fn(string $host) => strtolower(trim($host)),
                        preg_split('/[\s,]+/', (string) $value) ?: [],
                    )));
                    if (count($hosts) > 20) {
                        $fail('No more than 20 installer hosts are allowed.');
                        return;
                    }
                    foreach ($hosts as $host) {
                        if (!filter_var($host, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME)) {
                            $fail('Every installer host must be a valid hostname without scheme or path.');
                            return;
                        }
                    }
                },
            ],
            'file_manager_url' => [
                'nullable',
                'url',
                'starts_with:https://',
                'max:500',
            ],
            'file_manager_enabled' => ['required', 'boolean'],
            'file_manager_external_fallback' => ['required', 'boolean'],
            'file_manager_host' => [
                'nullable',
                'string',
                'max:253',
                new Hostname(),
            ],
            'file_manager_port' => [
                'required',
                'integer',
                'min:1',
                'max:65535',
            ],
            'file_manager_ssl' => ['required', 'boolean'],
            'file_manager_passive' => ['required', 'boolean'],
            'file_manager_root' => ['required', 'string', 'max:255'],
            'file_manager_allow_zip_operations' => ['required', 'boolean'],
            'file_manager_editor_theme' => [
                'required',
                Rule::in(['auto', 'chrome', 'monokai', 'tomorrow_night']),
            ],
            'file_manager_code_beautify' => ['required', 'boolean'],
            'file_manager_code_suggestion' => ['required', 'boolean'],
            'file_manager_auto_complete' => ['required', 'boolean'],
            'file_manager_max_upload_bytes' => [
                'required',
                'integer',
                'min:1024',
                'max:104857600',
            ],
            'file_manager_max_archive_entries' => [
                'required',
                'integer',
                'min:1',
                'max:5000',
            ],
            'file_manager_max_archive_source_bytes' => [
                'required',
                'integer',
                'min:1024',
                'max:524288000',
            ],
            'file_manager_max_archive_bytes' => [
                'required',
                'integer',
                'min:1024',
                'max:524288000',
            ],
            'file_manager_max_extract_entries' => [
                'required',
                'integer',
                'min:1',
                'max:5000',
            ],
            'file_manager_max_extract_bytes' => [
                'required',
                'integer',
                'min:1024',
                'max:1073741824',
            ],
            'vistapanel_enabled' => ['required', 'boolean'],
            'vistapanel_url' => [
                'nullable',
                'url',
                'starts_with:https://',
                'max:500',
            ],
            'site_builder_enabled' => ['required', 'boolean'],
            'site_builder_provider' => ['required', 'string', 'max:100'],
            'site_builder_endpoint' => [
                'nullable',
                'url',
                'starts_with:https://',
                'max:500',
            ],
            'site_builder_allowed_hosts' => [
                'nullable',
                'string',
                'max:1000',
                function (
                    string $attribute,
                    mixed $value,
                    \Closure $fail,
                ): void {
                    $hosts = array_values(
                        array_filter(
                            array_map(
                                fn(string $host) => strtolower(trim($host)),
                                preg_split('/[\s,]+/', (string) $value) ?: [],
                            ),
                        ),
                    );

                    if (count($hosts) > 20) {
                        $fail(
                            'No more than 20 Site.Pro redirect hosts are allowed.',
                        );
                        return;
                    }

                    foreach ($hosts as $host) {
                        if (
                            !filter_var(
                                $host,
                                FILTER_VALIDATE_DOMAIN,
                                FILTER_FLAG_HOSTNAME,
                            )
                        ) {
                            $fail(
                                'Every Site.Pro redirect host must be a valid hostname without scheme or path.',
                            );
                            return;
                        }
                    }
                },
            ],
            'site_builder_username' => ['nullable', 'string', 'max:255'],
            'site_builder_password' => ['nullable', 'string', 'max:1000'],
            'ssl_enabled' => ['required', 'boolean'],
            'ssl_provider' => ['required', Rule::in(['manual', 'acme'])],
            'ssl_maintenance_enabled' => ['required', 'boolean'],
            'ssl_renew_before_days' => [
                'required',
                'integer',
                'min:7',
                'max:60',
            ],
            'ssl_reconcile_after_hours' => [
                'required',
                'integer',
                'min:1',
                'max:168',
            ],
            'cloudflare_enabled' => ['required', 'boolean'],
            'cloudflare_api_token' => ['nullable', 'string', 'max:1000'],
            'cloudflare_account_id' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[A-Za-z0-9_-]+$/',
            ],
            'cloudflare_zone_id' => [
                'nullable',
                'required_if:cloudflare_enabled,true',
                'string',
                'max:255',
                'regex:/^[A-Za-z0-9_-]+$/',
            ],
            'acme_enabled' => ['required', 'boolean'],
            'acme_directory_url' => [
                'nullable',
                'required_if:acme_enabled,true',
                'url',
                'starts_with:https://',
                'max:500',
                function (
                    string $attribute,
                    mixed $value,
                    \Closure $fail,
                ): void {
                    $host = strtolower(
                        (string) parse_url((string) $value, PHP_URL_HOST),
                    );
                    if (
                        !in_array(
                            $host,
                            config(
                                'hospedfree.acme.allowed_directory_hosts',
                                [],
                            ),
                            true,
                        )
                    ) {
                        $fail(
                            'The selected ACME directory host is not allowed.',
                        );
                    }
                },
            ],
            'acme_email' => [
                'nullable',
                'required_if:acme_enabled,true',
                'email',
                'max:255',
            ],
            'allowed_domains' => ['required', 'array', 'min:1', 'max:100'],
            'allowed_domains.*' => [
                'required',
                'string',
                'max:253',
                'regex:/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/',
            ],
        ]);

        $values = [
            'hospedfree_provider' => $data['provider_driver'],
            'hospedfree_provider_timeout' => $data['provider_timeout_seconds'],
            'hospedfree_provider_connect_timeout' =>
                $data['provider_connect_timeout_seconds'],
            'hospedfree_provider_retries' => $data['provider_retries'],
            'hospedfree_mofh_api_url' => $data['mofh_base_url'] ?: null,
            'hospedfree_mofh_username' => $data['mofh_username'] ?: null,
            'hospedfree_mofh_ftp_host' => $data['mofh_ftp_host'] ?: null,
            'hospedfree_domain_cname_target' => strtolower(
                trim($data['domain_cname_target']),
            ),
            'hospedfree_control_panel_url' =>
                $data['control_panel_url'] ?: null,
            'hospedfree_webftp_url' => $data['webftp_url'] ?: null,
            'hospedfree_installer_url' => $data['installer_url'] ?: null,
            'hospedfree_installer_allowed_hosts' => implode(
                ',',
                array_values(array_unique(array_filter(array_map(
                    fn(string $host) => strtolower(trim($host)),
                    preg_split(
                        '/[\s,]+/',
                        (string) ($data['installer_allowed_hosts'] ?? ''),
                    ) ?: [],
                )))),
            ),
            'hospedfree_file_manager_url' => $data['file_manager_url'] ?: null,
            'hospedfree_file_manager_enabled' => $data['file_manager_enabled'],
            'hospedfree_file_manager_external_fallback' =>
                $data['file_manager_external_fallback'],
            'hospedfree_file_manager_host' =>
                $data['file_manager_host'] ?: null,
            'hospedfree_file_manager_port' => $data['file_manager_port'],
            'hospedfree_file_manager_ssl' => $data['file_manager_ssl'],
            'hospedfree_file_manager_passive' => $data['file_manager_passive'],
            'hospedfree_file_manager_root' => $data['file_manager_root'],
            'hospedfree_file_manager_allow_zip_operations' =>
                $data['file_manager_allow_zip_operations'],
            'hospedfree_file_manager_editor_theme' =>
                $data['file_manager_editor_theme'],
            'hospedfree_file_manager_code_beautify' =>
                $data['file_manager_code_beautify'],
            'hospedfree_file_manager_code_suggestion' =>
                $data['file_manager_code_suggestion'],
            'hospedfree_file_manager_auto_complete' =>
                $data['file_manager_auto_complete'],
            'hospedfree_file_manager_max_upload_bytes' =>
                $data['file_manager_max_upload_bytes'],
            'hospedfree_file_manager_max_archive_entries' =>
                $data['file_manager_max_archive_entries'],
            'hospedfree_file_manager_max_archive_source_bytes' =>
                $data['file_manager_max_archive_source_bytes'],
            'hospedfree_file_manager_max_archive_bytes' =>
                $data['file_manager_max_archive_bytes'],
            'hospedfree_file_manager_max_extract_entries' =>
                $data['file_manager_max_extract_entries'],
            'hospedfree_file_manager_max_extract_bytes' =>
                $data['file_manager_max_extract_bytes'],
            'hospedfree_vistapanel_tools_enabled' =>
                $data['vistapanel_enabled'],
            'hospedfree_vistapanel_url' => $data['vistapanel_url'] ?: null,
            'hospedfree_site_builder_enabled' => $data['site_builder_enabled'],
            'hospedfree_site_builder_provider' =>
                $data['site_builder_provider'],
            'hospedfree_site_builder_endpoint' =>
                $data['site_builder_endpoint'] ?: null,
            'hospedfree_site_builder_allowed_hosts' => implode(
                ',',
                array_values(
                    array_unique(
                        array_filter(
                            array_map(
                                fn(string $host) => strtolower(trim($host)),
                                preg_split(
                                    '/[\s,]+/',
                                    (string) ($data[
                                        'site_builder_allowed_hosts'
                                    ] ?? ''),
                                ) ?:
                                [],
                            ),
                        ),
                    ),
                ),
            ),
            'hospedfree_site_builder_username' =>
                $data['site_builder_username'] ?: null,
            'hospedfree_ssl_enabled' => $data['ssl_enabled'],
            'hospedfree_ssl_provider' => $data['ssl_provider'],
            'hospedfree_ssl_maintenance_enabled' =>
                $data['ssl_maintenance_enabled'],
            'hospedfree_ssl_renew_before_days' =>
                $data['ssl_renew_before_days'],
            'hospedfree_ssl_reconcile_after_hours' =>
                $data['ssl_reconcile_after_hours'],
            'hospedfree_cloudflare_enabled' => $data['cloudflare_enabled'],
            'hospedfree_cloudflare_account_id' =>
                $data['cloudflare_account_id'] ?: null,
            'hospedfree_cloudflare_zone_id' =>
                $data['cloudflare_zone_id'] ?: null,
            'hospedfree_acme_enabled' => $data['acme_enabled'],
            'hospedfree_acme_directory_url' =>
                $data['acme_directory_url'] ?: null,
            'hospedfree_acme_email' => $data['acme_email'] ?: null,
            'hospedfree_allowed_domains' => implode(
                ',',
                array_map(
                    fn(string $domain) => strtolower(trim($domain)),
                    $data['allowed_domains'],
                ),
            ),
        ];

        $this->setSecretWhenProvided(
            $values,
            'hospedfree_mofh_password',
            $data['mofh_password'] ?? null,
        );
        $this->setSecretWhenProvided(
            $values,
            'hospedfree_site_builder_password',
            $data['site_builder_password'] ?? null,
        );
        if (filled($data['cloudflare_api_token'] ?? null)) {
            $this->secrets->put(
                'cloudflare_api_token',
                $data['cloudflare_api_token'],
            );
        }

        (new DotEnvEditor())->write($values);
        Cache::flush();
        Artisan::call('config:clear');

        return response()->json([
            'message' => 'Hosting settings updated.',
        ]);
    }

    public function health(
        Request $request,
        HostingProvider $provider,
    ): JsonResponse {
        $this->authorizeHostingAdmin($request, 'hosting.settings');

        $result = $provider->healthCheck();

        return response()->json([
            'data' => [
                'success' => $result->success,
                'retryable' => $result->retryable,
                'code' => $result->code,
                'status' => $result->status,
                'provider' => $provider->key(),
                'checked_at' => now()->toIso8601String(),
            ],
        ]);
    }

    public function cloudflareHealth(
        Request $request,
        CloudflareDnsService $cloudflare,
    ): JsonResponse {
        $this->authorizeHostingAdmin($request, 'hosting.settings');

        $result = $cloudflare->health();

        return response()->json([
            'data' => [
                'success' => $result->success,
                'retryable' => $result->retryable,
                'code' => $result->code,
                'status' => $result->success ? 'available' : 'unavailable',
                'provider' => 'cloudflare',
                'checked_at' => now()->toIso8601String(),
            ],
        ]);
    }

    public function siteBuilderHealth(
        Request $request,
        HostingSiteBuilderProvider $siteBuilder,
    ): JsonResponse {
        $this->authorizeHostingAdmin($request, 'hosting.settings');

        $result = $siteBuilder->healthCheck();

        return response()->json([
            'data' => [
                'success' => $result->success,
                'retryable' => $result->retryable,
                'code' => $result->code,
                'status' => $result->success ? 'available' : 'unavailable',
                'provider' => 'site-builder',
                'checked_at' => now()->toIso8601String(),
            ],
        ]);
    }

    public function fileManagerHealth(Request $request): JsonResponse
    {
        $this->authorizeHostingAdmin($request, 'hosting.settings');

        $checks = [
            'configured' => (bool) config('hospedfree.file_manager.enabled') &&
                filled(config('hospedfree.file_manager.host')),
            'ftp_extension' => extension_loaded('ftp'),
            'flysystem_adapter' => class_exists(FtpAdapter::class),
            'zip_extension' => class_exists(ZipArchive::class),
            'temporary_directory' => is_writable(sys_get_temp_dir()),
            'tls_required' => (bool) config('hospedfree.file_manager.ssl'),
        ];
        $zipRequired = (bool) config(
            'hospedfree.file_manager.allow_zip_operations',
            true,
        );
        $success = collect($checks)
            ->except($zipRequired ? [] : ['zip_extension'])
            ->every(fn(bool $available) => $available);

        return response()->json([
            'data' => [
                'success' => $success,
                'retryable' => false,
                'code' => $success
                    ? 'ok'
                    : 'file_manager_requirements_failed',
                'status' => $success ? 'available' : 'unavailable',
                'provider' => 'mofh-file-manager',
                'checked_at' => now()->toIso8601String(),
                'checks' => $checks,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function safeSettings(): array
    {
        return [
            'provider_driver' => config('hospedfree.provider.driver', 'fake'),
            'provider_timeout_seconds' => (int) config(
                'hospedfree.provider.timeout_seconds',
                15,
            ),
            'provider_connect_timeout_seconds' => (int) config(
                'hospedfree.provider.connect_timeout_seconds',
                5,
            ),
            'provider_retries' => (int) config(
                'hospedfree.provider.retries',
                2,
            ),
            'mofh_base_url' => config('hospedfree.mofh.base_url'),
            'mofh_username' => config('hospedfree.mofh.username'),
            'mofh_password_configured' => filled(
                config('hospedfree.mofh.password'),
            ),
            'mofh_ftp_host' => config('hospedfree.mofh.ftp_host'),
            'domain_cname_target' => config(
                'hospedfree.domains.cname_target',
                'ns1.byet.org',
            ),
            'control_panel_url' => config('hospedfree.tools.control_panel_url'),
            'webftp_url' => config('hospedfree.tools.webftp_url'),
            'installer_url' => config('hospedfree.tools.installer_url'),
            'installer_allowed_hosts' => implode(
                ', ',
                config('hospedfree.tools.installer_allowed_hosts', []),
            ),
            'file_manager_url' => config('hospedfree.tools.file_manager_url'),
            'file_manager_enabled' => (bool) config(
                'hospedfree.file_manager.enabled',
            ),
            'file_manager_external_fallback' => (bool) config(
                'hospedfree.file_manager.external_fallback',
                false,
            ),
            'file_manager_host' => config('hospedfree.file_manager.host'),
            'file_manager_port' => (int) config(
                'hospedfree.file_manager.port',
                21,
            ),
            'file_manager_ssl' => (bool) config(
                'hospedfree.file_manager.ssl',
                true,
            ),
            'file_manager_passive' => (bool) config(
                'hospedfree.file_manager.passive',
                true,
            ),
            'file_manager_root' => config('hospedfree.file_manager.root', '/'),
            'file_manager_allow_zip_operations' => (bool) config(
                'hospedfree.file_manager.allow_zip_operations',
                true,
            ),
            'file_manager_editor_theme' => config(
                'hospedfree.file_manager.editor_theme',
                'auto',
            ),
            'file_manager_code_beautify' => (bool) config(
                'hospedfree.file_manager.code_beautify',
                true,
            ),
            'file_manager_code_suggestion' => (bool) config(
                'hospedfree.file_manager.code_suggestion',
                true,
            ),
            'file_manager_auto_complete' => (bool) config(
                'hospedfree.file_manager.auto_complete',
                true,
            ),
            'file_manager_max_upload_bytes' => (int) config(
                'hospedfree.file_manager.max_upload_bytes',
                25_165_824,
            ),
            'file_manager_max_archive_entries' => (int) config(
                'hospedfree.file_manager.max_archive_entries',
                500,
            ),
            'file_manager_max_archive_source_bytes' => (int) config(
                'hospedfree.file_manager.max_archive_source_bytes',
                25_165_824,
            ),
            'file_manager_max_archive_bytes' => (int) config(
                'hospedfree.file_manager.max_archive_bytes',
                25_165_824,
            ),
            'file_manager_max_extract_entries' => (int) config(
                'hospedfree.file_manager.max_extract_entries',
                500,
            ),
            'file_manager_max_extract_bytes' => (int) config(
                'hospedfree.file_manager.max_extract_bytes',
                50_331_648,
            ),
            'vistapanel_enabled' => (bool) config(
                'hospedfree.vistapanel.enabled',
            ),
            'vistapanel_url' => config('hospedfree.vistapanel.cpanel_url'),
            'site_builder_enabled' => (bool) config(
                'hospedfree.site_builder.enabled',
            ),
            'site_builder_provider' => config(
                'hospedfree.site_builder.provider',
                'sitepro',
            ),
            'site_builder_endpoint' => config(
                'hospedfree.site_builder.endpoint',
            ),
            'site_builder_allowed_hosts' => implode(
                ', ',
                config('hospedfree.site_builder.allowed_redirect_hosts', []),
            ),
            'site_builder_username' => config(
                'hospedfree.site_builder.username',
            ),
            'site_builder_password_configured' => filled(
                config('hospedfree.site_builder.password'),
            ),
            'ssl_enabled' => (bool) config('hospedfree.ssl.enabled'),
            'ssl_provider' => config('hospedfree.ssl.provider', 'manual'),
            'ssl_maintenance_enabled' => (bool) config(
                'hospedfree.ssl.maintenance_enabled',
                false,
            ),
            'ssl_renew_before_days' => (int) config(
                'hospedfree.ssl.renew_before_days',
                30,
            ),
            'ssl_reconcile_after_hours' => (int) config(
                'hospedfree.ssl.reconcile_after_hours',
                24,
            ),
            'cloudflare_enabled' => (bool) config(
                'hospedfree.cloudflare.enabled',
            ),
            'cloudflare_api_token_configured' => filled(
                $this->secrets->get(
                    'cloudflare_api_token',
                    config('hospedfree.cloudflare.api_token'),
                ),
            ),
            'cloudflare_account_id' => config(
                'hospedfree.cloudflare.account_id',
            ),
            'cloudflare_zone_id' => config('hospedfree.cloudflare.zone_id'),
            'acme_enabled' => (bool) config('hospedfree.acme.enabled'),
            'acme_directory_url' => config('hospedfree.acme.directory_url'),
            'acme_email' => config('hospedfree.acme.email'),
            'allowed_domains' => config('hospedfree.allowed_domains', [
                'hsite.top',
            ]),
        ];
    }

    /**
     * @param array<string, mixed> $values
     */
    private function setSecretWhenProvided(
        array &$values,
        string $key,
        ?string $secret,
    ): void {
        if (filled($secret)) {
            $values[$key] = $secret;
        }
    }
}
