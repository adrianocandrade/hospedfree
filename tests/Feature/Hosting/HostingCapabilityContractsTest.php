<?php

namespace Tests\Feature\Hosting;

use App\Hosting\Contracts\HostingDatabaseProvider;
use App\Hosting\Contracts\HostingDomainProvider;
use App\Hosting\Contracts\HostingFileManagerProvider;
use App\Hosting\Contracts\HostingPanelProvider;
use App\Hosting\Contracts\HostingSiteBuilderProvider;
use App\Hosting\Contracts\HostingSslProvider;
use App\Hosting\Data\HostingDomainData;
use App\Hosting\Data\HostingStatsData;
use App\Hosting\Data\PanelSessionData;
use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Providers\FakeHostingCapabilitiesProvider;
use App\Hosting\Providers\AcmeHostingSslProvider;
use App\Hosting\Providers\UnavailableHostingCapabilitiesProvider;
use App\Hosting\Providers\MofhHostingDomainProvider;
use App\Hosting\Providers\MofhHostingDatabaseProvider;
use App\Hosting\Providers\MofhHostingFileManagerProvider;
use App\Hosting\Providers\MofhHostingPanelProvider;
use App\Hosting\Providers\SiteProHostingSiteBuilderProvider;
use Tests\TestCase;

class HostingCapabilityContractsTest extends TestCase
{
    public function test_fake_driver_resolves_provider_neutral_capabilities(): void
    {
        config()->set('hospedfree.provider.driver', 'fake');

        $contracts = [
            HostingPanelProvider::class,
            HostingDomainProvider::class,
            HostingDatabaseProvider::class,
            HostingFileManagerProvider::class,
            HostingSslProvider::class,
            HostingSiteBuilderProvider::class,
        ];

        foreach ($contracts as $contract) {
            $this->assertInstanceOf(
                FakeHostingCapabilitiesProvider::class,
                app($contract),
            );
        }

        $panel = app(HostingPanelProvider::class);
        $credentials = new PanelAccountCredentialsData(
            'hf-test',
            'test-password',
        );
        $session = $panel->createPanelSession($credentials);
        $stats = $panel->stats($credentials);
        $domains = app(HostingDomainProvider::class)->listDomains(
            'hf-test',
            'site.hsite.top',
        );

        $this->assertTrue($session->success);
        $this->assertInstanceOf(PanelSessionData::class, $session->data);
        $this->assertStringStartsWith('https://', $session->data->url);
        $this->assertInstanceOf(HostingStatsData::class, $stats->data);
        $this->assertInstanceOf(HostingDomainData::class, $domains->data[0]);
    }

    public function test_real_driver_does_not_fall_back_to_fake_capability_data(): void
    {
        config()->set('hospedfree.provider.driver', 'mofh');
        config()->set('hospedfree.ssl.provider', 'acme');
        config()->set('hospedfree.file_manager.enabled', false);
        config()->set('hospedfree.file_manager.host', null);
        config()->set('hospedfree.site_builder.enabled', true);
        config()->set('hospedfree.site_builder.provider', 'sitepro');

        $domainProvider = app(HostingDomainProvider::class);
        $panelProvider = app(HostingPanelProvider::class);
        $fileProvider = app(HostingFileManagerProvider::class);
        $databaseProvider = app(HostingDatabaseProvider::class);
        $sslProvider = app(HostingSslProvider::class);
        $siteBuilderProvider = app(HostingSiteBuilderProvider::class);
        $result = $fileProvider->listDirectory(
            new PanelAccountCredentialsData('hf-test', 'test-password'),
            'htdocs',
        );

        $this->assertInstanceOf(
            MofhHostingDomainProvider::class,
            $domainProvider,
        );
        $this->assertInstanceOf(
            MofhHostingPanelProvider::class,
            $panelProvider,
        );
        $this->assertInstanceOf(
            MofhHostingFileManagerProvider::class,
            $fileProvider,
        );
        $this->assertInstanceOf(
            MofhHostingDatabaseProvider::class,
            $databaseProvider,
        );
        $this->assertInstanceOf(AcmeHostingSslProvider::class, $sslProvider);
        $this->assertInstanceOf(
            SiteProHostingSiteBuilderProvider::class,
            $siteBuilderProvider,
        );
        $this->assertFalse($result->success);
        $this->assertSame('file_manager_not_configured', $result->code);
        $this->assertNull($result->data);
    }
}
