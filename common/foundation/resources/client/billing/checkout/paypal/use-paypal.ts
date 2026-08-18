import {listProductsOptions} from '@common/admin/subscriptions/products-queries';
import {apiClient} from '@common/http/query-client';
import {loadScript} from '@paypal/paypal-js';
import {useSuspenseQuery} from '@tanstack/react-query';
import {useSettings} from '@ui/settings/use-settings';
import {useEffect, useRef, useState} from 'react';

interface UsePaypalProps {
  productId?: string;
  priceId?: string;
  returnPath?: string;
  hostingOrder?: string;
  premiumPurchase?: string;
}
export function usePaypal({
  productId,
  priceId,
  returnPath,
  hostingOrder,
  premiumPurchase,
}: UsePaypalProps) {
  const productsQuery = useSuspenseQuery(listProductsOptions());
  const products = productsQuery.data?.data;
  const paypalLoadStarted = useRef<boolean>(false);
  const paypalButtonsRendered = useRef<boolean>(false);
  const [paypalIsLoaded, setPaypalIsLoaded] = useState(false);
  const paypalElementRef = useRef<HTMLDivElement>(null);
  const {base_url, billing} = useSettings();

  const stripeEnabled = billing?.stripe?.enable;
  const paypalEnabled = billing?.paypal?.enable;
  const public_key = billing?.paypal?.public_key;

  useEffect(() => {
    if (!paypalEnabled || !public_key || paypalLoadStarted.current) return;
    loadScript({
      clientId: public_key,
      intent: 'subscription',
      vault: true,
      disableFunding: stripeEnabled ? 'card' : undefined,
    }).then(() => {
      setPaypalIsLoaded(true);
    });
    paypalLoadStarted.current = true;
  }, [public_key, paypalEnabled, stripeEnabled]);

  useEffect(() => {
    if (
      !paypalIsLoaded ||
      !window.paypal?.Buttons ||
      !paypalElementRef.current ||
      !products.length ||
      !productId ||
      !priceId ||
      paypalButtonsRendered.current
    )
      return;

    const product = products.find(p => `${p.id}` === productId);
    const price = product?.prices?.find(p => `${p.id}` === priceId);

    if (!price?.paypal_id) {
      return;
    }

    const doneUrl = (status: 'success' | 'error', subscriptionId?: unknown) => {
      const params = new URLSearchParams({status});
      if (typeof subscriptionId === 'string' && subscriptionId) {
        params.set('subscriptionId', subscriptionId);
      }
      if (returnPath) params.set('returnTo', returnPath);
      if (hostingOrder) params.set('hostingOrder', hostingOrder);
      if (premiumPurchase) params.set('premiumPurchase', premiumPurchase);
      return `${base_url}/checkout/${productId}/${priceId}/paypal/done?${params}`;
    };

    window.paypal
      .Buttons({
        style: {
          label: 'pay',
        },
        createSubscription: async (data, actions) => {
          const subscriptionId = await actions.subscription.create({
            application_context: {
              shipping_preference: 'NO_SHIPPING',
              return_url: doneUrl('success', data.subscriptionID),
              cancel_url: doneUrl('error'),
            },
            plan_id: price.paypal_id!,
            custom_id: hostingOrder
              ? `hosting_order:${hostingOrder}`
              : premiumPurchase
                ? `premium_subdomain_purchase:${premiumPurchase}`
                : undefined,
          });

          if (hostingOrder) {
            await apiClient.post(
              'billing/paypal/register-hosting-subscription-attempt',
              {
                paypal_subscription_id: subscriptionId,
                hosting_order: hostingOrder,
              },
            );
          } else if (premiumPurchase) {
            await apiClient.post(
              'billing/paypal/register-premium-subdomain-subscription-attempt',
              {
                paypal_subscription_id: subscriptionId,
                premium_purchase: premiumPurchase,
              },
            );
          }

          return subscriptionId;
        },
        onApprove: (data, actions) => {
          actions.redirect(doneUrl('success', data.subscriptionID));
          return Promise.resolve();
        },
        onError: () => {
          location.href = doneUrl('error');
        },
      })
      .render(paypalElementRef.current)
      .then(() => {
        paypalButtonsRendered.current = true;
      });
  }, [
    productId,
    priceId,
    paypalIsLoaded,
    base_url,
    products,
    returnPath,
    hostingOrder,
    premiumPurchase,
  ]);

  return {
    paypalElementRef,
    stripeIsEnabled: public_key != null && paypalEnabled,
  };
}
