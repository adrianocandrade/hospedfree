import {storePaypalSubscriptionDetailsLocally} from '@app/gen/paypal';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {Trans} from '@ui/i18n/trans';
import {useEffect, useRef, useState} from 'react';
import {useSearchParams} from 'react-router';
import {
  BillingRedirectMessage,
  BillingRedirectMessageConfig,
} from '../../billing-redirect-message';
import {CheckoutLayout} from '../checkout-layout';
import {CheckoutProductSummary} from '../checkout-product-summary';
import {
  getSafeHostingOrderReference,
  getSafePremiumPurchaseReference,
  getSafeCheckoutReturnPath,
  withHostingOrderReference,
  withPremiumPurchaseReference,
  withCheckoutReturnPath,
} from '../checkout-return-path';

export function Component() {
  const {productId, priceId} = useRequiredParams(['productId', 'priceId']);
  const [params] = useSearchParams();
  const returnPath = getSafeCheckoutReturnPath(params.get('returnTo'));
  const hostingOrder = getSafeHostingOrderReference(params.get('hostingOrder'));
  const premiumPurchase = getSafePremiumPurchaseReference(
    params.get('premiumPurchase'),
  );
  const alreadyStoredLocally = useRef(false);

  const [messageConfig, setMessageConfig] =
    useState<BillingRedirectMessageConfig>();

  useEffect(() => {
    const subscriptionId = params.get('subscriptionId');
    const status = params.get('status');

    if (alreadyStoredLocally.current) {
      return;
    }

    if (subscriptionId && status === 'success') {
      void (async () => {
        try {
          await storePaypalSubscriptionDetailsLocally(
            {
              paypal_subscription_id: subscriptionId,
            },
            checkoutHeaders(hostingOrder, premiumPurchase),
          );
          setMessageConfig(
            getRedirectMessageConfig(
              'success',
              productId,
              priceId,
              returnPath,
              hostingOrder,
              premiumPurchase,
            ),
          );
          window.location.href = returnPath;
        } catch {
          setMessageConfig(getAsyncFailureConfig());
        }
      })();
    } else {
      setMessageConfig(
        getRedirectMessageConfig(
          status,
          productId,
          priceId,
          returnPath,
          hostingOrder,
          premiumPurchase,
        ),
      );
    }
    alreadyStoredLocally.current = true;
  }, [priceId, productId, params, returnPath, hostingOrder, premiumPurchase]);

  return (
    <CheckoutLayout>
      <BillingRedirectMessage config={messageConfig} />
      <CheckoutProductSummary showBillingLine={false} />
    </CheckoutLayout>
  );
}

function getAsyncFailureConfig(): BillingRedirectMessageConfig {
  return {
    message: (
      <Trans message="O pagamento pode ter sido recebido, mas a confirmação local ainda não terminou. Tente confirmar novamente." />
    ),
    status: 'error',
    buttonLabel: <Trans message="Tentar confirmar novamente" />,
    link: window.location.href,
  };
}

function getRedirectMessageConfig(
  status?: 'success' | 'error' | string | null,
  productId?: string,
  priceId?: string,
  returnPath = '/billing',
  hostingOrder?: string,
  premiumPurchase?: string,
): BillingRedirectMessageConfig {
  switch (status) {
    case 'success':
      return {
        message: <Trans message="Subscription successful!" />,
        status: 'success',
        buttonLabel: <Trans message="Return to site" />,
        link: returnPath,
      };
    default:
      return {
        message: <Trans message="Something went wrong. Please try again." />,
        status: 'error',
        buttonLabel: <Trans message="Go back" />,
        link: errorLink(
          productId,
          priceId,
          returnPath,
          hostingOrder,
          premiumPurchase,
        ),
      };
  }
}

function errorLink(
  productId?: string,
  priceId?: string,
  returnPath = '/billing',
  hostingOrder?: string,
  premiumPurchase?: string,
): string {
  return productId && priceId
    ? withPremiumPurchaseReference(
        withHostingOrderReference(
          withCheckoutReturnPath(
            `/checkout/${productId}/${priceId}`,
            returnPath,
          ),
          hostingOrder,
        ),
        premiumPurchase,
      )
    : '/';
}

function checkoutHeaders(
  hostingOrder?: string,
  premiumPurchase?: string,
): {headers: Record<string, string>} | undefined {
  if (hostingOrder) return {headers: {'X-Hosting-Order': hostingOrder}};
  if (premiumPurchase) {
    return {headers: {'X-Premium-Subdomain-Purchase': premiumPurchase}};
  }
  return undefined;
}
