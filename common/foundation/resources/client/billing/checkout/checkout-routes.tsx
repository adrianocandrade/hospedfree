import {authGuard} from '@common/auth/guards/auth-route';
import {RouteObject} from 'react-router';

export const checkoutRoutes: RouteObject[] = [
  {
    path: 'checkout/:productId/:priceId',
    loader: () => authGuard(),
    lazy: () => import('@common/billing/checkout/checkout'),
  },
  {
    path: 'checkout/:productId/:priceId/stripe/done',
    loader: () => authGuard(),
    lazy: () => import('@common/billing/checkout/stripe/checkout-stripe-done'),
  },
  {
    path: 'checkout/:productId/:priceId/paypal/done',
    loader: () => authGuard(),
    lazy: () => import('@common/billing/checkout/paypal/checkout-paypal-done'),
  },
];
