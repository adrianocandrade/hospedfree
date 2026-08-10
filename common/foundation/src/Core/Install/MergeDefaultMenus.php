<?php

namespace Common\Core\Install;

class MergeDefaultMenus
{
    /**
     * Add default menus only for positions that are not already configured.
     *
     * Existing menus are never replaced. If a default menu serves multiple
     * positions, only its missing positions are restored.
     */
    public function execute(array $currentMenus, array $defaultMenus): array
    {
        $menus = $currentMenus;
        $existingPositions = $this->positionsFrom($menus);

        foreach ($defaultMenus as $defaultMenu) {
            $defaultPositions = array_values(
                array_filter(
                    $defaultMenu['positions'] ?? [],
                    fn($position) => is_string($position) && $position !== '',
                ),
            );

            $missingPositions = array_values(
                array_diff($defaultPositions, $existingPositions),
            );

            if (empty($missingPositions)) {
                continue;
            }

            $menuToAdd = $defaultMenu;
            $menuToAdd['positions'] = $missingPositions;
            $menus[] = $menuToAdd;
            $existingPositions = array_values(
                array_unique([...$existingPositions, ...$missingPositions]),
            );
        }

        return $menus;
    }

    private function positionsFrom(array $menus): array
    {
        $positions = [];

        foreach ($menus as $menu) {
            foreach (($menu['positions'] ?? []) as $position) {
                if (is_string($position) && $position !== '') {
                    $positions[] = $position;
                }
            }
        }

        return array_values(array_unique($positions));
    }
}
