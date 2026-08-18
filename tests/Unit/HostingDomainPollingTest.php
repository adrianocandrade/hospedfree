<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class HostingDomainPollingTest extends TestCase
{
    public function test_domain_polling_is_bounded_and_only_retries_transient_results(): void
    {
        $queries = file_get_contents(
            dirname(__DIR__, 2) .
                '/resources/client/hosting/hosting-queries.ts',
        );

        $this->assertStringContainsString('hostingPollLimit = 10', $queries);
        $this->assertStringContainsString(
            "result.availability === 'unavailable' && result.retryable",
            $queries,
        );
        $this->assertStringContainsString(
            'transientDomainStatuses.has(domain.status)',
            $queries,
        );
        $this->assertStringNotContainsString(
            "domain.status !== 'active'",
            $queries,
        );
    }

    public function test_hosting_list_does_not_trigger_remote_reconciliation_from_the_browser(): void
    {
        $list = file_get_contents(
            dirname(__DIR__, 2) .
                '/resources/client/hosting/hosting-list-page.tsx',
        );

        $this->assertStringNotContainsString(
            'reconcileHostingAccountOptions',
            $list,
        );
        $this->assertStringNotContainsString('items.find(', $list);
    }

    public function test_backend_maintenance_processes_every_eligible_hosting_account(): void
    {
        $maintenance = file_get_contents(
            dirname(__DIR__, 2) .
                '/app/Hosting/Console/ProcessHostingMaintenance.php',
        );

        $this->assertGreaterThanOrEqual(
            2,
            substr_count($maintenance, '->eachById('),
        );
        $this->assertStringContainsString(
            'ReconcileHostingDomains::dispatch',
            $maintenance,
        );
    }
}
