<?php

namespace App\Hosting\Contracts;

use App\Hosting\Data\CreateHostingAccountData;
use App\Hosting\Data\ProviderResult;

interface HostingProvider
{
    public function key(): string;

    public function healthCheck(): ProviderResult;

    public function checkDomainAvailability(string $domain): ProviderResult;

    public function createAccount(CreateHostingAccountData $data): ProviderResult;

    public function getAccount(
        string $remoteAccountId,
        ?string $panelUsername = null,
    ): ProviderResult;

    public function suspendAccount(string $remoteAccountId, ?string $reason = null): ProviderResult;

    public function unsuspendAccount(string $remoteAccountId): ProviderResult;

    public function deleteAccount(string $remoteAccountId): ProviderResult;

    public function changePassword(string $remoteAccountId, string $password): ProviderResult;

    public function changePackage(string $remoteAccountId, string $remotePackage): ProviderResult;

    public function toolLinks(string $remoteAccountId): ProviderResult;
}
