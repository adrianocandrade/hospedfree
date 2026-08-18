import {storeStripeSubscriptionDetailsLocally} from '@app/gen/stripe';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {loadStripe, PaymentIntent} from '@stripe/stripe-js';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
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
  const navigate = useNavigate();
  const {billing} = useSettings();

  const [params] = useSearchParams();
  const returnPath = getSafeCheckoutReturnPath(params.get('returnTo'));
  const hostingOrder = getSafeHostingOrderReference(params.get('hostingOrder'));
  const premiumPurchase = getSafePremiumPurchaseReference(
    params.get('premiumPurchase'),
  );

  const type = params.get('payment_intent_client_secret')
    ? 'paymentIntent'
    : 'setupIntent';
  const clientSecret =
    type === 'paymentIntent'
      ? params.get('payment_intent_client_secret')
      : params.get('setup_intent_client_secret');
  const subscriptionId = params.get('subscriptionId');

  const [messageConfig, setMessageConfig] =
    useState<BillingRedirectMessageConfig>();

  const stripeInitiated = useRef<boolean>(false);

  useEffect(() => {
    const stripePublicKey = billing?.stripe_public_key;
    if (stripeInitiated.current || !stripePublicKey) return;

    stripeInitiated.current = true;

    void (async () => {
      try {
        const stripe = await loadStripe(stripePublicKey);

        if (
          !stripe ||
          !clientSecret ||
          (type === 'setupIntent' && !subscriptionId)
        ) {
          setMessageConfig(getAsyncFailureConfig());
          return;
        }

        const intent =
          type === 'paymentIntent'
            ? (await stripe.retrievePaymentIntent(clientSecret)).paymentIntent
            : (await stripe.retrieveSetupIntent(clientSecret)).setupIntent;

        if (intent?.status === 'succeeded') {
          await storeStripeSubscriptionDetailsLocally(
            {
              intent_type: type,
              intent_id: intent.id,
              subscription_id: subscriptionId ?? undefined,
            },
            checkoutHeaders(hostingOrder, premiumPurchase),
          );
          setMessageConfig(
            getRedirectMessageConfig(
              'succeeded',
              productId,
              priceId,
              returnPath,
              hostingOrder,
              premiumPurchase,
            ),
          );
          window.location.href = returnPath;
          return;
        }

        setMessageConfig(
          getRedirectMessageConfig(
            intent?.status,
            productId,
            priceId,
            returnPath,
            hostingOrder,
            premiumPurchase,
          ),
        );
      } catch {
        setMessageConfig(getAsyncFailureConfig());
      }
    })();
  }, [
    billing?.stripe_public_key,
    clientSecret,
    priceId,
    productId,
    subscriptionId,
    type,
    returnPath,
    hostingOrder,
    premiumPurchase,
  ]);

  if (!clientSecret) {
    navigate('/');
    return null;
  }

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
  status?: PaymentIntent.Status,
  productId?: string,
  priceId?: string,
  returnPath = '/billing',
  hostingOrder?: string,
  premiumPurchase?: string,
): BillingRedirectMessageConfig {
  switch (status) {
    case 'succeeded':
      return {
        message: <Trans message="Subscription successful!" />,
        status: 'success',
        buttonLabel: <Trans message="Return to site" />,
        link: returnPath,
      };
    case 'processing':
      return {
        message: (
          <Trans message="Payment processing. We'll update you when payment is received." />
        ),
        status: 'success',
        buttonLabel: <Trans message="Return to site" />,
        link: returnPath,
      };
    case 'requires_payment_method':
      return {
        message: (
          <Trans message="Payment failed. Please try another payment method." />
        ),
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
    default:
      return {
        message: <Trans message="Something went wrong" />,
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
