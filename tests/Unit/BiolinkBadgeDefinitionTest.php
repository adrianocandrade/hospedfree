<?php

namespace Tests\Unit;

use App\Biolinks\Models\BiolinkBadgeDefinition;
use App\Biolinks\Models\BiolinkBadgeGrant;
use App\Biolinks\Resources\BiolinkBadgeDefinitionResource;
use Tests\TestCase;

class BiolinkBadgeDefinitionTest extends TestCase
{
    public function test_claimable_event_requires_an_open_window(): void
    {
        $badge = new BiolinkBadgeDefinition([
            'is_active' => true,
            'grant_mode' => 'claim',
            'starts_at' => now()->subHour(),
            'claim_until' => now()->addHour(),
        ]);

        $this->assertTrue($badge->isClaimable());
    }

    public function test_claimable_event_is_closed_before_or_after_window(): void
    {
        $before = new BiolinkBadgeDefinition([
            'is_active' => true,
            'grant_mode' => 'claim',
            'starts_at' => now()->addHour(),
            'claim_until' => now()->addHours(2),
        ]);
        $after = new BiolinkBadgeDefinition([
            'is_active' => true,
            'grant_mode' => 'claim',
            'starts_at' => now()->subHours(2),
            'claim_until' => now()->subHour(),
        ]);

        $this->assertFalse($before->isClaimable());
        $this->assertFalse($after->isClaimable());
    }

    public function test_recurring_badge_resolves_a_stable_edition_year(): void
    {
        $configured = new BiolinkBadgeDefinition([
            'metadata' => ['edition_year' => 2027],
            'starts_at' => '2026-06-01 00:00:00',
            'repeat_yearly' => true,
        ]);
        $fromWindow = new BiolinkBadgeDefinition([
            'starts_at' => '2025-12-01 00:00:00',
            'repeat_yearly' => true,
        ]);
        $withoutEdition = new BiolinkBadgeDefinition([
            'repeat_yearly' => false,
            'show_year' => false,
        ]);

        $this->assertSame(2027, $configured->editionYear());
        $this->assertSame(2025, $fromWindow->editionYear());
        $this->assertNull($withoutEdition->editionYear());
    }

    public function test_grant_normalizes_and_reports_collected_editions(): void
    {
        $grant = new BiolinkBadgeGrant([
            'edition_years' => [2026, '2025', 2026, 'invalid'],
        ]);

        $this->assertSame([2025, 2026], $grant->claimedEditionYears());
        $this->assertTrue($grant->includesEdition(2025));
        $this->assertFalse($grant->includesEdition(2024));
        $this->assertSame(2026, $grant->latestEditionYear());
    }

    public function test_resource_includes_translated_badge_copy(): void
    {
        app()->setLocale('pt-BR');
        $badge = new BiolinkBadgeDefinition([
            'id' => 1,
            'key' => 'summer',
            'kind' => 'event',
            'category' => 'seasonal',
            'access_type' => 'free',
            'label_key' => 'biolink.badges.summer.label',
            'description_key' => 'biolink.badges.summer.description',
            'grant_mode' => 'claim',
            'repeat_yearly' => true,
            'show_year' => true,
            'is_active' => true,
        ]);

        $resource = (new BiolinkBadgeDefinitionResource($badge))->toArray(
            request(),
        );

        $this->assertSame('Verão', $resource['label_text']);
        $this->assertSame(
            'Edição anual de verão coletada durante o evento.',
            $resource['description_text'],
        );
    }
}
