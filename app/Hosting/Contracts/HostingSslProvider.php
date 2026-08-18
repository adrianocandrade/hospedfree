<?php

namespace App\Hosting\Contracts;

use App\Hosting\Data\ProviderResponse;

interface HostingSslProvider
{
    /** @return ProviderResponse<\App\Hosting\Data\HostingSslOrderData> */
    public function requestCertificate(string $remoteAccountId, string $domain): ProviderResponse;

    /** @return ProviderResponse<\App\Hosting\Data\HostingSslOrderData> */
    public function certificateStatus(string $remoteAccountId, string $remoteOrderId): ProviderResponse;

    /** @return ProviderResponse<\App\Hosting\Data\HostingSslOrderData> */
    public function validateCertificate(
        string $remoteAccountId,
        string $remoteOrderId,
        ?string $managedDnsRecordId = null,
    ): ProviderResponse;

    /** @return ProviderResponse<bool> */
    public function revokeCertificate(string $remoteAccountId, string $remoteOrderId): ProviderResponse;
}
