<?php

namespace Common\Billing\Gateways\Stripe;

use App\Hosting\Services\HostingCheckoutService;
use App\Hosting\Services\HostingPremiumSubdomainService;
use Illuminate\Support\Facades\Auth;
use Common\Billing\Checkout\CheckoutReference;
use Common\Billing\Models\Product;
use Common\Billing\Models\Price;
use Common\Billing\Subscription;
use Common\Billing\Gateways\Stripe\Stripe;
use Common\API\ExcludeRoutesFromPublicDocs;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;
use Stripe\Subscription as StripeSubscription;

/**
 * @tags Stripe
 */
#[ExcludeRoutesFromPublicDocs]
class StripeController extends Controller
{
    public function __construct(
        protected Stripe $stripe,
        protected HostingCheckoutService $hostingCheckout,
        protected HostingPremiumSubdomainService $premiumSubdomains,
    ) {
        $this->middleware('auth');
    }

    /**
     * Create a partial subscription.
     *
     * @operationId createPartialStripeSubscription
     */
    public function createPartialSubscription(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'price_id' => 'integer|exists:prices,id',
            'start_date' => 'string',
        ]);

        $product = Product::findOrFail($data['product_id']);
        $hostingOrderUuid = $request->header('X-Hosting-Order');
        $premiumPurchaseUuid = $request->header('X-Premium-Subdomain-Purchase');
        abort_if($hostingOrderUuid && $premiumPurchaseUuid, 422);
        $hostingOrder = null;
        $premiumPurchase = null;
        $checkoutReference = null;

        if ($hostingOrderUuid) {
            abort_unless(isset($data['price_id']), 422);
            $hostingOrder = $this->hostingCheckout->resolvePendingOrder(
                $hostingOrderUuid,
                (int) Auth::id(),
                $product->id,
                (int) $data['price_id'],
            );
            $checkoutReference = $this->hostingCheckout->referenceFor(
                $hostingOrder,
            );
        } elseif ($premiumPurchaseUuid) {
            abort_unless(isset($data['price_id']), 422);
            $premiumPurchase = $this->premiumSubdomains->resolvePendingPurchase(
                $premiumPurchaseUuid,
                (int) Auth::id(),
                $product->id,
                (int) $data['price_id'],
            );
            $checkoutReference = $this->premiumSubdomains->referenceForPurchase(
                $premiumPurchase,
            );
        }

        $result = $this->stripe->subscriptions->createPartial(
            $product,
            Auth::user(),
            $data['price_id'] ?? null,
            $checkoutReference,
        );

        if ($hostingOrder) {
            $this->hostingCheckout->recordAttempt(
                $hostingOrder,
                'stripe',
                $result['subscriptionId'],
            );
        }
        if ($premiumPurchase) {
            $this->premiumSubdomains->registerGatewayAttempt(
                $premiumPurchase,
                'stripe',
                $result['subscriptionId'],
            );
        }

        return response()->json([
            'clientSecret' => $result['clientSecret'],
            'subscriptionId' => $result['subscriptionId'],
        ]);
    }

    /**
     * Create a setup intent.
     *
     * @operationId createStripeSetupIntent
     */
    public function createSetupIntent()
    {
        $clientSecret = $this->stripe->createSetupIntent(Auth::user());
        return response()->json(['clientSecret' => $clientSecret]);
    }

    /**
     * Change the default payment method.
     *
     * @operationId changeDefaultstripePaymentMethod
     */
    public function changeDefaultPaymentMethod(Request $request)
    {
        $data = $request->validate([
            'payment_method_id' => 'required|string',
        ]);

        $this->stripe->changeDefaultPaymentMethod(
            Auth::user(),
            $data['payment_method_id'],
        );

        return response()->noContent();
    }

    /**
     * Store subscription details locally.
     *
     * @operationId storeStripeSubscriptionDetailsLocally
     */
    public function storeSubscriptionDetailsLocally(Request $request)
    {
        $data = $request->validate([
            'intent_type' => 'required|string|in:paymentIntent,setupIntent',
            'intent_id' => 'required|string',
            'subscription_id' => 'required_if:intent_type,setupIntent|string',
        ]);

        $user = Auth::user();

        if (!$user?->stripe_id) {
            throw ValidationException::withMessages([
                'intent_id' => __(
                    'This Stripe payment does not belong to your account.',
                ),
            ]);
        }

        if ($data['intent_type'] === 'paymentIntent') {
            $intent = $this->stripe->client->paymentIntents->retrieve(
                $data['intent_id'],
                ['expand' => ['invoice']],
            );
            $invoice = $intent->invoice;
            if (is_string($invoice)) {
                $invoice = $this->stripe->client->invoices->retrieve($invoice);
            }
            $subscriptionId = $this->stripeResourceId(
                $this->stripeResourceValue($invoice, 'subscription'),
            );

            if (
                $intent->status !== 'succeeded' ||
                $this->stripeResourceId($intent->customer) !==
                    $user->stripe_id ||
                !$invoice ||
                $this->stripeResourceId(
                    $this->stripeResourceValue($invoice, 'customer'),
                ) !== $user->stripe_id ||
                !$subscriptionId
            ) {
                throw ValidationException::withMessages([
                    'intent_id' => __(
                        'This Stripe payment could not be verified.',
                    ),
                ]);
            }

            $remoteSubscription = $this->stripe->client->subscriptions->retrieve(
                $subscriptionId,
            );

            if (
                $this->stripeResourceId($remoteSubscription->latest_invoice) !==
                $this->stripeResourceId($invoice)
            ) {
                throw ValidationException::withMessages([
                    'intent_id' => __(
                        'This Stripe payment does not match its subscription.',
                    ),
                ]);
            }
        } else {
            $intent = $this->stripe->client->setupIntents->retrieve(
                $data['intent_id'],
            );
            $remoteSubscription = $this->stripe->client->subscriptions->retrieve(
                $data['subscription_id'],
            );
            $subscriptionId = $remoteSubscription->id;

            if (
                $intent->status !== 'succeeded' ||
                $this->stripeResourceId($intent->customer) !==
                    $user->stripe_id ||
                $this->stripeResourceId(
                    $remoteSubscription->pending_setup_intent,
                ) !== $intent->id
            ) {
                throw ValidationException::withMessages([
                    'intent_id' => __(
                        'This Stripe setup intent could not be verified.',
                    ),
                ]);
            }
        }

        if (
            $this->stripeResourceId($remoteSubscription->customer) !==
            $user->stripe_id
        ) {
            throw ValidationException::withMessages([
                'subscription_id' => __(
                    'This Stripe subscription belongs to another account.',
                ),
            ]);
        }

        $this->assertRemoteSubscriptionMatchesHostingOrder(
            $remoteSubscription,
            $request->header('X-Hosting-Order'),
            (int) $user->id,
        );
        $this->assertRemoteSubscriptionMatchesPremiumPurchase(
            $remoteSubscription,
            $request->header('X-Premium-Subdomain-Purchase'),
            (int) $user->id,
        );

        $subscription = $this->stripe->subscriptions->sync($subscriptionId);

        if ($hostingOrderUuid = $request->header('X-Hosting-Order')) {
            $this->hostingCheckout->assertSubscriptionMatchesOrder(
                $subscription,
                $hostingOrderUuid,
                (int) Auth::id(),
            );
        }
        if (
            $premiumPurchaseUuid = $request->header(
                'X-Premium-Subdomain-Purchase',
            )
        ) {
            $this->premiumSubdomains->assertSubscriptionMatchesPurchase(
                $subscription,
                $premiumPurchaseUuid,
                (int) Auth::id(),
            );
        }

        return response()->noContent();
    }

    private function assertRemoteSubscriptionMatchesHostingOrder(
        StripeSubscription $remoteSubscription,
        ?string $expectedOrderUuid,
        int $userId,
    ): void {
        $reference = CheckoutReference::normalize(
            $remoteSubscription->metadata['checkout_reference'] ?? null,
        );
        $referencedOrderUuid = $this->hostingCheckout->orderUuidFromReference(
            $reference,
        );

        if ($expectedOrderUuid && $referencedOrderUuid !== $expectedOrderUuid) {
            throw ValidationException::withMessages([
                'hosting_order' => __(
                    'This payment does not belong to this hosting order.',
                ),
            ]);
        }

        $orderUuid = $expectedOrderUuid ?: $referencedOrderUuid;
        if (!$orderUuid) {
            return;
        }

        $localSubscription = Subscription::query()
            ->where('gateway_name', 'stripe')
            ->where('gateway_id', $remoteSubscription->id)
            ->first();

        if ($localSubscription) {
            $this->hostingCheckout->assertSubscriptionMatchesOrder(
                $localSubscription,
                $orderUuid,
                $userId,
            );

            return;
        }

        $stripePriceId = $remoteSubscription->items->data[0]->price->id ?? null;
        $price = Price::query()->where('stripe_id', $stripePriceId)->first();

        if (!$price) {
            throw ValidationException::withMessages([
                'subscription_id' => __(
                    'This Stripe subscription price is not available.',
                ),
            ]);
        }

        $this->hostingCheckout->resolvePendingOrder(
            $orderUuid,
            $userId,
            $price->product_id,
            $price->id,
        );
    }

    private function assertRemoteSubscriptionMatchesPremiumPurchase(
        StripeSubscription $remoteSubscription,
        ?string $expectedPurchaseUuid,
        int $userId,
    ): void {
        $reference = CheckoutReference::normalize(
            $remoteSubscription->metadata['checkout_reference'] ?? null,
        );
        $referencedPurchaseUuid = $this->premiumSubdomains->purchaseUuidFromReference(
            $reference,
        );

        if (
            $expectedPurchaseUuid &&
            $referencedPurchaseUuid !== $expectedPurchaseUuid
        ) {
            throw ValidationException::withMessages([
                'premium_purchase' => __(
                    'This payment does not belong to this premium address checkout.',
                ),
            ]);
        }

        $purchaseUuid = $expectedPurchaseUuid ?: $referencedPurchaseUuid;
        if (!$purchaseUuid) {
            return;
        }

        $localSubscription = Subscription::query()
            ->where('gateway_name', 'stripe')
            ->where('gateway_id', $remoteSubscription->id)
            ->first();
        if ($localSubscription) {
            $this->premiumSubdomains->assertSubscriptionMatchesPurchase(
                $localSubscription,
                $purchaseUuid,
                $userId,
            );
            return;
        }

        $stripePriceId = $remoteSubscription->items->data[0]->price->id ?? null;
        $price = Price::query()->where('stripe_id', $stripePriceId)->first();
        if (!$price) {
            throw ValidationException::withMessages([
                'subscription_id' => __(
                    'This Stripe subscription price is not available.',
                ),
            ]);
        }

        $this->premiumSubdomains->resolvePurchaseOwnerForPayment(
            $purchaseUuid,
            $price,
            $userId,
            null,
        );
    }

    private function stripeResourceId(mixed $resource): ?string
    {
        if (is_string($resource)) {
            return $resource;
        }

        if (is_object($resource) && isset($resource->id)) {
            return (string) $resource->id;
        }

        if (is_array($resource) && isset($resource['id'])) {
            return (string) $resource['id'];
        }

        return null;
    }

    private function stripeResourceValue(
        mixed $resource,
        string $attribute,
    ): mixed {
        if (is_object($resource)) {
            return $resource->{$attribute} ?? null;
        }

        if (is_array($resource)) {
            return $resource[$attribute] ?? null;
        }

        return null;
    }
}
