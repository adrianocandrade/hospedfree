<?php

namespace Common\Billing\Gateways\Paypal;

use App\Hosting\Services\HostingCheckoutService;
use App\Hosting\Services\HostingPremiumSubdomainService;
use Common\Billing\Gateways\Paypal\Paypal;
use Common\API\ExcludeRoutesFromPublicDocs;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;

/**
 * @tags Paypal
 */
#[ExcludeRoutesFromPublicDocs]
class PaypalController extends Controller
{
    public function __construct(
        protected Paypal $paypal,
        protected HostingCheckoutService $hostingCheckout,
        protected HostingPremiumSubdomainService $premiumSubdomains,
    ) {
        $this->middleware('auth');
    }

    /**
     * Store subscription details locally.
     *
     * @operationId storePaypalSubscriptionDetailsLocally
     */
    public function storeSubscriptionDetailsLocally(Request $request)
    {
        $data = $request->validate([
            'paypal_subscription_id' => 'required|string',
        ]);

        $subscription = $this->paypal->subscriptions->sync(
            $data['paypal_subscription_id'],
            Auth::id(),
            $request->header('X-Hosting-Order'),
            $request->header('X-Premium-Subdomain-Purchase'),
        );

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

    /**
     * Register a remote PayPal attempt before the buyer approves it.
     *
     * @operationId registerPaypalHostingSubscriptionAttempt
     */
    public function registerHostingSubscriptionAttempt(Request $request)
    {
        $data = $request->validate([
            'paypal_subscription_id' => 'required|string|max:191',
            'hosting_order' => 'required|uuid',
        ]);

        $order = $this->paypal->subscriptions->validateHostingAttempt(
            $data['paypal_subscription_id'],
            $data['hosting_order'],
            (int) Auth::id(),
        );

        $this->hostingCheckout->recordAttempt(
            $order,
            'paypal',
            $data['paypal_subscription_id'],
        );

        return response()->noContent();
    }

    /**
     * Register a premium subdomain PayPal attempt before buyer approval.
     *
     * @operationId registerPaypalPremiumSubdomainSubscriptionAttempt
     */
    public function registerPremiumSubdomainSubscriptionAttempt(
        Request $request,
    ) {
        $data = $request->validate([
            'paypal_subscription_id' => 'required|string|max:191',
            'premium_purchase' => 'required|uuid',
        ]);

        $purchase = $this->paypal->subscriptions->validatePremiumSubdomainAttempt(
            $data['paypal_subscription_id'],
            $data['premium_purchase'],
            (int) Auth::id(),
        );

        $this->premiumSubdomains->registerGatewayAttempt(
            $purchase,
            'paypal',
            $data['paypal_subscription_id'],
        );

        return response()->noContent();
    }
}
