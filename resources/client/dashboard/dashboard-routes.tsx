import {auth} from '@common/auth/use-auth';
import {redirect, RouteObject} from 'react-router';

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    middleware: [
      () => {
        if (!auth.isLoggedIn) {
          throw redirect('/login');
        }
      },
    ],
    lazy: () => import('@app/dashboard/layout/app-dasbboard-layout'),
    handle: {belinkRoutesType: 'dashboard'},
    children: [
      {
        index: true,
        lazy: () => import('@app/dashboard/dashboard-home-page'),
      },
      {
        path: 'hosting',
        lazy: () => import('@app/hosting/hosting-list-page'),
      },
      {
        path: 'hosting/plans',
        lazy: () => import('@app/hosting/hosting-dashboard-plans-page'),
      },
      {
        path: 'hosting/new',
        lazy: () => import('@app/hosting/hosting-create-page'),
      },
      {
        path: 'hosting/:accountId',
        lazy: () => import('@app/hosting/hosting-details-layout'),
        children: [
          {
            index: true,
            lazy: () => import('@app/hosting/hosting-overview-tab'),
          },
          {
            path: 'created',
            lazy: () => import('@app/hosting/hosting-created-page'),
          },
          {
            path: 'credentials',
            lazy: () => import('@app/hosting/hosting-credentials-tab'),
          },
          {
            path: 'domains',
            lazy: () => import('@app/hosting/hosting-domains-tab'),
          },
          {
            path: 'files',
            lazy: () => import('@app/hosting/hosting-files-tab'),
          },
          {
            path: 'databases',
            lazy: () => import('@app/hosting/hosting-databases-tab'),
          },
          {
            path: 'ssl',
            lazy: () => import('@app/hosting/hosting-ssl-tab'),
          },
          {
            path: 'tools',
            lazy: () => import('@app/hosting/hosting-tools-tab'),
          },
          {
            path: 'site-builder',
            lazy: () => import('@app/hosting/hosting-site-builder-tab'),
          },
          {
            path: 'settings',
            lazy: () => import('@app/hosting/hosting-settings-tab'),
          },
        ],
      },

      {
        path: 'support',
        lazy: () => import('@app/hosting/support-page'),
      },
      {
        path: 'knowledge',
        loader: () => redirect('/faq'),
      },
    ],
  },
];
