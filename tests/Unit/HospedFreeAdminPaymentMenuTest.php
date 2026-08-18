<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class HospedFreeAdminPaymentMenuTest extends TestCase
{
    public function test_admin_menu_links_to_payment_gateway_settings(): void
    {
        $settings = require dirname(__DIR__, 2).'/resources/defaults/default-settings.php';
        $menusSetting = $this->firstMatching(
            $settings,
            fn (array $setting) => ($setting['name'] ?? null) === 'menus',
        );

        $this->assertNotNull($menusSetting);

        $menus = json_decode($menusSetting['value'], true, 512, JSON_THROW_ON_ERROR);
        $adminMenu = $this->firstMatching(
            $menus,
            fn (array $menu) => in_array('admin-sidebar', $menu['positions'] ?? [], true),
        );

        $this->assertNotNull($adminMenu);

        $paymentItems = array_values(array_filter(
            $adminMenu['items'],
            fn (array $item) => ($item['id'] ?? null) === 'hf-admin-payments',
        ));

        $this->assertCount(1, $paymentItems);
        $this->assertSame('Pagamentos', $paymentItems[0]['label']);
        $this->assertSame('/admin/settings/subscriptions', $paymentItems[0]['action']);
        $this->assertSame(['settings.update'], $paymentItems[0]['permissions']);
    }

    /**
     * @template T of array
     *
     * @param  array<T>  $items
     * @param  callable(T): bool  $callback
     * @return T|null
     */
    private function firstMatching(array $items, callable $callback): ?array
    {
        foreach ($items as $item) {
            if (is_array($item) && $callback($item)) {
                return $item;
            }
        }

        return null;
    }
}
