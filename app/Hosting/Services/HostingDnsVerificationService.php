<?php

namespace App\Hosting\Services;

use App\Hosting\Data\DnsInstructionData;
use App\Hosting\Data\ProviderResponse;
use Closure;
use Throwable;

class HostingDnsVerificationService
{
    /**
     * @param (Closure(string, int): array<int, array<string, mixed>>|false)|null $lookup
     */
    public function __construct(private readonly ?Closure $lookup = null) {}

    /** @return ProviderResponse<bool> */
    public function verify(DnsInstructionData $instruction): ProviderResponse
    {
        if (strtoupper($instruction->type) !== 'CNAME') {
            return ProviderResponse::failure(
                'dns_record_type_not_supported',
                'The DNS record type cannot be verified automatically.',
            );
        }

        $name = $this->normalizeHostname($instruction->name);
        $expected = $this->normalizeHostname($instruction->value);

        if (!$name || !$expected) {
            return ProviderResponse::failure(
                'dns_instruction_invalid',
                'The DNS verification instruction is invalid.',
            );
        }

        try {
            $records = $this->lookup
                ? ($this->lookup)($name, DNS_CNAME)
                : @dns_get_record($name, DNS_CNAME);
        } catch (Throwable) {
            return $this->lookupFailed();
        }

        if ($records === false) {
            return $this->lookupFailed();
        }

        $verified = collect($records)->contains(function (mixed $record) use (
            $expected,
        ): bool {
            if (!is_array($record)) {
                return false;
            }

            return $this->normalizeHostname((string) ($record['target'] ?? '')) ===
                $expected;
        });

        return ProviderResponse::ok(
            $verified,
            $verified
                ? 'The DNS verification record is active.'
                : 'The DNS verification record has not propagated yet.',
        );
    }

    /** @return ProviderResponse<null> */
    private function lookupFailed(): ProviderResponse
    {
        return ProviderResponse::failure(
            'dns_lookup_failed',
            'The DNS lookup could not be completed.',
            retryable: true,
        );
    }

    private function normalizeHostname(string $hostname): ?string
    {
        $hostname = strtolower(trim(rtrim($hostname, '.')));

        return filter_var(
            $hostname,
            FILTER_VALIDATE_DOMAIN,
            FILTER_FLAG_HOSTNAME,
        )
            ? $hostname
            : null;
    }
}
