<?php

namespace App\Hosting\Providers;

use App\Hosting\Contracts\HostingProvider;
use App\Hosting\Data\CreateHostingAccountData;
use App\Hosting\Data\ProviderResult;

class FakeHostingProvider implements HostingProvider
{
    public function key(): string
    {
        return 'fake';
    }

    public function healthCheck(): ProviderResult
    {
        return ProviderResult::ok('Provider is ready.', status: 'ready');
    }

    public function checkDomainAvailability(string $domain): ProviderResult
    {
        return ProviderResult::ok('Domain is available.', status: 'available');
    }

    public function createAccount(CreateHostingAccountData $data): ProviderResult
    {
        $remoteAccountId = 'hf_' . substr(hash('sha256', $data->idempotencyKey), 0, 12);

        return ProviderResult::ok(
            message: 'Account provisioned.',
            remoteAccountId: $remoteAccountId,
            status: 'active',
            username: $remoteAccountId,
            controlPanelUrl: $this->configuredToolUrl('control_panel_url'),
            webftpUrl: $this->configuredToolUrl('webftp_url'),
            installerUrl: $this->configuredToolUrl('installer_url'),
            ftpHost: 'ftp.' . $data->domain,
            sqlHost: 'sql.' . $data->domain,
        );
    }

    public function getAccount(
        string $remoteAccountId,
        ?string $panelUsername = null,
    ): ProviderResult
    {
        return ProviderResult::ok(
            message: 'Account synchronized.',
            remoteAccountId: $remoteAccountId,
            status: 'active',
            username: $remoteAccountId,
        );
    }

    public function suspendAccount(string $remoteAccountId, ?string $reason = null): ProviderResult
    {
        return ProviderResult::ok('Account suspended.', $remoteAccountId, 'suspended');
    }

    public function unsuspendAccount(string $remoteAccountId): ProviderResult
    {
        return ProviderResult::ok('Account active.', $remoteAccountId, 'active');
    }

    public function deleteAccount(string $remoteAccountId): ProviderResult
    {
        return ProviderResult::ok('Account deleted.', $remoteAccountId, 'deleted');
    }

    public function changePassword(string $remoteAccountId, string $password): ProviderResult
    {
        return ProviderResult::ok('Password changed.', $remoteAccountId, 'active');
    }

    public function changePackage(string $remoteAccountId, string $remotePackage): ProviderResult
    {
        return ProviderResult::ok('Package changed.', $remoteAccountId, 'active');
    }

    public function toolLinks(string $remoteAccountId): ProviderResult
    {
        return ProviderResult::ok(
            message: 'Tool links loaded.',
            remoteAccountId: $remoteAccountId,
            toolLinks: array_filter([
                'control_panel' => $this->configuredToolUrl('control_panel_url'),
                'webftp' => $this->configuredToolUrl('webftp_url'),
                'installer' => $this->configuredToolUrl('installer_url'),
            ]),
        );
    }

    private function configuredToolUrl(string $key): ?string
    {
        $url = config("hospedfree.tools.$key");
        return is_string($url) && $url !== '' ? $url : null;
    }
}
