import {adminRoutes} from '@app/admin/admin-routes';
import {
  blogCategoryQueryOptions,
  blogIndexQueryOptions,
  blogPostQueryOptions,
} from '@app/blog/blog-queries';
import {dashboardRoutes} from '@app/dashboard/dashboard-routes';
import {getSettingsPreviewMode} from '@common/admin/settings/preview/use-settings-preview-mode';
import {authRoutes} from '@common/auth/auth-routes';
import {getAccountSettingsOptions} from '@common/auth/ui/account-settings/account-settings-queries';
import {auth} from '@common/auth/use-auth';
import {billingPageChildRoutes} from '@common/billing/billing-page/billing-page-routes';
import {checkoutRoutes} from '@common/billing/checkout/checkout-routes';
import {
  RootErrorElement,
  RootRoute,
  rootRouteMiddleware,
} from '@common/core/common-provider';
import {commonRoutes} from '@common/core/common-routes';
import {queryClient} from '@common/http/query-client';
import {notificationRoutes} from '@common/notifications/notification-routes';
import {NotFoundPage} from '@common/ui/not-found-page/not-found-page';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {FullPageLoader} from '@ui/progress/full-page-loader';
import {searchParamsFromUrl} from '@ui/utils/urls/search-params-from-url';
import {createBrowserRouter, redirect} from 'react-router';
import {Fragment} from 'react/jsx-runtime';

export const appRouter = createBrowserRouter(
  [
    {
      id: 'root',
      element: <RootRoute />,
      errorElement: <RootErrorElement />,
      middleware: rootRouteMiddleware,
      hydrateFallbackElement: <FullPageLoader screen />,
      children: [
        {
          path: '/',
          loader: async () => {
            const isLoggedIn = auth.isLoggedIn;

            if (
              !isLoggedIn &&
              getBootstrapData().settings.homepage.type === 'loginPage' &&
              !getSettingsPreviewMode().isInsideSettingsPreview
            ) {
              return redirect('/login');
            }

            if (
              isLoggedIn &&
              !getSettingsPreviewMode().isInsideSettingsPreview
            ) {
              return redirect(getBootstrapData().auth_redirect_uri);
            }

            return null;
          },
          lazy: () => import('@app/landing/landing-page'),
        },
        ...authRoutes({
          loginRoute: {
            lazy: () => import('@app/auth/app-login-page'),
          },
          registerRoute: {
            lazy: () => import('@app/auth/app-register-page'),
          },
          accountSettingsRoute: {
            lazy: () =>
              import('@app/account-settings/app-account-settings-page'),
            loader: () =>
              queryClient.ensureQueryData(getAccountSettingsOptions()),
            children: [
              {
                index: true,
                element: <Fragment />,
                middleware: [
                  () => {
                    throw redirect('/account-settings/general');
                  },
                ],
              },
              {
                path: 'general',
                lazy: async () => {
                  const {GeneralSettingsPanel} =
                    await import('@app/account-settings/app-account-settings-page');
                  return {Component: GeneralSettingsPanel};
                },
              },
              {
                path: 'security',
                lazy: async () => {
                  const {SecuritySettingsPanel} =
                    await import('@app/account-settings/app-account-settings-page');
                  return {Component: SecuritySettingsPanel};
                },
              },
              {
                path: 'activity',
                lazy: async () => {
                  const {ActivitySettingsPanel} =
                    await import('@app/account-settings/app-account-settings-page');
                  return {Component: ActivitySettingsPanel};
                },
              },
              {
                path: 'api-keys',
                loader: () => redirect('/account-settings/general'),
              },

              // billing
              {
                path: 'billing',
                lazy: () =>
                  import('@app/account-settings/app-billing-page-layout'),
                handle: {billingRoutePrefix: '/account-settings'}, // for generating breadcrumbs, see billing-page-routes.tsx
                children: billingPageChildRoutes({
                  indexRoute: {
                    lazy: () =>
                      import('@app/account-settings/billing/billing-page'),
                  },
                }),
              },

              {
                path: 'workspaces',
                loader: () => redirect('/account-settings/general'),
              },
              {
                path: 'workspaces/:workspaceId/*',
                loader: () => redirect('/account-settings/general'),
              },
              {
                path: 'webhooks/*',
                loader: () => redirect('/account-settings/general'),
              },
            ],
          },
        }),
        ...notificationRoutes,
        ...dashboardRoutes,
        ...adminRoutes,
        ...checkoutRoutes,
        {
          path: 'blog',
          lazy: () => import('@app/blog/blog-index-page'),
          loader: ({request}) =>
            queryClient.ensureQueryData(
              blogIndexQueryOptions(searchParamsFromUrl(request.url)),
            ),
        },
        {
          path: 'blog/categoria/:categorySlug',
          lazy: () => import('@app/blog/blog-category-page'),
          loader: ({params, request}) =>
            queryClient.ensureQueryData(
              blogCategoryQueryOptions(
                params.categorySlug!,
                searchParamsFromUrl(request.url),
              ),
            ),
        },
        {
          path: 'blog/:postSlug',
          lazy: () => import('@app/blog/blog-post-page'),
          loader: ({params}) =>
            queryClient.ensureQueryData(blogPostQueryOptions(params.postSlug!)),
        },

        // pricing and common billing overrides
        {
          path: 'billing',
          element: <Fragment />,
          middleware: [
            () => {
              throw redirect('/account-settings/billing');
            },
          ],
        },
        {
          path: 'pricing',
          element: <Fragment />,
          middleware: [
            () => {
              throw redirect('/planos');
            },
          ],
        },
        {
          path: 'planos',
          lazy: () => import('@app/hosting/hosting-plans-page'),
        },
        {
          path: 'construtor-de-sites',
          lazy: () => import('@app/landing/site-builder-page'),
        },
        {
          path: 'criador-de-sites',
          element: <Fragment />,
          middleware: [
            () => {
              throw redirect('/construtor-de-sites');
            },
          ],
        },
        {
          path: 'faq',
          lazy: () => import('@app/hosting/knowledge-page'),
        },
        {
          path: 'faq/:articleSlug',
          lazy: () => import('@app/hosting/knowledge-page'),
        },
        {
          path: 'knowledge',
          lazy: () => import('@app/hosting/knowledge-page'),
        },
        {
          path: 'knowledge/:articleSlug',
          lazy: () => import('@app/hosting/knowledge-page'),
        },

        ...commonRoutes,
        {path: '/link-pages/:pageId/preview', element: <NotFoundPage />},
        {path: '*', element: <NotFoundPage />},
      ],
    },
  ],
  {
    basename: getBootstrapData().settings.html_base_uri,
  },
);
