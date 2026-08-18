<?php

namespace App\Hosting\Services;

use App\Hosting\Contracts\HostingPanelProvider;
use App\Hosting\Contracts\HostingSiteBuilderProvider;
use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Data\PanelSessionData;
use App\Hosting\Data\ProviderResult;
use App\Hosting\Models\HostingAccount;

class HostingToolsService
{
    public function __construct(
        private SafeToolUrl $safeToolUrl,
        private HostingSiteBuilderProvider $siteBuilderProvider,
        private HostingPanelProvider $panelProvider,
    ) {}

    /**
     * @return array<int, array<string, mixed>>
     */
    public function catalog(HostingAccount $account): array
    {
        $capabilities = $this->capabilities($account);

        return [
            $this->tool(
                'control-panel',
                'Painel de hospedagem',
                $capabilities['control_panel'],
            ),
            $this->tool(
                'webftp',
                'Gerenciador de arquivos (WebFTP)',
                $capabilities['webftp'],
            ),
            $this->tool('installer', 'Instalador', $capabilities['installer']),
            $this->tool(
                'site-builder',
                'Construtor de site',
                $capabilities['site_builder'],
            ),
            $this->tool('ssl', 'SSL', $capabilities['ssl']),
            $this->tool('mysql', 'MySQL', $capabilities['mysql']),
            $this->tool('stats', 'Estatísticas', (bool) config('hospedfree.vistapanel.enabled', false)),
        ];
    }

    /** @return array<string, bool> */
    public function capabilities(HostingAccount $account): array
    {
        $fileManager =
            (bool) config('hospedfree.file_manager.enabled') &&
            $account->hasCredentials();

        return [
            'control_panel' => filled(
                $this->accountToolUrl($account, 'control_panel_url'),
            ),
            'webftp' =>
                $fileManager ||
                filled($this->accountToolUrl($account, 'webftp_url')),
            'installer' =>
                $this->installerSessionConfigured($account) ||
                filled($this->accountToolUrl($account, 'installer_url')),
            'file_manager' => $fileManager,
            'site_builder' =>
                $this->siteBuilderConfigured() && $account->hasCredentials(),
            'ssl' => (bool) config('hospedfree.ssl.enabled', false),
            'mysql' => (bool) config(
                'hospedfree.vistapanel.enabled',
                false,
            ),
            'stats' => (bool) config(
                'hospedfree.vistapanel.enabled',
                false,
            ),
        ];
    }

    public function open(
        HostingAccount $account,
        string $tool,
        ?string $domain = null,
    ): ProviderResult
    {
        return match ($tool) {
            'control-panel' => $this->staticTool(
                $account,
                $tool,
                $this->accountToolUrl($account, 'control_panel_url'),
            ),
            'webftp' => $this->webftp($account),
            'installer' => $this->installer($account),
            'file-manager' => $this->staticTool($account, $tool, $this->configuredSafeUrl('file_manager_url')),
            'site-builder' => $this->siteBuilder($account, $domain),
            default => ProviderResult::failure('tool_not_found', 'This hosting tool is not available.'),
        };
    }

    private function staticTool(HostingAccount $account, string $tool, ?string $url): ProviderResult
    {
        $url = $this->safeToolUrl->validate($url);

        if (!$url) {
            return ProviderResult::failure('tool_not_configured', 'This hosting tool is not configured.');
        }

        return ProviderResult::ok(
            message: 'Tool link loaded.',
            remoteAccountId: $account->provider_account_id,
            toolLinks: [$tool => $url],
        );
    }

    private function siteBuilder(
        HostingAccount $account,
        ?string $domain = null,
    ): ProviderResult
    {
        if (!$this->siteBuilderConfigured()) {
            return ProviderResult::failure('site_builder_not_configured', 'The site builder is not configured.');
        }

        if (!$account->hasCredentials()) {
            return ProviderResult::failure('credentials_unavailable', 'Hosting credentials are not available yet.');
        }

        $result = $this->siteBuilderProvider->createSession(
            new PanelAccountCredentialsData(
                username: (string) $account->username,
                password: (string) $account->credential_secret,
                ftpHost: $account->ftp_host ?: config('hospedfree.mofh.ftp_host'),
            ),
            $domain ?: ($account->active_domain ?: $account->fqdn),
        );

        if (!$result->success || !$result->data) {
            return ProviderResult::failure(
                $result->code,
                $result->safeMessage,
                $result->retryable,
            );
        }

        return ProviderResult::ok(
            message: 'Site builder session created.',
            remoteAccountId: $account->provider_account_id,
            toolLinks: ['site-builder' => $result->data->url],
        );
    }

    private function webftp(HostingAccount $account): ProviderResult
    {
        if (
            (bool) config('hospedfree.file_manager.enabled') &&
            $account->hasCredentials()
        ) {
            return ProviderResult::ok(
                message: 'File manager loaded.',
                remoteAccountId: $account->provider_account_id,
                toolLinks: [
                    'webftp' => "/dashboard/hosting/{$account->id}/files",
                ],
            );
        }

        return $this->staticTool(
            $account,
            'webftp',
            $this->accountToolUrl($account, 'webftp_url'),
        );
    }

    private function installer(HostingAccount $account): ProviderResult
    {
        if (!$this->installerSessionConfigured($account)) {
            return $this->staticTool(
                $account,
                'installer',
                $this->accountToolUrl($account, 'installer_url'),
            );
        }

        $result = $this->panelProvider->createInstallerSession(
            new PanelAccountCredentialsData(
                username: (string) $account->username,
                password: (string) $account->credential_secret,
                ftpHost: $account->ftp_host ?: config('hospedfree.mofh.ftp_host'),
            ),
        );

        if (!$result->success || !$result->data instanceof PanelSessionData) {
            if ($result->code === 'installer_redirect_contains_password') {
                return $this->staticTool(
                    $account,
                    'installer',
                    $this->accountToolUrl($account, 'control_panel_url'),
                );
            }

            return ProviderResult::failure(
                $result->code,
                $result->safeMessage,
                $result->retryable,
            );
        }

        $url = $this->safeToolUrl->validate($result->data->url);
        if (!$url) {
            return ProviderResult::failure(
                'installer_session_invalid',
                'The application installer returned an invalid session.',
            );
        }

        return ProviderResult::ok(
            message: 'Installer session created.',
            remoteAccountId: $account->provider_account_id,
            toolLinks: ['installer' => $url],
        );
    }

    private function configuredSafeUrl(string $key): ?string
    {
        $value = config("hospedfree.tools.$key");

        return is_string($value) ? $this->safeToolUrl->validate($value) : null;
    }

    private function accountToolUrl(
        HostingAccount $account,
        string $key,
    ): ?string {
        $attribute = match ($key) {
            'control_panel_url' => 'control_panel_url',
            'webftp_url' => 'webftp_url',
            'installer_url' => 'installer_url',
            default => null,
        };
        $accountUrl = $attribute ? $account->getAttribute($attribute) : null;

        $configured = $this->configuredSafeUrl($key) ?:
            $this->safeToolUrl->validate(
                is_string($accountUrl) ? $accountUrl : null,
            );

        if ($key === 'control_panel_url' && !$configured) {
            $panelUrl = config('hospedfree.vistapanel.cpanel_url');
            $configured = $this->safeToolUrl->validate(
                is_string($panelUrl) ? $panelUrl : null,
            );
        }

        return $configured;
    }

    private function installerSessionConfigured(HostingAccount $account): bool
    {
        $panelUrl = config('hospedfree.vistapanel.cpanel_url');

        return (bool) config('hospedfree.vistapanel.enabled') &&
            $account->hasCredentials() &&
            filled(
                $this->safeToolUrl->validate(
                    is_string($panelUrl) ? $panelUrl : null,
                ),
            );
    }

    private function siteBuilderConfigured(): bool
    {
        return (bool) config('hospedfree.site_builder.enabled')
            && config('hospedfree.site_builder.provider') === 'sitepro'
            && filled(config('hospedfree.site_builder.endpoint'))
            && filled(config('hospedfree.site_builder.username'))
            && filled(config('hospedfree.site_builder.password'));
    }

    /**
     * @return array<string, mixed>
     */
    private function tool(string $key, string $label, bool $available): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'available' => $available,
        ];
    }

}
