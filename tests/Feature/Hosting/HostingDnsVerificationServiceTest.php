<?php

namespace Tests\Feature\Hosting;

use App\Hosting\Data\DnsInstructionData;
use App\Hosting\Services\HostingDnsVerificationService;
use Tests\TestCase;

class HostingDnsVerificationServiceTest extends TestCase
{
    public function test_it_accepts_a_normalized_matching_cname_target(): void
    {
        $service = new HostingDnsVerificationService(
            fn(string $hostname, int $type) => [
                ['host' => $hostname, 'type' => 'CNAME', 'target' => 'NS1.BYET.ORG.'],
            ],
        );

        $result = $service->verify(new DnsInstructionData(
            type: 'CNAME',
            name: 'hash.example.com',
            value: 'ns1.byet.org',
        ));

        $this->assertTrue($result->success);
        $this->assertTrue($result->data);
    }

    public function test_it_reports_a_missing_record_as_pending_without_failure(): void
    {
        $service = new HostingDnsVerificationService(fn() => []);

        $result = $service->verify(new DnsInstructionData(
            type: 'CNAME',
            name: 'hash.example.com',
            value: 'ns1.byet.org',
        ));

        $this->assertTrue($result->success);
        $this->assertFalse($result->data);
        $this->assertFalse($result->retryable);
    }

    public function test_dns_transport_failure_is_retryable_and_has_no_raw_record(): void
    {
        $service = new HostingDnsVerificationService(fn() => false);

        $result = $service->verify(new DnsInstructionData(
            type: 'CNAME',
            name: 'hash.example.com',
            value: 'ns1.byet.org',
        ));

        $this->assertFalse($result->success);
        $this->assertTrue($result->retryable);
        $this->assertSame('dns_lookup_failed', $result->code);
        $this->assertNull($result->data);
    }
}
