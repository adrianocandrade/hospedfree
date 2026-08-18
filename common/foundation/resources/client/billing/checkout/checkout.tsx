import {listProductsOptions} from '@common/admin/subscriptions/products-queries';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {Navigate, useSearchParams} from 'react-router';
import {CheckoutLayout} from './checkout-layout';
import {CheckoutProductSummary} from './checkout-product-summary';
import {
  getSafeHostingOrderReference,
  getSafePremiumPurchaseReference,
  getSafeCheckoutReturnPath,
  withHostingOrderReference,
  withPremiumPurchaseReference,
  withCheckoutReturnPath,
} from './checkout-return-path';
import {usePaypal} from './paypal/use-paypal';
import {StripeElementsForm} from './stripe/stripe-elements-form';

export function Component() {
  const {productId, priceId} = useRequiredParams(['productId', 'priceId']);
  const [searchParams] = useSearchParams();
  const returnPath = getSafeCheckoutReturnPath(searchParams.get('returnTo'));
  const hostingOrder = getSafeHostingOrderReference(
    searchParams.get('hostingOrder'),
  );
  const premiumPurchase = getSafePremiumPurchaseReference(
    searchParams.get('premiumPurchase'),
  );
  const productsQuery = useSuspenseQuery(listProductsOptions());
  const {paypalElementRef} = usePaypal({
    productId,
    priceId,
    returnPath,
    hostingOrder,
    premiumPurchase,
  });
  const {base_url, billing} = useSettings();

  const product = productsQuery.data?.data.find(p => `${p.id}` === productId);
  const price = product?.prices?.find(p => `${p.id}` === priceId);

  // make sure product and price exists in backend
  if (!product || !price) {
    return <Navigate to="/pricing" replace />;
  }

  const formType =
    product.trial_period_days > 0 ? 'confirmSetup' : 'confirmPayment';

  return (
    <CheckoutLayout>
      <>
        <h1 className="mb-10 text-4xl">
          <Trans message="Checkout" />
        </h1>
        {billing?.stripe?.enable ? (
          <>
            <StripeElementsForm
              productId={productId}
              priceId={priceId}
              submitLabel={<Trans message="Upgrade" />}
              confirmType={formType}
              createType="subscription"
              hostingOrder={hostingOrder}
              premiumPurchase={premiumPurchase}
              returnUrl={withPremiumPurchaseReference(
                withHostingOrderReference(
                  withCheckoutReturnPath(
                    `${base_url}/checkout/${productId}/${priceId}/stripe/done`,
                    returnPath,
                  ),
                  hostingOrder,
                ),
                premiumPurchase,
              )}
            />
            <Separator />
          </>
        ) : null}
        <div ref={paypalElementRef} />
        <div className="mt-7.5 text-xs text-muted-foreground">
          <Trans message="You’ll be charged until you cancel your subscription. Previous charges won’t be refunded when you cancel unless it’s legally required. Your payment data is encrypted and secure. By subscribing your agree to our terms of service and privacy policy." />
        </div>
      </>
      <CheckoutProductSummary />
    </CheckoutLayout>
  );
}

function Separator() {
  return (
    <div className="relative my-5 text-center before:absolute before:top-1/2 before:left-0 before:h-px before:w-full before:-translate-y-1/2 before:bg-border">
      <span className="relative z-10 bg-background px-2.5 text-sm text-muted-foreground">
        <Trans message="or" />
      </span>
    </div>
  );
}
