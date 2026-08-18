<?php

namespace App\Hosting\Data;

final readonly class HostingSslOrderData
{
    /**
     * @param list<DnsInstructionData> $dnsInstructions
     */
    public function __construct(
        public string $status,
        public ?string $remoteOrderId = null,
        public array $dnsInstructions = [],
        public ?string $validUntil = null,
        public ?string $privateKey = null,
        public ?string $csr = null,
        public ?string $certificate = null,
        public ?string $caCertificate = null,
    ) {}
}
