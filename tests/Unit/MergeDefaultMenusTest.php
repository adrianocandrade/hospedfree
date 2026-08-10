<?php

namespace Tests\Unit;

use Common\Core\Install\MergeDefaultMenus;
use PHPUnit\Framework\TestCase;

class MergeDefaultMenusTest extends TestCase
{
    public function test_it_adds_only_missing_menu_positions_and_preserves_existing_menus(): void
    {
        $currentMenus = [
            [
                'id' => 'custom-landing',
                'name' => 'Custom landing menu',
                'positions' => ['landing-page-navbar'],
                'items' => [
                    ['id' => 'custom-home', 'label' => 'Início personalizado'],
                ],
            ],
        ];

        $defaultMenus = [
            [
                'id' => 'default-landing',
                'name' => 'Default landing menu',
                'positions' => ['landing-page-navbar'],
                'items' => [],
            ],
            [
                'id' => 'default-dashboard',
                'name' => 'Dashboard menu',
                'positions' => ['dashboard-primary'],
                'items' => [],
            ],
            [
                'id' => 'default-admin',
                'name' => 'Admin menu',
                'positions' => ['admin-sidebar'],
                'items' => [],
            ],
        ];

        $result = (new MergeDefaultMenus())->execute(
            $currentMenus,
            $defaultMenus,
        );

        $this->assertSame($currentMenus[0], $result[0]);
        $this->assertCount(3, $result);
        $this->assertSame(
            ['landing-page-navbar', 'dashboard-primary', 'admin-sidebar'],
            collect($result)->pluck('positions')->flatten()->values()->all(),
        );
    }

    public function test_it_is_idempotent(): void
    {
        $currentMenus = [
            [
                'id' => 'current-dashboard',
                'name' => 'Dashboard menu',
                'positions' => ['dashboard-primary'],
                'items' => [],
            ],
        ];
        $defaultMenus = [
            [
                'id' => 'default-dashboard',
                'name' => 'Dashboard menu',
                'positions' => ['dashboard-primary'],
                'items' => [],
            ],
            [
                'id' => 'default-admin',
                'name' => 'Admin menu',
                'positions' => ['admin-sidebar'],
                'items' => [],
            ],
        ];

        $merger = new MergeDefaultMenus();
        $firstResult = $merger->execute($currentMenus, $defaultMenus);

        $this->assertSame(
            $firstResult,
            $merger->execute($firstResult, $defaultMenus),
        );
    }

    public function test_it_restores_only_the_missing_part_of_a_multi_position_menu(): void
    {
        $currentMenus = [
            [
                'id' => 'custom-shared',
                'name' => 'Custom shared menu',
                'positions' => ['dashboard-primary'],
                'items' => [['id' => 'custom-item']],
            ],
        ];
        $defaultMenus = [
            [
                'id' => 'default-shared',
                'name' => 'Default shared menu',
                'positions' => ['dashboard-primary', 'dashboard-mobile'],
                'items' => [['id' => 'default-item']],
            ],
        ];

        $result = (new MergeDefaultMenus())->execute(
            $currentMenus,
            $defaultMenus,
        );

        $this->assertSame($currentMenus[0], $result[0]);
        $this->assertSame(['dashboard-mobile'], $result[1]['positions']);
    }
}
