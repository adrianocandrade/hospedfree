import {adminLogsRoutes} from '@common/admin/logging/admin-logs-routes';
import {adminRolesRoutes} from '@common/admin/roles/admin-roles-routes';
import {commonAdminSettingsRoutes} from '@common/admin/settings/common-admin-settings-routes';
import {adminBillingRoutes} from '@common/admin/subscriptions/admin-billing-routes';
import {adminLocalizationsRoutes} from '@common/admin/translations/admin-localizations-routes';
import {adminUsersRoutes} from '@common/admin/users/admin-users-routes';
import {adminBlogRoutes} from '@app/admin/blog/admin-blog-routes';
import {authGuard} from '@common/auth/guards/auth-route';
import {redirect, RouteObject} from 'react-router';

export const adminRoutes: RouteObject[] = [
  {
    path: 'admin',
    loader: () => authGuard({permission: 'admin.access'}),
    lazy: () => import('@common/admin/admin-layout'),
    children: [
      {
        index: true,
        loader: () => redirect('/admin/hosting'),
      },
      {
        path: 'hosting',
        lazy: () => import('@app/admin/hosting/admin-hosting-page'),
        loader: () => authGuard({permission: 'hosting.operations'}),
      },
      {
        path: 'hosting/plans',
        lazy: () => import('@app/admin/hosting/admin-hosting-plans-page'),
        loader: () => authGuard({permission: 'hosting.settings'}),
      },
      {
        path: 'hosting/premium-subdomains',
        lazy: () => import('@app/admin/hosting/admin-premium-subdomains-page'),
        loader: () => authGuard({permission: 'hosting.settings'}),
      },
      {
        path: 'support',
        lazy: () => import('@app/admin/hosting/admin-support-page'),
        loader: () => authGuard({permission: 'support.manage'}),
      },
      {
        path: 'knowledge',
        lazy: () => import('@app/admin/hosting/admin-knowledge-page'),
        loader: () => authGuard({permission: 'knowledge.manage'}),
      },
      ...Object.values(adminUsersRoutes),
      ...Object.values(adminRolesRoutes),
      ...Object.values(adminBillingRoutes),
      ...Object.values(adminLocalizationsRoutes),
      ...Object.values(adminLogsRoutes),
      ...Object.values(adminBlogRoutes),
      commonAdminSettingsRoutes(
        [
          {
            path: 'hosting',
            lazy: () =>
              import('@app/admin/hosting/admin-hosting-settings-page'),
          },
        ],
        {
          general: {
            lazy: () => import('@app/admin/settings/app-general-settings'),
          },
          captcha: {
            lazy: () => import('@app/admin/settings/captcha-settings'),
          },
        },
      ),
    ],
  },
];
