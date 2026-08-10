import {User} from '@app/gen/schemas/user';
import {MenuConfig, MenuItemConfig} from '@common/menus/menu-config';
import {useSettings} from '@ui/settings/use-settings';
import dot from 'dot-object';
import {useMemo} from 'react';
import {useAuth} from '../auth/use-auth';

type CustomMenuAccess = {
  settings: ReturnType<typeof useSettings>;
  user: User | null;
  hasPermission: (permission: string) => boolean;
  hasRole: (roleId: number) => boolean;
};

export function useCustomMenu(menuOrPosition?: string | MenuConfig) {
  const settings = useSettings();
  const {user, hasPermission, hasRole} = useAuth();

  return useMemo(() => {
    if (!menuOrPosition) {
      return null;
    }

    const menu =
      typeof menuOrPosition === 'string'
        ? settings.menus?.find(s => s.positions?.includes(menuOrPosition))
        : menuOrPosition;

    return menu
      ? filterCustomMenu(menu, {
          settings,
          user,
          hasPermission,
          hasRole,
        })
      : null;
  }, [hasPermission, settings, menuOrPosition, user, hasRole]);
}

function filterCustomMenu(
  menu: MenuConfig,
  {settings, user, hasPermission, hasRole}: CustomMenuAccess,
): MenuConfig {
  const items = menu.items.reduce<MenuItemConfig[]>((filtered, item) => {
    const hasRoles = (item.roles || []).every(roleId => hasRole(roleId));
    const hasPermissions = (item.permissions || []).every(permission =>
      hasPermission(permission),
    );
    const hasSettings =
      !item.settings ||
      Object.entries(item.settings).every(([key, value]) => {
        return dot.pick(key, settings) == value;
      });

    if (
      !item.action ||
      !hasRoles ||
      !hasPermissions ||
      !hasSettings ||
      !subscriptionStatusMatches(item, user)
    ) {
      return filtered;
    }

    filtered.push({
      ...item,
      action: user?.id
        ? item.action.replace(/{currentUser}/g, `${user.id}`)
        : item.action,
    });
    return filtered;
  }, []);

  return {...menu, items};
}

function subscriptionStatusMatches(
  item: MenuItemConfig,
  user?: User | null,
): boolean {
  if (!item.subscriptionStatus) {
    return true;
  }
  const hasActiveSubscription = !!user?.subscription?.active;
  if (item.subscriptionStatus === 'subscribed') {
    return hasActiveSubscription;
  }
  return !hasActiveSubscription;
}
