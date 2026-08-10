<?php

namespace Tests\Unit;

use App\Biolinks\Support\BiolinkAiQuotaPolicy;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class BiolinkAiQuotaPolicyTest extends TestCase
{
    public function test_workspace_owner_restrictions_define_monthly_quota(): void
    {
        $owner = $this->createMock(User::class);
        $owner->method('hasPermission')->with('admin')->willReturn(false);
        $owner
            ->method('getRestrictionValue')
            ->willReturnCallback(
                fn(string $permission, string $restriction) => match ($restriction) {
                    'ai_assistant' => true,
                    'ai_monthly_requests' => 25,
                },
            );

        $quota = app(BiolinkAiQuotaPolicy::class)->forOwner($owner);

        $this->assertSame(['enabled' => true, 'total' => 25], $quota);
    }

    public function test_admin_has_unlimited_quota(): void
    {
        $owner = $this->createMock(User::class);
        $owner->method('hasPermission')->with('admin')->willReturn(true);

        $this->assertSame(
            ['enabled' => true, 'total' => null],
            app(BiolinkAiQuotaPolicy::class)->forOwner($owner),
        );
    }

    public function test_reservation_is_rejected_at_monthly_limit(): void
    {
        $this->expectException(ValidationException::class);

        app(BiolinkAiQuotaPolicy::class)->assertCanReserve(
            ['enabled' => true, 'total' => 10],
            10,
        );
    }
}
