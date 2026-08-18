<?php

namespace App\Hosting\Contracts;

use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Data\ProviderResponse;

interface HostingDomainProvider
{
    /** @return ProviderResponse<list<\App\Hosting\Data\HostingDomainData>> */
    public function listDomains(string $remoteAccountId, string $primaryDomain): ProviderResponse;

    /** @return ProviderResponse<\App\Hosting\Data\HostingDomainData> */
    public function checkDomain(string $remoteAccountId, string $domain): ProviderResponse;

    /** @return ProviderResponse<list<\App\Hosting\Data\DnsInstructionData>> */
    public function domainVerificationInstructions(
        string $remoteAccountId,
        string $domain,
    ): ProviderResponse;

    /** @return ProviderResponse<\App\Hosting\Data\HostingDomainData> */
    public function addCustomDomain(
        PanelAccountCredentialsData $account,
        string $domain,
    ): ProviderResponse;

    /** @return ProviderResponse<\App\Hosting\Data\HostingDomainData> */
    public function addSubdomain(
        PanelAccountCredentialsData $account,
        string $label,
        string $zone,
    ): ProviderResponse;

    /** @return ProviderResponse<bool> */
    public function deleteDomain(
        PanelAccountCredentialsData $account,
        string $domain,
        string $type,
    ): ProviderResponse;
}
