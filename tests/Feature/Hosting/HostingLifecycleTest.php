<?php

namespace Tests\Feature\Hosting;

use App\Hosting\Actions\CreateHostingOrder;
use App\Hosting\Console\ProcessHostingMaintenance;
use App\Hosting\Controllers\HostingAccountsController;
use App\Hosting\Controllers\AdminHostingController;
use App\Hosting\Controllers\AdminHostingPlansController;
use App\Hosting\Controllers\AdminPremiumSubdomainsController;
use App\Hosting\Controllers\HostingAccountInsightsController;
use App\Hosting\Controllers\HostingDomainsController;
use App\Hosting\Controllers\HostingFilesController;
use App\Hosting\Controllers\HostingDatabasesController;
use App\Hosting\Controllers\HostingOrdersController;
use App\Hosting\Contracts\HostingDomainProvider;
use App\Hosting\Contracts\HostingFileManagerProvider;
use App\Hosting\Contracts\HostingDatabaseProvider;
use App\Hosting\Contracts\HostingPanelProvider;
use App\Hosting\Contracts\HostingCertificateInstaller;
use App\Hosting\Contracts\HostingSslProvider;
use App\Hosting\Contracts\HostingSiteBuilderProvider;
use App\Hosting\Data\HostingDomainData;
use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Data\ProviderResponse;
use App\Hosting\Enums\HostingAccountStatus;
use App\Hosting\Enums\HostingOrderStatus;
use App\Hosting\Enums\HostingPlanType;
use App\Hosting\Enums\ProviderOperationType;
use App\Hosting\Enums\ProviderOperationStatus;
use App\Hosting\Jobs\CompleteHostingSslRenewal;
use App\Hosting\Jobs\ProvisionHostingOrder;
use App\Hosting\Jobs\RequestHostingSslRenewal;
use App\Hosting\Jobs\ReconcileHostingSslCertificate;
use App\Hosting\Jobs\RunHostingAccountOperation;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Models\HostingCheckoutAttempt;
use App\Hosting\Models\HostingOrder;
use App\Hosting\Models\HostingPlan;
use App\Hosting\Models\HostingPremiumSubdomain;
use App\Hosting\Models\HostingPremiumSubdomainPurchase;
use App\Hosting\Models\HostingProviderPackage;
use App\Hosting\Models\HostingSslCertificate;
use App\Hosting\Models\HostingZone;
use App\Hosting\Services\SafeToolUrl;
use App\Hosting\Services\HostingDnsVerificationService;
use App\Hosting\Services\HostingDomainService;
use App\Hosting\Services\HostingCheckoutAttemptReconciler;
use App\Hosting\Services\PendingHostingOrderService;
use App\Hosting\Services\HostingPremiumSubdomainService;
use App\Hosting\Services\HostingDomainSyncService;
use App\Hosting\Providers\SiteProHostingSiteBuilderProvider;
use App\Hosting\Resources\HostingAccountResource;
use App\Models\User;
use App\Support\Controllers\SupportTicketsController;
use App\Support\Models\SupportTicket;
use App\Support\Models\SupportTicketAttachment;
use App\Support\Models\SupportTicketMessage;
use App\Support\SupportNotificationRecipients;
use Common\Billing\Models\Price;
use Common\Billing\Models\Product;
use Common\Billing\Subscription;
use Common\Billing\Gateways\Paypal\PaypalSubscriptions;
use Common\Workspaces\Models\Workspace;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Http\UploadedFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Common\Auth\Middleware\VerifyApiAccessMiddleware;
use Common\Auth\Middleware\OptionalAuthenticate;
use Common\Auth\Middleware\RequireSessionAuthentication;
use Common\Auth\Middleware\RequireTokenAbility;
use Common\Core\Middleware\EnsureEmailIsVerified;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Tests\TestCase;

class HostingLifecycleTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        config()->set('queue.default', 'sync');
        config()->set('hospedfree.enabled', true);
        config()->set('hospedfree.paid_enabled', true);
        config()->set('hospedfree.provider.driver', 'fake');
        config()->set('hospedfree.order_payment_window_minutes', 30);
        $this->app['router']->aliasMiddleware(
            'optionalAuth',
            OptionalAuthenticate::class,
        );
        $this->app['router']->aliasMiddleware(
            'verifyApiAccess',
            VerifyApiAccessMiddleware::class,
        );
        $this->app['router']->aliasMiddleware(
            'token.ability',
            RequireTokenAbility::class,
        );
        $this->app['router']->aliasMiddleware(
            'verified',
            EnsureEmailIsVerified::class,
        );
        $this->app['router']->aliasMiddleware(
            'session.auth',
            RequireSessionAuthentication::class,
        );
        Notification::fake();
        $this->app->instance(
            SupportNotificationRecipients::class,
            new class extends SupportNotificationRecipients {
                public function all(): EloquentCollection
                {
                    return new EloquentCollection();
                }
            },
        );
        config()->set(
            'hospedfree.tools.control_panel_url',
            'https://panel.example.test',
        );
        DB::purge('sqlite');
        DB::reconnect('sqlite');

        $this->createSchema();
    }

    public function test_free_hosting_is_idempotent_and_limited_to_two_per_workspace(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $key = 'free-order-' . Str::random(24);

        $order = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $plan,
            $zone,
            'meu-site',
            $key,
        );

        $this->assertSame('fulfilled', $order->fresh()->status->value);
        $this->assertSame(
            HostingAccountStatus::Active,
            $order->account->fresh()->status,
        );
        $this->assertDatabaseCount('hosting_accounts', 1);
        $this->assertDatabaseCount('hosting_provider_operations', 1);
        $this->assertSame(1, $order->account->fresh()->free_slot);

        $same = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $plan,
            $zone,
            'meu-site',
            $key,
        );
        $this->assertSame($order->id, $same->id);
        $this->assertDatabaseCount('hosting_accounts', 1);

        try {
            app(CreateHostingOrder::class)->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'different-payload',
                $key,
            );
            $this->fail(
                'A reused idempotency key accepted a different payload.',
            );
        } catch (\Symfony\Component\HttpKernel\Exception\ConflictHttpException $exception) {
            $this->assertSame(409, $exception->getStatusCode());
            $this->assertStringContainsString(
                'idempotency key',
                strtolower($exception->getMessage()),
            );
        }

        $second = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $plan,
            $zone,
            'outro-site',
            'free-order-' . Str::random(24),
        );

        $this->assertSame(2, $second->account->fresh()->free_slot);
        $this->assertDatabaseCount('hosting_accounts', 2);

        $this->expectException(ValidationException::class);
        app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $plan,
            $zone,
            'terceiro-site',
            'free-order-' . Str::random(24),
        );
    }

    public function test_short_hosting_name_requires_an_active_premium_catalog_entry(): void
    {
        [$user, , , $zone] = $this->freeFixture();

        try {
            app(HostingPremiumSubdomainService::class)->inspect(
                $user,
                'abc',
                $zone,
            );
            $this->fail('An unlisted short name should not be available.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('subdomain', $exception->errors());
        }
    }

    public function test_complimentary_premium_name_is_linked_to_the_created_hosting(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $premium = HostingPremiumSubdomain::create([
            'hosting_zone_id' => $zone->id,
            'label' => 'vip',
            'assigned_user_id' => $user->id,
            'is_active' => true,
        ]);

        $order = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $plan,
            $zone,
            'vip',
            'premium-grant-' . Str::random(24),
        );

        $this->assertSame($premium->id, $order->premium_subdomain_id);
        $this->assertSame(
            $premium->id,
            $order->account->fresh()->premium_subdomain_id,
        );
    }

    public function test_gateway_attempt_extends_the_purchase_and_name_reservation_together(): void
    {
        [$user, , , $zone] = $this->freeFixture();
        $this->travelTo(now()->startOfSecond());
        config(['hospedfree.checkout_attempt_grace_minutes' => 75]);

        $product = Product::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Nome premium reservado',
            'description' => null,
            'feature_list' => [],
            'position' => 9,
            'recommended' => false,
            'free' => false,
            'hidden' => true,
            'trial_period_days' => 0,
        ]);
        $price = Price::create([
            'product_id' => $product->id,
            'amount' => 79,
            'currency' => 'BRL',
            'interval' => 'year',
            'interval_count' => 1,
            'default' => true,
            'active' => true,
            'paypal_id' => 'P-PREMIUM-RESERVATION',
        ]);
        $premium = HostingPremiumSubdomain::create([
            'hosting_zone_id' => $zone->id,
            'label' => 'go',
            'annual_price_id' => $price->id,
            'reserved_user_id' => $user->id,
            'reservation_expires_at' => now()->addMinutes(30),
            'is_active' => true,
        ]);
        $purchase = HostingPremiumSubdomainPurchase::create([
            'uuid' => (string) Str::uuid7(),
            'premium_subdomain_id' => $premium->id,
            'user_id' => $user->id,
            'price_id' => $price->id,
            'status' => 'pending',
            'expires_at' => now()->addMinutes(30),
        ]);

        settings()->set('billing.paypal.enable', true);
        settings()->set('billing.paypal_test_mode', true);
        config()->set('services.paypal.client_id', 'test-client');
        config()->set('services.paypal.secret', 'test-secret');
        Http::fake([
            'https://api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response(
                [
                    'access_token' => 'test-access-token',
                    'expires_in' => 3600,
                ],
            ),
            'https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-PREMIUM-ATTEMPT' => Http::response(
                [
                    'id' => 'I-PREMIUM-ATTEMPT',
                    'plan_id' => 'P-PREMIUM-RESERVATION',
                    'status' => 'APPROVAL_PENDING',
                    'custom_id' =>
                        'premium_subdomain_purchase:' . $purchase->uuid,
                ],
            ),
        ]);

        $validatedPurchase = app(
            PaypalSubscriptions::class,
        )->validatePremiumSubdomainAttempt(
            'I-PREMIUM-ATTEMPT',
            $purchase->uuid,
            $user->id,
        );

        app(HostingPremiumSubdomainService::class)->registerGatewayAttempt(
            $validatedPurchase,
            'paypal',
            'I-PREMIUM-ATTEMPT',
        );

        $expectedExpiry = now()->addMinutes(75);
        $this->assertTrue(
            $purchase->fresh()->expires_at->equalTo($expectedExpiry),
        );
        $this->assertTrue(
            $premium
                ->fresh()
                ->reservation_expires_at->equalTo($expectedExpiry),
        );
    }

    public function test_confirmed_annual_subscription_claims_a_reserved_premium_name(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $product = Product::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Nome premium anual',
            'description' => null,
            'feature_list' => [],
            'position' => 10,
            'recommended' => false,
            'free' => false,
            'hidden' => true,
            'trial_period_days' => 0,
        ]);
        $price = Price::create([
            'product_id' => $product->id,
            'amount' => 99,
            'currency' => 'BRL',
            'interval' => 'year',
            'interval_count' => 1,
            'default' => true,
            'active' => true,
        ]);
        $premium = HostingPremiumSubdomain::create([
            'hosting_zone_id' => $zone->id,
            'label' => 'pro',
            'annual_price_id' => $price->id,
            'reserved_user_id' => $user->id,
            'reservation_expires_at' => now()->addMinutes(30),
            'is_active' => true,
        ]);
        $purchase = HostingPremiumSubdomainPurchase::create([
            'uuid' => (string) Str::uuid7(),
            'premium_subdomain_id' => $premium->id,
            'user_id' => $user->id,
            'price_id' => $price->id,
            'status' => 'pending',
            'expires_at' => now()->addMinutes(30),
        ]);
        $reference = app(
            HostingPremiumSubdomainService::class,
        )->referenceForPurchase($purchase);
        $subscription = Subscription::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'price_id' => $price->id,
            'gateway_name' => 'none',
            'gateway_id' => 'premium-subscription-' . Str::random(12),
            'gateway_status' => 'active',
            'checkout_reference' => $reference,
            'quantity' => 1,
            'renews_at' => now()->addYear(),
        ]);

        $decision = app(HostingPremiumSubdomainService::class)->inspect(
            $user,
            'pro',
            $zone,
        );
        $claimed = app(HostingPremiumSubdomainService::class)->claimForUse(
            $user,
            'pro',
            $zone,
        );

        $this->assertTrue($decision['can_use']);
        $this->assertSame('subscription', $decision['entitlement']);
        $this->assertSame($subscription->id, $claimed?->subscription_id);
        $this->assertSame($user->id, $premium->fresh()->assigned_user_id);
        $this->assertNull($premium->fresh()->reserved_user_id);

        $order = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $plan,
            $zone,
            'pro',
            'premium-paid-' . Str::random(24),
        );
        $subscription
            ->forceFill([
                'ends_at' => now()->subMinute(),
                'renews_at' => null,
            ])
            ->save();

        $this->assertSame(
            HostingAccountStatus::ActionRequired,
            $order->account->fresh()->status,
        );
        $this->assertDatabaseHas('hosting_premium_subdomain_purchases', [
            'id' => $purchase->id,
            'status' => 'expired',
            'failure_code' => 'subscription_inactive',
        ]);
    }

    public function test_late_premium_payment_never_takes_a_name_reserved_by_another_customer(): void
    {
        [$buyer, , , $zone] = $this->freeFixture();
        $other = $this->user('other-premium@example.test');
        $product = Product::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Nome curto anual',
            'feature_list' => [],
            'position' => 11,
            'recommended' => false,
            'free' => false,
            'hidden' => true,
            'trial_period_days' => 0,
        ]);
        $price = Price::create([
            'product_id' => $product->id,
            'amount' => 149,
            'currency' => 'BRL',
            'interval' => 'year',
            'interval_count' => 1,
            'default' => true,
            'active' => true,
        ]);
        $premium = HostingPremiumSubdomain::create([
            'hosting_zone_id' => $zone->id,
            'label' => 'web',
            'annual_price_id' => $price->id,
            'reserved_user_id' => $other->id,
            'reservation_expires_at' => now()->addMinutes(30),
            'is_active' => true,
        ]);
        $purchase = HostingPremiumSubdomainPurchase::create([
            'uuid' => (string) Str::uuid7(),
            'premium_subdomain_id' => $premium->id,
            'user_id' => $buyer->id,
            'price_id' => $price->id,
            'status' => 'expired',
            'expires_at' => now()->subMinute(),
        ]);
        $reference = app(
            HostingPremiumSubdomainService::class,
        )->referenceForPurchase($purchase);

        $subscription = Subscription::create([
            'user_id' => $buyer->id,
            'product_id' => $product->id,
            'price_id' => $price->id,
            'gateway_name' => 'none',
            'gateway_id' => 'late-premium-' . Str::random(12),
            'gateway_status' => 'active',
            'checkout_reference' => $reference,
            'quantity' => 1,
            'renews_at' => now()->addYear(),
        ]);

        $this->assertDatabaseHas('hosting_premium_subdomain_purchases', [
            'id' => $purchase->id,
            'subscription_id' => $subscription->id,
            'status' => 'action_required',
            'failure_code' => 'address_no_longer_available',
        ]);
        $this->assertSame($other->id, $premium->fresh()->reserved_user_id);
        $this->assertNull($premium->fresh()->assigned_user_id);
    }

    public function test_admin_can_grant_a_premium_name_by_customer_email(): void
    {
        [$customer, , , $zone] = $this->freeFixture();
        $admin = $this->getMockBuilder(User::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['hasPermission'])
            ->getMock();
        $admin
            ->method('hasPermission')
            ->with('hosting.settings')
            ->willReturn(true);
        $request = Request::create('/testing', 'POST', [
            'hosting_zone_id' => $zone->id,
            'label' => 'fan',
            'annual_price_id' => null,
            'grant_user_email' => $customer->email,
            'complimentary_until' => now()->addYear()->toDateString(),
            'is_active' => true,
            'notes' => 'Concessão de influenciador',
        ]);
        $request->setUserResolver(fn() => $admin);

        $response = app(AdminPremiumSubdomainsController::class)->store(
            $request,
            app(HostingPremiumSubdomainService::class),
        );

        $this->assertSame(201, $response->getStatusCode());
        $this->assertDatabaseHas('hosting_premium_subdomains', [
            'hosting_zone_id' => $zone->id,
            'label' => 'fan',
            'assigned_user_id' => $customer->id,
            'is_active' => true,
        ]);
    }

    public function test_account_resource_identifies_its_hosting_product(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $plan->update([
            'quotas' => [
                'disk_mb' => 5120,
                'bandwidth_mb' => 50000,
                'domains' => 2,
                'databases' => 2,
                'ad_free' => true,
            ],
        ]);
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'billing-product',
                'free-order-' . Str::random(24),
            )
            ->account->fresh()
            ->load('plan.product');

        $payload = (new HostingAccountResource($account))
            ->response()
            ->getData(true)['data'];

        $this->assertSame($plan->id, $payload['plan']['id']);
        $this->assertSame($plan->product_id, $payload['plan']['product_id']);
        $this->assertSame(5120, $payload['plan']['quotas']['disk_mb']);
        $this->assertSame(50000, $payload['plan']['quotas']['bandwidth_mb']);
        $this->assertSame(2, $payload['plan']['quotas']['domains']);
        $this->assertSame(2, $payload['plan']['quotas']['databases']);
        $this->assertTrue($payload['plan']['quotas']['ad_free']);
        $this->assertArrayNotHasKey('subscription_id', $payload);
    }

    public function test_mofh_package_mapping_applies_known_contractual_quotas(): void
    {
        [$plan] = $this->paidPlan();
        $admin = new class extends User {
            public function hasPermission(string $name): bool
            {
                return $name === 'hosting.settings';
            }
        };

        app(AdminHostingPlansController::class)->providerPackage(
            $this->requestFor($admin, [
                'provider' => 'mofh',
                'remote_package' => 'pro',
                'is_active' => true,
            ]),
            $plan->id,
        );

        $quotas = $plan->refresh()->quotas;
        $this->assertSame(10240, $quotas['disk_mb']);
        $this->assertSame(150000, $quotas['bandwidth_mb']);
        $this->assertSame(5, $quotas['domains']);
        $this->assertSame(10, $quotas['databases']);
        $this->assertTrue($quotas['ad_free']);
    }

    public function test_customer_can_queue_an_idempotent_account_reconciliation(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'reconcile-customer',
                'reconcile-customer-order',
            )
            ->account->fresh();
        Queue::fake();
        $this->actingAs($user, 'sanctum');

        $response = app(HostingAccountsController::class)->reconcile(
            $this->requestFor($user),
            $account->id,
        );

        $this->assertSame(202, $response->getStatusCode());
        Queue::assertPushed(
            RunHostingAccountOperation::class,
            fn(RunHostingAccountOperation $job) => $job->accountId ===
                $account->id &&
                $job->type === ProviderOperationType::Reconcile &&
                $job->actorUserId === $user->id,
        );
    }

    public function test_maintenance_reconciles_a_recently_provisioned_account(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'reconcile-maintenance',
                'reconcile-maintenance-order',
            )
            ->account->fresh();
        $account
            ->forceFill([
                'status' => HostingAccountStatus::Provisioning,
                'desired_status' => HostingAccountStatus::Active,
                'last_synced_at' => now()->subMinutes(2),
            ])
            ->save();
        Queue::fake();

        $this->assertSame(0, app(ProcessHostingMaintenance::class)->handle());

        Queue::assertPushed(
            RunHostingAccountOperation::class,
            fn(RunHostingAccountOperation $job) => $job->accountId ===
                $account->id && $job->type === ProviderOperationType::Reconcile,
        );
    }

    public function test_credentials_are_hidden_and_other_users_cannot_resolve_the_account(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $order = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $plan,
            $zone,
            'seguro',
            'free-order-' . Str::random(24),
        );
        $account = $order->account->fresh();

        $serialized = $account->toArray();
        $this->assertArrayNotHasKey('credential_secret', $serialized);
        $this->assertArrayNotHasKey('provider_account_id', $serialized);

        $other = $this->user('outro@example.test');
        $request = $this->requestFor($other);

        $this->expectException(ModelNotFoundException::class);
        app(HostingAccountsController::class)->show($request, $account->id);
    }

    public function test_dashboard_insights_are_normalized_and_do_not_expose_provider_payloads(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'resumo',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $account->events()->create([
            'actor_user_id' => $user->id,
            'event' => 'tool.opened',
            'metadata' => [
                'tool' => 'control-panel',
                'raw_payload' => ['password' => 'never-return-this'],
                'access_token' => 'secret-token',
            ],
        ]);

        $this->actingAs($user, 'sanctum');
        $controller = app(HostingAccountInsightsController::class);

        $stats = $controller
            ->stats(
                $this->requestFor($user),
                $account->id,
                app(HostingPanelProvider::class),
            )
            ->getData(true)['data'];
        $activity = $controller
            ->activity($this->requestFor($user), $account->id)
            ->getData(true)['data'];
        $toolActivity = collect($activity)->firstWhere('event', 'tool.opened');

        $this->assertSame('available', $stats['availability']);
        $this->assertSame(
            ['disk', 'bandwidth', 'inodes', 'domains', 'databases'],
            array_keys($stats['metrics']),
        );
        $this->assertArrayNotHasKey('provider', $stats);
        $this->assertArrayNotHasKey('message', $stats);
        $this->assertNotNull($toolActivity);
        $this->assertSame('control-panel', $toolActivity['metadata']['tool']);
        $this->assertArrayNotHasKey('raw_payload', $toolActivity['metadata']);
        $this->assertArrayNotHasKey('access_token', $toolActivity['metadata']);
        $this->assertStringNotContainsString(
            'never-return-this',
            json_encode([$stats, $activity]),
        );
    }

    public function test_dashboard_insights_keep_contractual_plan_limits_when_usage_is_unavailable(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $plan->update([
            'quotas' => [
                'disk_mb' => 5120,
                'bandwidth_mb' => 50000,
                'domains' => 2,
                'databases' => 2,
                'ad_free' => true,
            ],
        ]);
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'limites',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $account
            ->forceFill([
                'provider_account_id' => null,
                'credential_secret' => null,
            ])
            ->save();

        $this->actingAs($user, 'sanctum');
        $stats = app(HostingAccountInsightsController::class)
            ->stats(
                $this->requestFor($user),
                $account->id,
                app(HostingPanelProvider::class),
            )
            ->getData(true)['data'];

        $this->assertSame('unavailable', $stats['availability']);
        $this->assertSame('account_not_ready', $stats['safe_code']);
        $this->assertNull($stats['metrics']['disk']['used']);
        $this->assertSame(
            5120 * 1024 * 1024,
            $stats['metrics']['disk']['limit'],
        );
        $this->assertSame(
            50000 * 1024 * 1024,
            $stats['metrics']['bandwidth']['limit'],
        );
        $this->assertSame(2, $stats['metrics']['domains']['limit']);
        $this->assertSame(2, $stats['metrics']['databases']['limit']);
    }

    public function test_dashboard_insights_cannot_be_read_by_another_customer(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'isolado',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $other = $this->user('intruso-insights@example.test');
        $this->actingAs($other, 'sanctum');

        $this->expectException(ModelNotFoundException::class);
        app(HostingAccountInsightsController::class)->stats(
            $this->requestFor($other),
            $account->id,
            app(HostingPanelProvider::class),
        );
    }

    public function test_hosting_domains_are_scoped_and_provider_payload_is_normalized(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'dominios',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $this->actingAs($user, 'sanctum');

        $payload = app(HostingDomainsController::class)
            ->index(
                $this->requestFor($user),
                $account->id,
                app(HostingDomainProvider::class),
            )
            ->getData(true);

        $this->assertSame('available', $payload['availability']);
        $this->assertSame($account->fqdn, $payload['data'][0]['domain']);
        $this->assertSame(
            ['domain', 'type', 'status', 'is_primary'],
            array_keys($payload['data'][0]),
        );

        $other = $this->user('intruso-domain@example.test');
        $this->expectException(ModelNotFoundException::class);
        app(HostingDomainsController::class)->index(
            $this->requestFor($other),
            $account->id,
            app(HostingDomainProvider::class),
        );
    }

    public function test_subdomain_changes_use_owned_account_credentials_and_reject_reserved_names(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'dominios-operacao',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $controller = app(HostingDomainsController::class);
        $provider = app(HostingDomainProvider::class);
        $this->actingAs($user, 'sanctum');

        $created = $controller->storeSubdomain(
            $this->requestFor($user, [
                'label' => 'blog',
                'zone' => 'hsite.top',
            ]),
            $account->id,
            $provider,
        );

        $this->assertSame(201, $created->getStatusCode());
        $this->assertSame(
            'blog.hsite.top',
            $created->getData(true)['data']['domain'],
        );
        $this->assertDatabaseHas('hosting_account_events', [
            'hosting_account_id' => $account->id,
            'event' => 'subdomain_created',
        ]);

        $deleted = $controller->destroy(
            $this->requestFor($user),
            $account->id,
            'blog.hsite.top',
            $provider,
        );
        $this->assertTrue($deleted->getData(true)['deleted']);

        $this->expectException(ValidationException::class);
        $controller->storeSubdomain(
            $this->requestFor($user, [
                'label' => 'admin',
                'zone' => 'hsite.top',
            ]),
            $account->id,
            $provider,
        );
    }

    public function test_subdomain_creation_reserves_the_configured_plan_quota_before_calling_the_provider(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'quota-dominios',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $provider = new RecordingHostingDomainProvider(
            ProviderResponse::ok(
                new HostingDomainData('blog.hsite.top', 'subdomain', 'active'),
            ),
        );
        $controller = app(HostingDomainsController::class);
        $this->actingAs($user, 'sanctum');

        $created = $controller->storeSubdomain(
            $this->requestFor($user, [
                'label' => 'blog',
                'zone' => 'hsite.top',
            ]),
            $account->id,
            $provider,
        );

        $this->assertSame(201, $created->getStatusCode());
        $this->assertSame(1, $provider->addSubdomainCalls);
        $this->assertDatabaseCount('hosting_domains', 2);

        try {
            $controller->storeSubdomain(
                $this->requestFor($user, [
                    'label' => 'loja',
                    'zone' => 'hsite.top',
                ]),
                $account->id,
                $provider,
            );
            $this->fail('The configured domain quota should be enforced.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('domain', $exception->errors());
        }

        $this->assertDatabaseMissing('hosting_domains', [
            'hosting_account_id' => $account->id,
            'domain' => 'loja.hsite.top',
        ]);
    }

    public function test_domain_mutations_are_serialized_per_account_and_remain_owner_scoped(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $plan->update([
            'quotas' => array_merge($plan->quotas, ['domains' => 3]),
        ]);
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'lock-dominios',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $provider = new RecordingHostingDomainProvider();
        $controller = app(HostingDomainsController::class);
        $this->actingAs($user, 'sanctum');
        $lock = Cache::lock("hosting:domain-change:{$account->id}", 60);
        $this->assertTrue($lock->get());

        try {
            $controller->storeSubdomain(
                $this->requestFor($user, [
                    'label' => 'concorrente',
                    'zone' => 'hsite.top',
                ]),
                $account->id,
                $provider,
            );
            $this->fail('A concurrent domain mutation should be rejected.');
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $exception) {
            $this->assertSame(409, $exception->getStatusCode());
        } finally {
            $lock->release();
        }

        $this->assertSame(0, $provider->addSubdomainCalls);

        $other = $this->user('intruso-domain-mutation@example.test');
        $this->actingAs($other, 'sanctum');

        $this->expectException(ModelNotFoundException::class);
        $controller->storeSubdomain(
            $this->requestFor($other, [
                'label' => 'intruso',
                'zone' => 'hsite.top',
            ]),
            $account->id,
            $provider,
        );
    }

    public function test_domain_reconciliation_stops_after_the_configured_attempt_limit(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'reconcile-domain-limit',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        config()->set('hospedfree.domains.max_reconcile_attempts', 2);
        $sync = app(HostingDomainSyncService::class);
        $domain = new HostingDomainData(
            'aguardando.example.com',
            'custom',
            'pending_verification',
        );

        $first = $sync->persist(
            $account,
            $domain,
            'pending',
            'dns_record_pending',
            restartReconciliation: true,
        );
        $this->assertSame(1, $first->reconcile_attempts);
        $this->assertNotNull($first->next_check_at);

        $final = $sync->persist(
            $account,
            $domain,
            'pending',
            'dns_record_pending',
        );
        $this->assertSame(2, $final->reconcile_attempts);
        $this->assertNull($final->next_check_at);
        $this->assertSame(
            'domain_reconciliation_limit_reached',
            $final->safe_code,
        );

        $active = $sync->persist(
            $account,
            new HostingDomainData('aguardando.example.com', 'custom', 'active'),
        );
        $this->assertSame(0, $active->reconcile_attempts);
        $this->assertNull($active->next_check_at);
        $this->assertSame('domain_active', $active->safe_code);
    }

    public function test_custom_domain_verification_returns_only_normalized_dns_instructions(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'dominio-proprio',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        config()->set('hospedfree.domains.cname_target', 'ns1.byet.org');
        $this->actingAs($user, 'sanctum');
        $dns = new HostingDnsVerificationService(
            fn(string $hostname, int $type) => [
                [
                    'host' => $hostname,
                    'type' => 'CNAME',
                    'target' => 'ns1.byet.org.',
                ],
            ],
        );

        $payload = app(HostingDomainsController::class)
            ->verify(
                $this->requestFor($user, ['domain' => 'example.com']),
                $account->id,
                app(HostingDomainProvider::class),
                $dns,
            )
            ->getData(true);

        $this->assertSame('pending_verification', $payload['data']['status']);
        $this->assertSame('verified', $payload['dns']['status']);
        $this->assertSame('add_in_control_panel', $payload['next_action']);
        $this->assertSame('CNAME', $payload['dns']['instructions'][0]['type']);
        $this->assertStringEndsWith(
            '.example.com',
            $payload['dns']['instructions'][0]['name'],
        );
        $this->assertSame(
            'ns1.byet.org',
            $payload['dns']['instructions'][0]['value'],
        );
        $this->assertStringNotContainsString(
            (string) $account->credential_secret,
            json_encode($payload, JSON_THROW_ON_ERROR),
        );
    }

    public function test_file_operations_are_scoped_and_reject_path_traversal(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'arquivos',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $controller = app(HostingFilesController::class);
        $provider = app(HostingFileManagerProvider::class);
        $this->actingAs($user, 'sanctum');

        $created = $controller->store(
            $this->requestFor($user, [
                'type' => 'file',
                'directory' => 'htdocs',
                'name' => 'index.php',
                'content' => '<?php echo 1;',
            ]),
            $account->id,
            $provider,
        );
        $this->assertSame(201, $created->getStatusCode());
        $this->assertSame('htdocs/index.php', $created->getData(true)['path']);

        $uploadRequest = $this->requestFor($user, ['directory' => 'htdocs']);
        $uploadRequest->files->set(
            'file',
            UploadedFile::fake()->createWithContent('sobre.txt', 'HospedFree'),
        );
        $uploaded = $controller->upload(
            $uploadRequest,
            $account->id,
            $provider,
        );
        $this->assertSame(201, $uploaded->getStatusCode());
        $this->assertSame('htdocs/sobre.txt', $uploaded->getData(true)['path']);

        $downloaded = $controller->download(
            $this->requestFor($user, ['path' => 'htdocs/sobre.txt']),
            $account->id,
            $provider,
        );
        $this->assertSame(200, $downloaded->getStatusCode());
        $this->assertStringContainsString(
            'sobre.txt',
            (string) $downloaded->headers->get('Content-Disposition'),
        );
        $this->assertSame(
            'nosniff',
            $downloaded->headers->get('X-Content-Type-Options'),
        );

        $archived = $controller->update(
            $this->requestFor($user, [
                'path' => 'htdocs/index.php',
                'operation' => 'archive',
                'destination' => 'htdocs/index.zip',
            ]),
            $account->id,
            $provider,
        );
        $extracted = $controller->update(
            $this->requestFor($user, [
                'path' => 'htdocs/index.zip',
                'operation' => 'extract',
                'destination' => 'htdocs/restored',
            ]),
            $account->id,
            $provider,
        );
        $this->assertTrue($archived->getData(true)['updated']);
        $this->assertTrue($extracted->getData(true)['updated']);
        $this->assertDatabaseHas('hosting_account_events', [
            'hosting_account_id' => $account->id,
            'event' => 'file_archived',
        ]);
        $this->assertDatabaseHas('hosting_account_events', [
            'hosting_account_id' => $account->id,
            'event' => 'file_extracted',
        ]);

        $other = $this->user('intruso-files@example.test');
        try {
            $controller->index(
                $this->requestFor($other),
                $account->id,
                $provider,
            );
            $this->fail('Another customer resolved the hosting files.');
        } catch (ModelNotFoundException) {
            $this->assertTrue(true);
        }

        $this->expectException(ValidationException::class);
        $controller->show(
            $this->requestFor($user, ['path' => 'htdocs/../../secret']),
            $account->id,
            $provider,
        );
    }

    public function test_database_operations_are_scoped_and_validate_names(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'database',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $account->update(['sql_host' => 'sql.example.test']);
        $controller = app(HostingDatabasesController::class);
        $provider = app(HostingDatabaseProvider::class);
        $this->actingAs($user, 'sanctum');

        $created = $controller->store(
            $this->requestFor($user, ['name' => 'wordpress']),
            $account->id,
            $provider,
        );

        $this->assertSame(201, $created->getStatusCode());
        $this->assertSame('wordpress', $created->getData(true)['data']['name']);
        $this->assertSame(
            'sql.example.test',
            $created->getData(true)['data']['host'],
        );

        $other = $this->user('intruso-databases@example.test');
        try {
            $controller->index(
                $this->requestFor($other),
                $account->id,
                $provider,
            );
            $this->fail('Another customer resolved the hosting databases.');
        } catch (ModelNotFoundException) {
            $this->assertTrue(true);
        }

        $this->expectException(ValidationException::class);
        $controller->store(
            $this->requestFor($user, ['name' => '../secret']),
            $account->id,
            $provider,
        );
    }

    public function test_database_creation_has_an_isolated_rate_limit_bucket(): void
    {
        $user = $this->user('database-rate-limit@example.test');
        $databaseRoute = collect(Route::getRoutes()->getRoutes())->first(
            fn($route) => $route->uri() ===
                'api/v1/hosting/accounts/{account}/databases' &&
                in_array('POST', $route->methods(), true),
        );
        $databaseThrottle = collect($databaseRoute->gatherMiddleware())->first(
            fn(string $middleware) => str_starts_with($middleware, 'throttle:'),
        );

        Route::get(
            '/_testing/hosting/dashboard-read',
            fn() => response()->noContent(),
        )->middleware('throttle:30,1');
        Route::post(
            '/_testing/hosting/database-create',
            fn() => response()->json([], 201),
        )->middleware($databaseThrottle);
        $this->actingAs($user);

        // Regular dashboard reads must not consume the mutation budget.
        foreach (range(1, 6) as $_) {
            $this->getJson(
                '/_testing/hosting/dashboard-read',
            )->assertNoContent();
        }

        $this->postJson('/_testing/hosting/database-create')->assertCreated();
    }

    public function test_customer_api_token_cannot_access_another_customers_hosting_or_ticket(): void
    {
        [$owner, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $owner,
                $workspace,
                $plan,
                $zone,
                'isolado',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $ticket = SupportTicket::query()->create([
            'uuid' => (string) Str::uuid7(),
            'workspace_id' => $workspace->id,
            'user_id' => $owner->id,
            'hosting_account_id' => $account->id,
            'subject' => 'Chamado privado',
            'type' => 'ticket',
            'department' => 'technical',
            'status' => 'open',
            'priority' => 'normal',
            'last_message_at' => now(),
        ]);
        $message = SupportTicketMessage::query()->create([
            'support_ticket_id' => $ticket->id,
            'user_id' => $owner->id,
            'author_type' => 'customer',
            'body' => 'Conteúdo privado do chamado.',
            'is_internal' => false,
        ]);
        $attachment = SupportTicketAttachment::query()->create([
            'support_ticket_message_id' => $message->id,
            'user_id' => $owner->id,
            'disk' => 'local',
            'path' => 'support/private.txt',
            'file_name' => 'private.txt',
            'mime_type' => 'text/plain',
            'size' => 7,
        ]);
        $certificate = HostingSslCertificate::query()->create([
            'hosting_account_id' => $account->id,
            'workspace_id' => $workspace->id,
            'user_id' => $owner->id,
            'domain' => $account->fqdn,
            'provider' => 'fake',
            'status' => 'action_required',
            'remote_order_id' => 'private-order',
        ]);
        $eventCount = $account->events()->count();
        $operationCount = $account->operations()->count();
        $intruder = $this->user('intruso-token@example.test');
        $token = $intruder->createToken('idor-matrix', [
            'hosting:read',
            'hosting:write',
            'hosting:domains',
            'hosting:files',
            'hosting:databases',
            'hosting:ssl',
            'hosting:tools',
            'support:read',
            'support:write',
        ])->plainTextToken;

        $this->withoutMiddleware(VerifyApiAccessMiddleware::class);
        $this->withoutMiddleware(ThrottleRequests::class);
        $this->withToken($token);

        $readRoutes = [
            "/api/v1/hosting/accounts/{$account->id}",
            "/api/v1/hosting/accounts/{$account->id}/stats",
            "/api/v1/hosting/accounts/{$account->id}/activity",
            "/api/v1/hosting/accounts/{$account->id}/tools",
            "/api/v1/hosting/accounts/{$account->id}/domains",
            "/api/v1/hosting/accounts/{$account->id}/files",
            "/api/v1/hosting/accounts/{$account->id}/files/content?path=index.html",
            "/api/v1/hosting/accounts/{$account->id}/files/download?path=index.html",
            "/api/v1/hosting/accounts/{$account->id}/databases",
            "/api/v1/hosting/accounts/{$account->id}/ssl",
            "/api/v1/support/tickets/{$ticket->id}",
            "/api/v1/support/tickets/{$ticket->id}/attachments/{$attachment->id}",
        ];

        foreach ($readRoutes as $route) {
            $this->getJson($route)->assertNotFound();
        }

        $this->postJson(
            "/api/v1/hosting/accounts/{$account->id}/reconcile",
        )->assertNotFound();
        $this->postJson(
            "/api/v1/hosting/accounts/{$account->id}/domains/verify",
            ['domain' => $account->fqdn],
        )->assertNotFound();
        $this->postJson(
            "/api/v1/hosting/accounts/{$account->id}/domains/subdomains",
            ['label' => 'intruso', 'zone' => 'hsite.top'],
        )->assertNotFound();
        $this->deleteJson(
            "/api/v1/hosting/accounts/{$account->id}/domains/intruso.hsite.top",
        )->assertNotFound();
        $this->postJson("/api/v1/hosting/accounts/{$account->id}/files", [
            'type' => 'file',
            'name' => 'intruso.txt',
        ])->assertNotFound();
        $this->postJson(
            "/api/v1/hosting/accounts/{$account->id}/files/upload",
        )->assertNotFound();
        $this->putJson("/api/v1/hosting/accounts/{$account->id}/files", [
            'path' => 'index.html',
            'operation' => 'write',
            'content' => 'x',
        ])->assertNotFound();
        $this->deleteJson("/api/v1/hosting/accounts/{$account->id}/files", [
            'path' => 'index.html',
        ])->assertNotFound();
        $this->postJson("/api/v1/hosting/accounts/{$account->id}/databases", [
            'name' => 'intruso',
        ])->assertNotFound();
        $this->postJson(
            "/api/v1/hosting/accounts/{$account->id}/tools/control-panel",
        )->assertNotFound();
        $this->postJson(
            "/api/v1/hosting/accounts/{$account->id}/ssl/{$certificate->id}/verify",
        )->assertNotFound();
        $this->postJson("/api/v1/support/tickets/{$ticket->id}/messages", [
            'message' => 'Tentativa de acesso indevido',
        ])->assertNotFound();
        $this->postJson(
            "/api/v1/support/tickets/{$ticket->id}/close",
        )->assertNotFound();

        $this->getJson('/api/v1/hosting/accounts')
            ->assertOk()
            ->assertJsonMissing(['id' => $account->id]);
        $this->getJson('/api/v1/support/tickets')
            ->assertOk()
            ->assertJsonMissing(['id' => $ticket->id]);
        $this->postJson('/api/v1/support/tickets', [
            'subject' => 'Tentativa de vínculo indevido',
            'message' => 'Não deve vincular uma hospedagem de outro cliente.',
            'hosting_account_id' => $account->id,
        ])->assertNotFound();

        $this->assertSame($eventCount, $account->events()->count());
        $this->assertSame($operationCount, $account->operations()->count());
    }

    public function test_browser_customer_cannot_use_sensitive_actions_on_another_account(): void
    {
        [$owner, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $owner,
                $workspace,
                $plan,
                $zone,
                'browser-owner',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $certificate = HostingSslCertificate::query()->create([
            'hosting_account_id' => $account->id,
            'workspace_id' => $workspace->id,
            'user_id' => $owner->id,
            'domain' => $account->fqdn,
            'provider' => 'fake',
            'status' => 'action_required',
            'remote_order_id' => 'browser-private-order',
        ]);
        $eventCount = $account->events()->count();
        $operationCount = $account->operations()->count();
        $intruder = $this->user('intruso-browser@example.test');

        $this->withoutMiddleware(VerifyApiAccessMiddleware::class);
        $this->withoutMiddleware(ThrottleRequests::class);
        $this->withoutMiddleware(RequirePassword::class);
        $this->actingAs($intruder);

        $this->postJson(
            "/api/v1/hosting/accounts/{$account->id}/credentials/reveal",
        )->assertNotFound();
        $this->postJson(
            "/api/v1/hosting/accounts/{$account->id}/password-reset",
        )->assertNotFound();
        $this->postJson(
            "/api/v1/hosting/accounts/{$account->id}/suspend",
        )->assertNotFound();
        $this->postJson(
            "/api/v1/hosting/accounts/{$account->id}/reactivate",
        )->assertNotFound();
        $this->postJson("/api/v1/hosting/accounts/{$account->id}/plan", [
            'hosting_plan_id' => $plan->id,
        ])->assertNotFound();
        $this->postJson("/api/v1/hosting/accounts/{$account->id}/ssl", [
            'domain' => $account->fqdn,
        ])->assertNotFound();
        $this->deleteJson(
            "/api/v1/hosting/accounts/{$account->id}/ssl/{$certificate->id}",
        )->assertNotFound();
        $this->deleteJson(
            "/api/v1/hosting/accounts/{$account->id}",
        )->assertNotFound();
        $this->postJson(
            "/api/v1/hosting/accounts/{$account->id}/deletion/cancel",
        )->assertNotFound();

        $this->assertSame($eventCount, $account->events()->count());
        $this->assertSame($operationCount, $account->operations()->count());
    }

    public function test_account_lifecycle_rate_limit_returns_a_clear_message(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'limited-actions',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();

        $this->withoutMiddleware(RequirePassword::class);
        $this->withoutMiddleware(VerifyApiAccessMiddleware::class);
        $this->actingAs($user);

        foreach (range(1, 6) as $attempt) {
            $this->postJson(
                "/api/v1/hosting/accounts/{$account->id}/suspend",
            )->assertSuccessful();
        }

        $this->postJson("/api/v1/hosting/accounts/{$account->id}/suspend")
            ->assertTooManyRequests()
            ->assertJsonPath(
                'message',
                'Wait a moment before trying another hosting account action.',
            );
    }

    public function test_suspended_account_requires_confirmation_and_is_deleted_once(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'removivel',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $controller = app(HostingAccountsController::class);
        $request = $this->requestFor($user, [
            'confirmation' => "EXCLUIR {$account->fqdn}",
        ]);
        $this->actingAs($user, 'sanctum');

        try {
            $controller->destroy($request, $account->id);
            $this->fail(
                'An active provider account was accepted for deletion.',
            );
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $exception) {
            $this->assertSame(409, $exception->getStatusCode());
        }

        $controller->suspend($request, $account->id);
        $this->assertSame(
            HostingAccountStatus::Suspended,
            $account->fresh()->status,
        );

        try {
            $controller->destroy(
                $this->requestFor($user, ['confirmation' => 'EXCLUIR errado']),
                $account->id,
            );
            $this->fail('An invalid deletion confirmation was accepted.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('confirmation', $exception->errors());
        }

        $response = $controller->destroy($request, $account->id);
        $this->assertSame(202, $response->getStatusCode());

        $account->refresh();
        $this->assertSame(HostingAccountStatus::Deleted, $account->status);
        $this->assertNull($account->credential_secret);
        $this->assertNull($account->free_slot);
        $this->assertNull($account->deletes_at);
        $this->assertSame(
            1,
            $account->operations()->where('operation', 'delete')->count(),
        );
        $this->assertSame(
            1,
            $account->operations()->where('operation', 'suspend')->count(),
        );
    }

    public function test_legacy_due_deletion_suspends_the_remote_account_before_removal(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'legacy-removal',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();

        $account
            ->forceFill([
                'deletion_requested_at' => now()->subDays(8),
                'deletes_at' => now()->subMinute(),
                'desired_status' => HostingAccountStatus::Deleted,
            ])
            ->save();
        $account->transitionTo(
            HostingAccountStatus::PendingDeletion,
            safeMessage: 'Legacy deletion scheduled without a prior suspension.',
        );

        $this->assertSame(0, app(ProcessHostingMaintenance::class)->handle());
        $account->refresh();
        $this->assertSame(
            HostingAccountStatus::PendingDeletion,
            $account->status,
        );
        $this->assertNotNull($account->suspended_at);
        $this->assertSame(
            1,
            $account->operations()->where('operation', 'suspend')->count(),
        );
        $this->assertSame(
            0,
            $account->operations()->where('operation', 'delete')->count(),
        );

        $this->assertSame(0, app(ProcessHostingMaintenance::class)->handle());
        $this->assertSame(
            HostingAccountStatus::Deleted,
            $account->fresh()->status,
        );
        $this->assertSame(
            1,
            $account->operations()->where('operation', 'delete')->count(),
        );
    }

    public function test_paid_upgrade_and_ended_subscription_downgrade_the_same_account(): void
    {
        [$user, $workspace, $freePlan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $freePlan,
                $zone,
                'upgrade',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        [$paidPlan, $price] = $this->paidPlan();
        $subscription = Subscription::create([
            'user_id' => $user->id,
            'product_id' => $paidPlan->product_id,
            'price_id' => $price->id,
            'gateway_name' => 'none',
            'gateway_id' => 'local-' . Str::uuid(),
            'gateway_status' => 'active',
            'renews_at' => now()->addMonth(),
            'quantity' => 1,
        ]);

        $request = $this->requestFor($user, [
            'hosting_plan_id' => $paidPlan->id,
            'price_id' => $price->id,
            'subscription_id' => $subscription->id,
        ]);
        $this->actingAs($user, 'sanctum');
        app(HostingAccountsController::class)->changePlan(
            $request,
            $account->id,
        );
        $account->refresh();
        $this->assertSame($paidPlan->id, $account->hosting_plan_id);
        $this->assertSame($subscription->id, $account->subscription_id);
        $this->assertNull($account->free_slot);

        $subscription
            ->forceFill(['ends_at' => now()->subMinute(), 'renews_at' => null])
            ->save();
        $account->refresh();
        $this->assertSame($freePlan->id, $account->hosting_plan_id);
        $this->assertSame(1, $account->free_slot);
        $this->assertNull($account->subscription_id);
        $this->assertSame(HostingAccountStatus::Active, $account->status);
    }

    public function test_existing_free_account_does_not_block_an_additional_paid_order(): void
    {
        [$user, $workspace, $freePlan, $zone] = $this->freeFixture();
        app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $freePlan,
            $zone,
            'free-primary',
            'free-primary-order-' . Str::random(20),
        );
        [$paidPlan, $price] = $this->paidPlan();
        $price->forceFill(['stripe_id' => 'price_hosting_pro'])->save();
        settings()->set('billing.stripe.enable', true);
        Queue::fake();

        $order = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $paidPlan,
            $zone,
            'paid-additional',
            'paid-additional-order-' . Str::random(20),
            $price,
        );

        $this->assertSame(HostingOrderStatus::AwaitingPayment, $order->status);
        $this->assertNull($order->account);
        $this->assertDatabaseCount('hosting_accounts', 1);
        Queue::assertNotPushed(ProvisionHostingOrder::class);
    }

    public function test_confirmed_subscription_fulfils_pending_paid_order_once(): void
    {
        [$user, $workspace, $freePlan, $zone] = $this->freeFixture();
        app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $freePlan,
            $zone,
            'free-before-paid',
            'free-before-paid-order-' . Str::random(20),
        );
        [$paidPlan, $price] = $this->paidPlan();
        $price->forceFill(['stripe_id' => 'price_hosting_pro'])->save();
        settings()->set('billing.stripe.enable', true);
        Queue::fake();

        $order = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $paidPlan,
            $zone,
            'paid-confirmed',
            'paid-confirmed-order-' . Str::random(20),
            $price,
        );
        $subscription = Subscription::create([
            'user_id' => $user->id,
            'product_id' => $paidPlan->product_id,
            'price_id' => $price->id,
            'gateway_name' => 'none',
            'gateway_id' => 'paid-' . Str::uuid(),
            'gateway_status' => 'active',
            'checkout_reference' => 'hosting_order:' . $order->uuid,
            'renews_at' => now()->addMonth(),
            'quantity' => 1,
        ]);

        $order->refresh();
        $account = $order->account()->firstOrFail();
        $this->assertSame(HostingOrderStatus::Paid, $order->status);
        $this->assertSame($subscription->id, $order->subscription_id);
        $this->assertSame($subscription->id, $account->subscription_id);
        $this->assertSame($paidPlan->id, $account->hosting_plan_id);
        $this->assertNull($account->free_slot);
        $this->assertDatabaseCount('hosting_accounts', 2);
        Queue::assertPushed(
            ProvisionHostingOrder::class,
            fn(ProvisionHostingOrder $job) => $job->orderId === $order->id,
        );

        $subscription->touch();
        $this->assertSame(1, $order->account()->count());
        Queue::assertPushed(ProvisionHostingOrder::class, 1);
    }

    public function test_confirmed_subscription_fulfils_only_its_exact_hosting_order(): void
    {
        [$user, $workspace, , $zone] = $this->freeFixture();
        [$paidPlan, $price] = $this->paidPlan();
        $paidPlan->forceFill(['max_accounts_per_workspace' => 2])->save();
        $price->forceFill(['stripe_id' => 'price_exact_order'])->save();
        settings()->set('billing.stripe.enable', true);
        Queue::fake();

        $first = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $paidPlan,
            $zone,
            'paid-first',
            'paid-first-order-' . Str::random(20),
            $price,
        );
        $second = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $paidPlan,
            $zone,
            'paid-second',
            'paid-second-order-' . Str::random(20),
            $price,
        );

        $subscription = Subscription::create([
            'user_id' => $user->id,
            'product_id' => $paidPlan->product_id,
            'price_id' => $price->id,
            'gateway_name' => 'stripe',
            'gateway_id' => 'sub_' . Str::random(24),
            'gateway_status' => 'active',
            'checkout_reference' => 'hosting_order:' . $second->uuid,
            'renews_at' => now()->addMonth(),
            'quantity' => 1,
        ]);

        $this->assertSame(
            HostingOrderStatus::AwaitingPayment,
            $first->fresh()->status,
        );
        $this->assertNull($first->account()->first());
        $this->assertSame(HostingOrderStatus::Paid, $second->fresh()->status);
        $this->assertSame(
            $subscription->id,
            $second->account()->firstOrFail()->subscription_id,
        );
        $this->assertDatabaseCount('hosting_accounts', 1);
    }

    public function test_pending_remote_attempt_prevents_expiration_and_can_complete_safely(): void
    {
        [$user, $workspace, , $zone] = $this->freeFixture();
        [$paidPlan, $price] = $this->paidPlan();
        $price->forceFill(['stripe_id' => 'price_pending_attempt'])->save();
        settings()->set('billing.stripe.enable', true);
        Queue::fake();

        $order = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $paidPlan,
            $zone,
            'pending-attempt',
            'pending-attempt-order-' . Str::random(20),
            $price,
        );
        $gatewayId = 'sub_' . Str::random(24);
        HostingCheckoutAttempt::create([
            'hosting_order_id' => $order->id,
            'user_id' => $user->id,
            'gateway' => 'stripe',
            'gateway_subscription_id' => $gatewayId,
            'status' => 'pending',
        ]);
        $order->forceFill(['expires_at' => now()->subMinute()])->save();

        $pendingOrders = app(PendingHostingOrderService::class);
        $this->assertSame(0, $pendingOrders->expireDue());
        $this->assertSame(
            'pending-attempt.hsite.top',
            $order->fresh()->domain_reservation_key,
        );

        try {
            $pendingOrders->cancel($order);
            $this->fail(
                'An order with a remote payment attempt was cancelled.',
            );
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('order', $exception->errors());
        }

        $subscription = Subscription::create([
            'user_id' => $user->id,
            'product_id' => $paidPlan->product_id,
            'price_id' => $price->id,
            'gateway_name' => 'stripe',
            'gateway_id' => $gatewayId,
            'gateway_status' => 'active',
            'checkout_reference' => 'hosting_order:' . $order->uuid,
            'renews_at' => now()->addMonth(),
            'quantity' => 1,
        ]);

        $this->assertSame(HostingOrderStatus::Paid, $order->fresh()->status);
        $this->assertSame(
            $subscription->id,
            $order->account()->firstOrFail()->subscription_id,
        );
        $this->assertDatabaseHas('hosting_checkout_attempts', [
            'hosting_order_id' => $order->id,
            'subscription_id' => $subscription->id,
            'status' => 'fulfilled',
        ]);
    }

    public function test_paypal_hosting_reference_is_validated_before_local_persistence(): void
    {
        [$owner, $workspace, , $zone] = $this->freeFixture();
        [$paidPlan, $price] = $this->paidPlan();
        $price->forceFill(['paypal_id' => 'P-HOSTING-PRO'])->save();
        settings()->set('billing.stripe.enable', false);
        settings()->set('billing.paypal.enable', true);
        settings()->set('billing.paypal_test_mode', true);

        $order = app(CreateHostingOrder::class)->execute(
            $owner,
            $workspace,
            $paidPlan,
            $zone,
            'paypal-owner',
            'paypal-owner-order-' . Str::random(20),
            $price,
        );
        $attacker = $this->user('attacker@example.test');

        config()->set('services.paypal.client_id', 'test-client');
        config()->set('services.paypal.secret', 'test-secret');
        Http::fake([
            'https://api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response(
                [
                    'access_token' => 'test-access-token',
                    'expires_in' => 3600,
                ],
            ),
            'https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-HOSTING' => Http::response(
                [
                    'id' => 'I-HOSTING',
                    'plan_id' => 'P-HOSTING-PRO',
                    'status' => 'ACTIVE',
                    'custom_id' => 'hosting_order:' . $order->uuid,
                    'subscriber' => [
                        'payer_id' => 'PAYER-ATTACKER',
                        'email_address' => $attacker->email,
                    ],
                ],
            ),
        ]);

        try {
            app(PaypalSubscriptions::class)->sync(
                'I-HOSTING',
                $attacker->id,
                $order->uuid,
            );
            $this->fail(
                'A PayPal subscription was persisted for the wrong user.',
            );
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('hosting_order', $exception->errors());
        }

        $this->assertDatabaseCount('subscriptions', 0);
        $this->assertNull($attacker->fresh()->paypal_id);
        $this->assertSame(
            HostingOrderStatus::AwaitingPayment,
            $order->fresh()->status,
        );
    }

    public function test_terminal_remote_attempt_is_verified_before_domain_is_released(): void
    {
        [$user, $workspace, , $zone] = $this->freeFixture();
        [$paidPlan, $price] = $this->paidPlan();
        $price->forceFill(['paypal_id' => 'P-EXPIRED-HOSTING'])->save();
        settings()->set('billing.paypal.enable', true);
        settings()->set('billing.paypal_test_mode', true);

        $order = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $paidPlan,
            $zone,
            'expired-remote-attempt',
            'expired-remote-attempt-' . Str::random(20),
            $price,
        );
        $order->forceFill(['expires_at' => now()->subMinutes(5)])->save();

        $attempt = HostingCheckoutAttempt::create([
            'hosting_order_id' => $order->id,
            'user_id' => $user->id,
            'gateway' => 'paypal',
            'gateway_subscription_id' => 'I-EXPIRED-HOSTING',
            'status' => 'pending',
            'expires_at' => now()->subMinute(),
        ]);

        config()->set('services.paypal.client_id', 'test-client');
        config()->set('services.paypal.secret', 'test-secret');
        Http::fake([
            'https://api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response(
                [
                    'access_token' => 'test-access-token',
                    'expires_in' => 3600,
                ],
            ),
            'https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-EXPIRED-HOSTING' => Http::response(
                [
                    'id' => 'I-EXPIRED-HOSTING',
                    'plan_id' => 'P-EXPIRED-HOSTING',
                    'status' => 'CANCELLED',
                    'custom_id' => 'hosting_order:' . $order->uuid,
                ],
            ),
        ]);

        $this->assertTrue(
            app(HostingCheckoutAttemptReconciler::class)->reconcileOne(
                $attempt->id,
            ),
        );
        $this->assertSame('failed', $attempt->fresh()->status);
        $this->assertSame('remote_cancelled', $attempt->fresh()->failure_code);
        $this->assertSame(
            HostingOrderStatus::Cancelled,
            $order->fresh()->status,
        );
        $this->assertNull($order->fresh()->domain_reservation_key);
    }

    public function test_unverifiable_remote_attempt_preserves_domain_for_billing_review(): void
    {
        [$user, $workspace, , $zone] = $this->freeFixture();
        [$paidPlan, $price] = $this->paidPlan();
        $price->forceFill(['paypal_id' => 'P-UNVERIFIABLE-HOSTING'])->save();
        settings()->set('billing.paypal.enable', true);
        settings()->set('billing.paypal_test_mode', true);

        $order = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $paidPlan,
            $zone,
            'unverifiable-remote-attempt',
            'unverifiable-remote-attempt-' . Str::random(20),
            $price,
        );
        $order->forceFill(['expires_at' => now()->subMinutes(5)])->save();

        $attempt = HostingCheckoutAttempt::create([
            'hosting_order_id' => $order->id,
            'user_id' => $user->id,
            'gateway' => 'paypal',
            'gateway_subscription_id' => 'I-UNVERIFIABLE-HOSTING',
            'status' => 'pending',
            'expires_at' => now()->subMinute(),
        ]);

        config()->set('services.paypal.client_id', 'test-client');
        config()->set('services.paypal.secret', 'test-secret');
        Http::fake([
            'https://api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response(
                [
                    'access_token' => 'test-access-token',
                    'expires_in' => 3600,
                ],
            ),
            'https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-UNVERIFIABLE-HOSTING' => Http::response(
                [],
                404,
            ),
        ]);

        $this->assertFalse(
            app(HostingCheckoutAttemptReconciler::class)->reconcileOne(
                $attempt->id,
            ),
        );
        $this->assertSame('action_required', $attempt->fresh()->status);
        $this->assertSame(
            'remote_subscription_not_verifiable',
            $attempt->fresh()->failure_code,
        );
        $this->assertSame(
            0,
            app(PendingHostingOrderService::class)->expireDue(),
        );
        $this->assertSame(
            'unverifiable-remote-attempt.hsite.top',
            $order->fresh()->domain_reservation_key,
        );
        $this->assertSame(
            HostingOrderStatus::AwaitingPayment,
            $order->fresh()->status,
        );
    }

    public function test_second_remote_attempt_is_cancelled_before_being_superseded(): void
    {
        [$user, $workspace, , $zone] = $this->freeFixture();
        [$paidPlan, $price] = $this->paidPlan();
        $price->forceFill(['paypal_id' => 'P-DUPLICATE-HOSTING'])->save();
        settings()->set('billing.paypal.enable', true);
        settings()->set('billing.paypal_test_mode', true);
        Queue::fake();

        $order = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $paidPlan,
            $zone,
            'duplicate-remote-attempt',
            'duplicate-remote-attempt-' . Str::random(20),
            $price,
        );

        $winningAttempt = HostingCheckoutAttempt::create([
            'hosting_order_id' => $order->id,
            'user_id' => $user->id,
            'gateway' => 'paypal',
            'gateway_subscription_id' => 'I-WINNING-HOSTING',
            'status' => 'pending',
            'expires_at' => now()->addHour(),
        ]);
        $duplicateAttempt = HostingCheckoutAttempt::create([
            'hosting_order_id' => $order->id,
            'user_id' => $user->id,
            'gateway' => 'paypal',
            'gateway_subscription_id' => 'I-DUPLICATE-HOSTING',
            'status' => 'pending',
            'expires_at' => now()->addHour(),
        ]);

        $subscription = Subscription::create([
            'user_id' => $user->id,
            'product_id' => $paidPlan->product_id,
            'price_id' => $price->id,
            'gateway_name' => 'paypal',
            'gateway_id' => 'I-WINNING-HOSTING',
            'gateway_status' => 'ACTIVE',
            'checkout_reference' => 'hosting_order:' . $order->uuid,
            'renews_at' => now()->addMonth(),
            'quantity' => 1,
        ]);

        $this->assertSame('fulfilled', $winningAttempt->fresh()->status);
        $this->assertSame(
            'cancellation_pending',
            $duplicateAttempt->fresh()->status,
        );

        config()->set('services.paypal.client_id', 'test-client');
        config()->set('services.paypal.secret', 'test-secret');
        Http::fake([
            'https://api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response(
                [
                    'access_token' => 'test-access-token',
                    'expires_in' => 3600,
                ],
            ),
            'https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-DUPLICATE-HOSTING' => Http::sequence()
                ->push([
                    'id' => 'I-DUPLICATE-HOSTING',
                    'plan_id' => 'P-DUPLICATE-HOSTING',
                    'status' => 'APPROVAL_PENDING',
                    'custom_id' => 'hosting_order:' . $order->uuid,
                ])
                ->push([
                    'id' => 'I-DUPLICATE-HOSTING',
                    'plan_id' => 'P-DUPLICATE-HOSTING',
                    'status' => 'CANCELLED',
                    'custom_id' => 'hosting_order:' . $order->uuid,
                ]),
            'https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-DUPLICATE-HOSTING/cancel' => Http::response(
                [],
                204,
            ),
        ]);

        $this->assertTrue(
            app(HostingCheckoutAttemptReconciler::class)->reconcileOne(
                $duplicateAttempt->id,
            ),
        );
        $this->assertSame('superseded', $duplicateAttempt->fresh()->status);
        $this->assertSame(
            'superseded_checkout_cancelled',
            $duplicateAttempt->fresh()->failure_code,
        );
        $this->assertSame(1, HostingAccount::query()->count());
        $this->assertSame(
            $subscription->id,
            $order->account()->firstOrFail()->subscription_id,
        );
        $this->assertDatabaseCount('subscriptions', 1);
    }

    public function test_suspended_remote_subscription_never_provisions_or_releases_domain(): void
    {
        [$user, $workspace, , $zone] = $this->freeFixture();
        [$paidPlan, $price] = $this->paidPlan();
        $price->forceFill(['paypal_id' => 'P-SUSPENDED-HOSTING'])->save();
        settings()->set('billing.paypal.enable', true);
        settings()->set('billing.paypal_test_mode', true);

        $order = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $paidPlan,
            $zone,
            'suspended-remote-attempt',
            'suspended-remote-attempt-' . Str::random(20),
            $price,
        );
        $order->forceFill(['expires_at' => now()->subMinutes(5)])->save();

        $attempt = HostingCheckoutAttempt::create([
            'hosting_order_id' => $order->id,
            'user_id' => $user->id,
            'gateway' => 'paypal',
            'gateway_subscription_id' => 'I-SUSPENDED-HOSTING',
            'status' => 'pending',
            'expires_at' => now()->subMinute(),
        ]);

        config()->set('services.paypal.client_id', 'test-client');
        config()->set('services.paypal.secret', 'test-secret');
        Http::fake([
            'https://api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response(
                [
                    'access_token' => 'test-access-token',
                    'expires_in' => 3600,
                ],
            ),
            'https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-SUSPENDED-HOSTING' => Http::sequence()
                ->push([
                    'id' => 'I-SUSPENDED-HOSTING',
                    'plan_id' => 'P-SUSPENDED-HOSTING',
                    'status' => 'SUSPENDED',
                    'custom_id' => 'hosting_order:' . $order->uuid,
                ])
                ->push([
                    'id' => 'I-SUSPENDED-HOSTING',
                    'plan_id' => 'P-SUSPENDED-HOSTING',
                    'status' => 'CANCELLED',
                    'custom_id' => 'hosting_order:' . $order->uuid,
                ]),
            'https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-SUSPENDED-HOSTING/cancel' => Http::response(
                [],
                204,
            ),
        ]);

        $this->assertFalse(
            app(HostingCheckoutAttemptReconciler::class)->reconcileOne(
                $attempt->id,
            ),
        );
        $this->assertSame('action_required', $attempt->fresh()->status);
        $this->assertSame(
            'remote_subscription_cancelled_after_billing_state',
            $attempt->fresh()->failure_code,
        );
        $this->assertNull($order->account()->first());
        $this->assertSame(
            'suspended-remote-attempt.hsite.top',
            $order->fresh()->domain_reservation_key,
        );
        $this->assertSame(
            0,
            app(PendingHostingOrderService::class)->expireDue(),
        );
    }

    public function test_late_payment_for_cancelled_order_is_flagged_for_recovery(): void
    {
        [$user, $workspace, , $zone] = $this->freeFixture();
        [$paidPlan, $price] = $this->paidPlan();
        $price->forceFill(['stripe_id' => 'price_late_payment'])->save();
        settings()->set('billing.stripe.enable', true);
        Queue::fake();

        $order = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $paidPlan,
            $zone,
            'late-payment',
            'late-payment-order-' . Str::random(20),
            $price,
        );
        $order->forceFill(['expires_at' => now()->subMinute()])->save();
        $this->assertSame(
            1,
            app(PendingHostingOrderService::class)->expireDue(),
        );

        Subscription::create([
            'user_id' => $user->id,
            'product_id' => $paidPlan->product_id,
            'price_id' => $price->id,
            'gateway_name' => 'stripe',
            'gateway_id' => 'sub_' . Str::random(24),
            'gateway_status' => 'active',
            'checkout_reference' => 'hosting_order:' . $order->uuid,
            'renews_at' => now()->addMonth(),
            'quantity' => 1,
        ]);

        $order->refresh();
        $this->assertSame(HostingOrderStatus::Cancelled, $order->status);
        $this->assertSame('paid_after_checkout_closed', $order->failure_code);
        $this->assertNotNull($order->safe_failure_message);
        $this->assertNull($order->account()->first());
    }

    public function test_ending_additional_paid_hosting_preserves_site_when_all_free_slots_are_used(): void
    {
        [$user, $workspace, $freePlan, $zone] = $this->freeFixture();
        app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $freePlan,
            $zone,
            'free-slot-owner',
            'free-slot-owner-order-' . Str::random(20),
        );
        app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $freePlan,
            $zone,
            'second-free-slot-owner',
            'second-free-slot-owner-order-' . Str::random(20),
        );
        [$paidPlan, $price] = $this->paidPlan();
        $price->forceFill(['stripe_id' => 'price_hosting_pro'])->save();
        settings()->set('billing.stripe.enable', true);
        Queue::fake();
        $order = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $paidPlan,
            $zone,
            'paid-preserved',
            'paid-preserved-order-' . Str::random(20),
            $price,
        );
        $subscription = Subscription::create([
            'user_id' => $user->id,
            'product_id' => $paidPlan->product_id,
            'price_id' => $price->id,
            'gateway_name' => 'none',
            'gateway_id' => 'preserved-' . Str::uuid(),
            'gateway_status' => 'active',
            'checkout_reference' => 'hosting_order:' . $order->uuid,
            'renews_at' => now()->addMonth(),
            'quantity' => 1,
        ]);
        $paidAccount = $order->account()->firstOrFail();
        $paidAccount
            ->forceFill([
                'status' => HostingAccountStatus::Active,
                'desired_status' => HostingAccountStatus::Active,
            ])
            ->save();

        $subscription
            ->forceFill([
                'ends_at' => now()->subMinute(),
                'renews_at' => null,
            ])
            ->save();

        $paidAccount->refresh();
        $this->assertSame(
            HostingAccountStatus::ActionRequired,
            $paidAccount->status,
        );
        $this->assertSame($paidPlan->id, $paidAccount->hosting_plan_id);
        $this->assertNull($paidAccount->free_slot);
        $this->assertNull($paidAccount->deleted_at);
        $this->assertSame(
            'free_slot_already_used',
            $paidAccount->events()->latest('id')->firstOrFail()->metadata[
                'code'
            ],
        );
    }

    public function test_ticket_content_is_plain_text_and_scoped_to_the_customer(): void
    {
        [$user, $workspace] = $this->freeFixture();
        $request = $this->requestFor($user, [
            'subject' => '<b>Ajuda técnica</b>',
            'message' =>
                '<script>alert(1)</script>Preciso de ajuda com meu site.',
            'type' => 'bug',
            'department' => 'technical',
            'priority' => 'high',
        ]);

        app(SupportTicketsController::class)->store($request);
        $ticket = SupportTicket::query()->firstOrFail();
        $this->assertSame('Ajuda técnica', $ticket->subject);
        $this->assertSame('bug', $ticket->type);
        $this->assertSame('technical', $ticket->department);
        $this->assertSame('high', $ticket->priority);
        $this->assertStringNotContainsString(
            '<script>',
            $ticket->messages()->firstOrFail()->body,
        );

        $other = $this->user('intruso@example.test');
        $this->expectException(ModelNotFoundException::class);
        app(SupportTicketsController::class)->show(
            $this->requestFor($other),
            $ticket->id,
        );
    }

    public function test_ticket_attachments_are_private_and_scoped_to_ticket_owner(): void
    {
        Storage::fake('local');
        [$user] = $this->freeFixture();
        $file = UploadedFile::fake()->create('erro.txt', 1, 'text/plain');
        $request = Request::create(
            '/testing',
            'POST',
            [
                'subject' => 'Ajuda com painel',
                'message' => 'Preciso anexar um print do erro no painel.',
            ],
            [],
            ['attachments' => [$file]],
        );
        $request->setUserResolver(fn() => $user);

        $resource = app(SupportTicketsController::class)->store($request);
        $ticket = SupportTicket::query()
            ->with('messages.attachments')
            ->firstOrFail();
        $attachment = $ticket->messages->first()->attachments->first();

        $this->assertNotNull($attachment);
        $this->assertSame('erro.txt', $attachment->file_name);
        Storage::disk('local')->assertExists($attachment->path);

        $payload = $resource->toArray(Request::create('/testing', 'GET'));
        $this->assertSame(
            'erro.txt',
            $payload['messages'][0]['attachments'][0]['file_name'],
        );
        $this->assertStringContainsString(
            "/api/v1/support/tickets/{$ticket->id}/attachments/{$attachment->id}",
            $payload['messages'][0]['attachments'][0]['download_url'],
        );

        $other = $this->user('outro@example.test');
        $this->expectException(ModelNotFoundException::class);
        app(SupportTicketsController::class)->downloadAttachment(
            $this->requestFor($other),
            $ticket->id,
            $attachment->id,
        );
    }

    public function test_admin_operation_request_is_permission_gated_and_audited(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $plan,
            $zone,
            'audit-admin',
            'audit-admin-operation',
        )->account;
        Queue::fake();

        $admin = new class extends User {
            public function hasPermission(string $name): bool
            {
                return $name === 'hosting.operations';
            }
        };
        $admin->id = 991;

        app(AdminHostingController::class)->accountOperation(
            $this->requestFor($admin, ['operation' => 'reconcile']),
            $account->id,
        );

        $event = $account
            ->events()
            ->where('event', 'admin_operation_requested')
            ->firstOrFail();
        $this->assertSame(991, $event->actor_user_id);
        $this->assertSame('reconcile', $event->metadata['operation']);
        $this->assertArrayNotHasKey('raw_payload', $event->metadata);
    }

    public function test_admin_hosting_lists_apply_server_pagination_search_and_sorting(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $plan,
            $zone,
            'pagina-admin',
            'admin-pagination',
        )->account;

        \App\Hosting\Models\HostingProviderOperation::create([
            'uuid' => (string) Str::uuid(),
            'hosting_account_id' => $account->id,
            'provider' => 'mofh',
            'operation' => ProviderOperationType::Reconcile,
            'idempotency_key' => 'admin-pagination-operation',
            'status' => ProviderOperationStatus::RetryableFailed,
            'safe_code' => 'provider_timeout',
            'safe_message' => 'Provider timeout.',
        ]);

        $admin = new class extends User {
            public function hasPermission(string $name): bool
            {
                return $name === 'hosting.operations';
            }
        };
        $admin->id = 992;
        $controller = app(AdminHostingController::class);

        $accountPayload = $controller
            ->accounts(
                $this->requestFor($admin, [
                    'query' => 'pagina-admin.hsite.top',
                    'per_page' => 1,
                    'sort' => 'fqdn:asc',
                ]),
            )
            ->response()
            ->getData(true);
        $this->assertSame(1, $accountPayload['meta']['per_page']);
        $this->assertSame(1, $accountPayload['meta']['total']);
        $this->assertSame(
            'pagina-admin.hsite.top',
            $accountPayload['data'][0]['fqdn'],
        );

        $operationPayload = $controller
            ->operations(
                $this->requestFor($admin, [
                    'per_page' => 1,
                    'sort' => 'created_at:asc',
                ]),
            )
            ->response()
            ->getData(true);
        $this->assertSame(1, $operationPayload['meta']['per_page']);
        $this->assertSame(2, $operationPayload['meta']['total']);
        $this->assertCount(1, $operationPayload['data']);
        $this->assertNotNull($operationPayload['links']['next']);
    }

    public function test_sensitive_admin_account_operations_are_queued_and_audited_without_secrets(): void
    {
        [$user, $workspace, $freePlan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $freePlan,
                $zone,
                'admin-sensitive',
                'admin-sensitive-operations',
            )
            ->account->fresh();
        [$paidPlan, $price] = $this->paidPlan();
        $subscription = Subscription::create([
            'user_id' => $user->id,
            'product_id' => $paidPlan->product_id,
            'price_id' => $price->id,
            'gateway_name' => 'none',
            'gateway_id' => 'admin-' . Str::uuid(),
            'gateway_status' => 'active',
            'renews_at' => now()->addMonth(),
            'quantity' => 1,
        ]);
        $account->forceFill(['subscription_id' => $subscription->id])->save();
        Queue::fake();

        $admin = new class extends User {
            public function hasPermission(string $name): bool
            {
                return $name === 'hosting.operations';
            }
        };
        $admin->id = 993;
        $controller = app(AdminHostingController::class);

        $controller->accountOperation(
            $this->requestFor($admin, ['operation' => 'change_password']),
            $account->id,
        );
        $controller->accountOperation(
            $this->requestFor($admin, [
                'operation' => 'change_package',
                'target_plan_id' => $paidPlan->id,
            ]),
            $account->id,
        );
        $account
            ->forceFill([
                'status' => HostingAccountStatus::Suspended,
                'suspended_at' => now(),
            ])
            ->save();
        $controller->accountOperation(
            $this->requestFor($admin, ['operation' => 'delete']),
            $account->id,
        );
        try {
            $controller->accountOperation(
                $this->requestFor($admin, [
                    'operation' => 'change_password',
                ]),
                $account->id,
            );
            $this->fail('A configuration change was queued during deletion.');
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            $this->assertSame(409, $e->getStatusCode());
        }

        Queue::assertPushed(RunHostingAccountOperation::class, 3);
        Queue::assertPushed(
            RunHostingAccountOperation::class,
            fn(RunHostingAccountOperation $job) => $job->type ===
                ProviderOperationType::ChangePassword &&
                $job->actorUserId === 993,
        );
        Queue::assertPushed(
            RunHostingAccountOperation::class,
            fn(RunHostingAccountOperation $job) => $job->type ===
                ProviderOperationType::ChangePackage &&
                $job->targetPlanId === $paidPlan->id,
        );
        Queue::assertPushed(
            RunHostingAccountOperation::class,
            fn(RunHostingAccountOperation $job) => $job->type ===
                ProviderOperationType::Delete,
        );

        $passwordEvent = $account
            ->events()
            ->where('event', 'admin_password_reset_requested')
            ->firstOrFail();
        $packageEvent = $account
            ->events()
            ->where('event', 'admin_package_change_requested')
            ->firstOrFail();
        $deletionEvent = $account
            ->events()
            ->where('event', 'admin_deletion_requested')
            ->firstOrFail();

        $this->assertSame(993, $passwordEvent->actor_user_id);
        $this->assertSame(
            $paidPlan->id,
            $packageEvent->metadata['hosting_plan_id'],
        );
        $this->assertArrayNotHasKey('password', $passwordEvent->metadata);
        $this->assertSame(
            1,
            $account
                ->events()
                ->where('event', 'admin_password_reset_requested')
                ->count(),
        );
        $this->assertArrayNotHasKey('raw_payload', $packageEvent->metadata);
        $this->assertSame(993, $deletionEvent->actor_user_id);
        $this->assertSame(
            HostingAccountStatus::PendingDeletion,
            $account->fresh()->status,
        );
    }

    public function test_admin_cannot_apply_a_paid_package_without_confirmed_entitlement(): void
    {
        [$user, $workspace, $freePlan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $freePlan,
                $zone,
                'admin-no-entitlement',
                'admin-no-entitlement-operation',
            )
            ->account->fresh();
        [$paidPlan] = $this->paidPlan();
        Queue::fake();

        $admin = new class extends User {
            public function hasPermission(string $name): bool
            {
                return $name === 'hosting.operations';
            }
        };
        $admin->id = 994;

        try {
            app(AdminHostingController::class)->accountOperation(
                $this->requestFor($admin, [
                    'operation' => 'change_package',
                    'target_plan_id' => $paidPlan->id,
                ]),
                $account->id,
            );
            $this->fail('A paid package was queued without entitlement.');
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            $this->assertSame(422, $e->getStatusCode());
        }

        Queue::assertNotPushed(RunHostingAccountOperation::class);
        $this->assertFalse(
            $account
                ->events()
                ->where('event', 'admin_package_change_requested')
                ->exists(),
        );
    }

    public function test_admin_can_inspect_safe_hosting_resources_with_an_audit_event(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'inspect-admin',
                'inspect-admin-resources',
            )
            ->account->fresh();

        $admin = new class extends User {
            public function hasPermission(string $name): bool
            {
                return $name === 'hosting.operations';
            }
        };
        $admin->id = 992;
        $request = Request::create('/testing', 'GET', ['path' => '']);
        $request->setUserResolver(fn() => $admin);

        $response = app(AdminHostingController::class)->accountResources(
            $request,
            $account->id,
            app(HostingDomainProvider::class),
            app(HostingFileManagerProvider::class),
            app(HostingDatabaseProvider::class),
            app(\App\Hosting\Services\HostingFilePath::class),
        );
        $payload = $response->getData(true)['data'];

        $this->assertSame('available', $payload['domains']['availability']);
        $this->assertSame('available', $payload['files']['availability']);
        $this->assertSame('available', $payload['databases']['availability']);
        $this->assertSame(
            $account->fqdn,
            $payload['domains']['data'][0]['domain'],
        );
        $this->assertSame($user->email, $payload['customer']['email']);
        $this->assertStringNotContainsString(
            (string) $account->credential_secret,
            json_encode($payload, JSON_THROW_ON_ERROR),
        );
        $this->assertDatabaseHas('hosting_account_events', [
            'hosting_account_id' => $account->id,
            'actor_user_id' => 992,
            'event' => 'admin_resources_inspected',
        ]);
    }

    public function test_admin_file_deletion_is_permission_gated_scoped_and_audited(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'admin-files',
                'admin-file-delete',
            )
            ->account->fresh();
        $admin = new class extends User {
            public function hasPermission(string $name): bool
            {
                return $name === 'hosting.operations';
            }
        };
        $admin->id = 993;
        $path = 'htdocs/private/config.php';

        $response = app(HostingFilesController::class)->adminDestroy(
            $this->requestFor($admin, ['path' => $path]),
            $account->id,
            app(HostingFileManagerProvider::class),
        );

        $this->assertSame(200, $response->getStatusCode());
        $event = $account
            ->events()
            ->where('event', 'admin_file_deleted')
            ->firstOrFail();
        $this->assertSame(993, $event->actor_user_id);
        $this->assertSame(hash('sha256', $path), $event->metadata['path_hash']);
        $this->assertStringNotContainsString(
            $path,
            json_encode($event->metadata, JSON_THROW_ON_ERROR),
        );
    }

    public function test_admin_resource_deletion_rejects_users_without_permission(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'denied-files',
                'denied-admin-file-delete',
            )
            ->account->fresh();
        $denied = new class extends User {
            public function hasPermission(string $name): bool
            {
                return false;
            }
        };
        $denied->id = 995;

        try {
            app(HostingFilesController::class)->adminDestroy(
                $this->requestFor($denied, ['path' => 'htdocs/index.php']),
                $account->id,
                app(HostingFileManagerProvider::class),
            );
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $exception) {
            $this->assertSame(403, $exception->getStatusCode());
            $this->assertDatabaseMissing('hosting_account_events', [
                'hosting_account_id' => $account->id,
                'actor_user_id' => 995,
                'event' => 'admin_file_deleted',
            ]);
            return;
        }

        $this->fail(
            'A destructive admin action was allowed without permission.',
        );
    }

    public function test_admin_ssl_revocation_clears_secrets_and_is_audited(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'admin-ssl',
                'admin-ssl-revoke',
            )
            ->account->fresh();
        $certificate = $account->sslCertificates()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'domain' => $account->fqdn,
            'provider' => 'fake',
            'status' => 'issued',
            'installation_status' => 'installed',
            'remote_order_id' => 'remote-secret-order',
            'private_key' => 'private-secret',
            'csr' => 'csr-secret',
            'certificate' => 'certificate-secret',
            'ca_certificate' => 'ca-secret',
            'requested_at' => now()->subMinute(),
            'issued_at' => now(),
        ]);
        $admin = new class extends User {
            public function hasPermission(string $name): bool
            {
                return $name === 'hosting.operations';
            }
        };
        $admin->id = 994;

        $response = app(
            \App\Hosting\Controllers\HostingSslController::class,
        )->adminDestroy(
            $this->requestFor($admin),
            $account->id,
            $certificate->id,
        );

        $this->assertSame(200, $response->getStatusCode());
        $certificate->refresh();
        $this->assertSame('revoked', $certificate->status);
        $this->assertNull($certificate->private_key);
        $this->assertNull($certificate->csr);
        $this->assertNull($certificate->certificate);
        $this->assertNull($certificate->ca_certificate);
        $this->assertDatabaseHas('hosting_account_events', [
            'hosting_account_id' => $account->id,
            'actor_user_id' => 994,
            'event' => 'admin_ssl_revoked',
        ]);
        $event = $account
            ->events()
            ->where('event', 'admin_ssl_revoked')
            ->firstOrFail();
        $this->assertArrayNotHasKey('remote_order_id', $event->metadata);
    }

    public function test_only_https_tool_urls_without_embedded_credentials_are_accepted(): void
    {
        $urls = app(SafeToolUrl::class);
        $this->assertSame(
            'https://panel.example.test/login',
            $urls->validate('https://panel.example.test/login'),
        );
        $this->assertNull($urls->validate('http://panel.example.test'));
        $this->assertNull(
            $urls->validate('https://user:secret@panel.example.test'),
        );
    }

    public function test_tool_catalog_uses_current_settings_for_an_existing_account(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'ferramentas',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $account
            ->forceFill([
                'control_panel_url' => null,
                'webftp_url' => null,
                'installer_url' => null,
            ])
            ->save();

        config()->set('hospedfree.vistapanel.enabled', true);
        config()->set(
            'hospedfree.vistapanel.cpanel_url',
            'https://panel-current.example.test',
        );
        config()->set('hospedfree.file_manager.enabled', true);
        config()->set('hospedfree.tools.webftp_url', null);

        $catalog = collect(
            app(\App\Hosting\Services\HostingToolsService::class)->catalog(
                $account,
            ),
        )->keyBy('key');

        $this->assertTrue($catalog['control-panel']['available']);
        $this->assertTrue($catalog['webftp']['available']);
        $this->assertTrue($catalog['installer']['available']);
        $this->assertFalse($catalog->has('file-manager'));
    }

    public function test_panel_tool_uses_the_current_config_when_the_account_link_is_stale(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'painel-atual',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $account->forceFill(['control_panel_url' => null])->save();

        config()->set(
            'hospedfree.tools.control_panel_url',
            'https://panel-current.example.test',
        );
        $this->actingAs($user, 'sanctum');

        $response = app(HostingAccountsController::class)->tool(
            $this->requestFor($user),
            $account->id,
            'control-panel',
            app(\App\Hosting\Services\HostingToolsService::class),
        );

        $launchUrl = $response->getData(true)['url'];
        $this->assertStringStartsWith('/hosting/tool-launch/', $launchUrl);

        $this->actingAs($user);
        $this->get($launchUrl)
            ->assertRedirect('https://panel-current.example.test')
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertHeader('Referrer-Policy', 'no-referrer');
    }

    public function test_installer_falls_back_to_the_panel_when_the_provider_url_contains_the_password(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'instalador-seguro',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();

        config()->set('hospedfree.vistapanel.enabled', true);
        config()->set(
            'hospedfree.vistapanel.cpanel_url',
            'https://panel-current.example.test',
        );
        config()->set(
            'hospedfree.tools.control_panel_url',
            'https://panel-current.example.test',
        );
        $this->app->instance(
            HostingPanelProvider::class,
            new class implements HostingPanelProvider {
                public function key(): string
                {
                    return 'password-url-test';
                }

                public function createPanelSession(
                    PanelAccountCredentialsData $account,
                ): ProviderResponse {
                    return ProviderResponse::failure(
                        'panel_sso_not_supported',
                        'Panel SSO is not supported.',
                    );
                }

                public function createInstallerSession(
                    PanelAccountCredentialsData $account,
                ): ProviderResponse {
                    return ProviderResponse::failure(
                        'installer_redirect_contains_password',
                        'The installer URL contained the account password.',
                    );
                }

                public function stats(
                    PanelAccountCredentialsData $account,
                ): ProviderResponse {
                    return ProviderResponse::failure(
                        'stats_unavailable',
                        'Stats are unavailable.',
                    );
                }
            },
        );

        $result = app(\App\Hosting\Services\HostingToolsService::class)->open(
            $account,
            'installer',
        );

        $this->assertTrue($result->success);
        $this->assertSame(
            'https://panel-current.example.test',
            $result->toolLinks['installer'],
        );
        $this->assertStringNotContainsString(
            (string) $account->credential_secret,
            json_encode($result, JSON_THROW_ON_ERROR),
        );
    }

    public function test_file_manager_tool_does_not_accept_embedded_credentials(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'arquivos',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();

        config()->set(
            'hospedfree.tools.file_manager_url',
            'https://user:secret@files.example.test',
        );
        $this->actingAs($user, 'sanctum');

        $this->expectException(
            \Symfony\Component\HttpKernel\Exception\NotFoundHttpException::class,
        );
        app(HostingAccountsController::class)->tool(
            $this->requestFor($user),
            $account->id,
            'file-manager',
            app(\App\Hosting\Services\HostingToolsService::class),
        );
    }

    public function test_site_builder_creates_server_side_session_without_returning_credentials(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'builder',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();

        config()->set('hospedfree.site_builder.enabled', true);
        config()->set(
            'hospedfree.site_builder.endpoint',
            'https://builder.example.test',
        );
        config()->set('hospedfree.site_builder.username', 'builder-user');
        config()->set('hospedfree.site_builder.password', 'builder-secret');
        app()->instance(
            HostingSiteBuilderProvider::class,
            app(SiteProHostingSiteBuilderProvider::class),
        );
        $this->actingAs($user, 'sanctum');

        Http::fake([
            'builder.example.test/api/requestLogin' => Http::response([
                'url' => 'https://builder.example.test/session/safe-token',
            ]),
        ]);

        $response = app(HostingAccountsController::class)->tool(
            $this->requestFor($user),
            $account->id,
            'site-builder',
            app(\App\Hosting\Services\HostingToolsService::class),
        );
        $payload = $response->getData(true);

        $this->assertStringStartsWith('/hosting/tool-launch/', $payload['url']);
        $this->assertStringNotContainsString(
            $account->credential_secret,
            json_encode($payload),
        );
        $this->actingAs($user);
        $this->get($payload['url'])
            ->assertRedirect('https://builder.example.test/session/safe-token')
            ->assertHeader('Referrer-Policy', 'no-referrer');
        $this->get($payload['url'])->assertNotFound();
        Http::assertSent(
            fn($request) => $request['password'] ===
                $account->credential_secret,
        );
    }

    public function test_site_builder_rejects_a_session_url_from_another_host(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'builder-host',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();

        config()->set('hospedfree.site_builder.enabled', true);
        config()->set(
            'hospedfree.site_builder.endpoint',
            'https://builder.example.test',
        );
        config()->set('hospedfree.site_builder.username', 'builder-user');
        config()->set('hospedfree.site_builder.password', 'builder-secret');
        app()->instance(
            HostingSiteBuilderProvider::class,
            app(SiteProHostingSiteBuilderProvider::class),
        );
        $this->actingAs($user, 'sanctum');

        Http::fake([
            'builder.example.test/api/requestLogin' => Http::response([
                'url' => 'https://attacker.example/session/stolen',
            ]),
        ]);

        $response = app(HostingAccountsController::class)->tool(
            $this->requestFor($user),
            $account->id,
            'site-builder',
            app(\App\Hosting\Services\HostingToolsService::class),
        );
        $this->actingAs($user);
        $this->get($response->getData(true)['url'])->assertNotFound();
    }

    public function test_site_builder_rejects_credentials_or_tokens_in_session_query(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'builder-query',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();

        config()->set('hospedfree.site_builder.enabled', true);
        config()->set(
            'hospedfree.site_builder.endpoint',
            'https://builder.example.test',
        );
        config()->set('hospedfree.site_builder.username', 'builder-user');
        config()->set('hospedfree.site_builder.password', 'builder-secret');
        app()->instance(
            HostingSiteBuilderProvider::class,
            app(SiteProHostingSiteBuilderProvider::class),
        );
        $this->actingAs($user, 'sanctum');

        Http::fake([
            'builder.example.test/api/requestLogin' => Http::response([
                'url' => 'https://builder.example.test/editor?token=secret',
            ]),
        ]);

        $response = app(HostingAccountsController::class)->tool(
            $this->requestFor($user),
            $account->id,
            'site-builder',
            app(\App\Hosting\Services\HostingToolsService::class),
        );
        $this->actingAs($user);
        $this->get($response->getData(true)['url'])->assertNotFound();
    }

    public function test_ssl_request_is_scoped_to_owned_hosting_account(): void
    {
        config()->set('hospedfree.ssl.enabled', true);
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'sslsite',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $this->actingAs($user, 'sanctum');

        $resource = app(
            \App\Hosting\Controllers\HostingSslController::class,
        )->store(
            $this->requestFor($user, ['domain' => $account->fqdn]),
            $account->id,
        );
        $payload = $resource->toArray($this->requestFor($user));

        $this->assertSame($account->fqdn, $payload['domain']);
        $this->assertSame('action_required', $payload['status']);
        $this->assertArrayHasKey('dns_validation', $payload);
        $this->assertDatabaseHas('hosting_ssl_certificates', [
            'hosting_account_id' => $account->id,
            'domain' => $account->fqdn,
            'status' => 'action_required',
        ]);

        $verifyResponse = app(
            \App\Hosting\Controllers\HostingSslController::class,
        )->verify($this->requestFor($user), $account->id, $payload['id']);
        $verified = $verifyResponse->getData(true);

        $this->assertSame(200, $verifyResponse->getStatusCode());
        $this->assertSame('issued', $verified['data']['status']);
        $this->assertSame(
            'installed',
            $verified['data']['installation_status'],
        );
        $this->assertArrayNotHasKey('provider', $verified['data']);
        $this->assertArrayNotHasKey('private_key', $verified['data']);
        $this->assertArrayNotHasKey('certificate', $verified['data']);
        $this->assertDatabaseHas('hosting_ssl_certificates', [
            'id' => $payload['id'],
            'status' => 'issued',
            'installation_status' => 'installed',
        ]);
        $this->assertDatabaseHas('hosting_ssl_operations', [
            'hosting_ssl_certificate_id' => $payload['id'],
            'operation' => 'install',
            'status' => 'succeeded',
        ]);
        $serialized = \App\Hosting\Models\HostingSslCertificate::query()
            ->findOrFail($payload['id'])
            ->toArray();
        $this->assertArrayNotHasKey('private_key', $serialized);
        $this->assertArrayNotHasKey('csr', $serialized);
        $this->assertArrayNotHasKey('certificate', $serialized);
        $this->assertArrayNotHasKey('ca_certificate', $serialized);
    }

    public function test_ssl_index_filters_counts_and_paginates_certificates(): void
    {
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'ssl-list',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $this->actingAs($user, 'sanctum');

        $createCertificate = function (
            string $domain,
            string $status,
            ?string $installationStatus = null,
            ?string $renewalStatus = null,
            $validUntil = null,
        ) use ($account): void {
            HostingSslCertificate::query()->create([
                'hosting_account_id' => $account->id,
                'workspace_id' => $account->workspace_id,
                'user_id' => $account->user_id,
                'domain' => $domain,
                'provider' => 'fake',
                'status' => $status,
                'installation_status' => $installationStatus ?? 'not_started',
                'renewal_status' => $renewalStatus,
                'valid_until' => $validUntil,
                'requested_at' => now(),
            ]);
        };

        $createCertificate('action.example.test', 'action_required');
        $createCertificate(
            'issued.example.test',
            'issued',
            'installed',
            null,
            now()->addMonth(),
        );
        $createCertificate(
            'expired.example.test',
            'issued',
            'installed',
            null,
            now()->subDay(),
        );
        $createCertificate('revoked.example.test', 'revoked');
        $createCertificate('failed.example.test', 'failed');
        $createCertificate(
            'install.example.test',
            'issued',
            'failed',
            null,
            now()->addMonth(),
        );
        $createCertificate(
            'manual.example.test',
            'issued',
            'manual_required',
            null,
            now()->addMonth(),
        );

        $request = $this->requestFor($user, [
            'status' => 'action_required',
            'perPage' => 1,
        ]);
        $response = app(\App\Hosting\Controllers\HostingSslController::class)
            ->index($request, $account->id)
            ->toResponse($request);
        $payload = $response->getData(true);

        $this->assertCount(1, $payload['data']);
        $this->assertSame(2, $payload['meta']['total']);
        $this->assertSame(1, $payload['meta']['per_page']);
        $this->assertSame(
            [
                'all' => 7,
                'action_required' => 2,
                'issued' => 3,
                'expired' => 1,
                'revoked' => 1,
                'failed' => 2,
            ],
            $payload['counts'],
        );

        foreach (
            [['status' => 'unsupported'], ['perPage' => 101]]
            as $invalidQuery
        ) {
            try {
                app(
                    \App\Hosting\Controllers\HostingSslController::class,
                )->index($this->requestFor($user, $invalidQuery), $account->id);
                $this->fail('An invalid SSL index filter was accepted.');
            } catch (ValidationException $exception) {
                $this->assertNotEmpty($exception->errors());
            }
        }
    }

    public function test_ssl_request_accepts_only_active_domains_owned_by_the_account(): void
    {
        config()->set('hospedfree.ssl.enabled', true);
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'ssl-domains',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $account->domains()->create([
            'domain' => 'secure.example.test',
            'type' => 'custom',
            'status' => 'active',
            'is_primary' => false,
        ]);
        $account->domains()->create([
            'domain' => 'pending.example.test',
            'type' => 'custom',
            'status' => 'pending',
            'is_primary' => false,
        ]);
        $this->actingAs($user, 'sanctum');

        $resource = app(
            \App\Hosting\Controllers\HostingSslController::class,
        )->store(
            $this->requestFor($user, ['domain' => 'SECURE.EXAMPLE.TEST.']),
            $account->id,
        );
        $payload = $resource->toArray($this->requestFor($user));

        $this->assertSame('secure.example.test', $payload['domain']);
        $this->assertDatabaseHas('hosting_ssl_certificates', [
            'hosting_account_id' => $account->id,
            'domain' => 'secure.example.test',
        ]);

        try {
            app(\App\Hosting\Controllers\HostingSslController::class)->store(
                $this->requestFor($user, ['domain' => 'pending.example.test']),
                $account->id,
            );
            $this->fail('An inactive domain was accepted for SSL issuance.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('domain', $exception->errors());
        }

        $otherUser = $this->user('outro-ssl@example.test');
        $otherWorkspace = Workspace::create([
            'name' => 'Outra conta',
            'owner_id' => $otherUser->id,
            'is_personal' => true,
        ]);
        $otherAccount = app(CreateHostingOrder::class)
            ->execute(
                $otherUser,
                $otherWorkspace,
                $plan,
                $zone,
                'other-ssl',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $otherAccount->domains()->create([
            'domain' => 'foreign.example.test',
            'type' => 'custom',
            'status' => 'active',
            'is_primary' => false,
        ]);

        try {
            app(\App\Hosting\Controllers\HostingSslController::class)->store(
                $this->requestFor($user, ['domain' => 'foreign.example.test']),
                $account->id,
            );
            $this->fail('A domain from another hosting account was accepted.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('domain', $exception->errors());
        }
    }

    public function test_ssl_issuance_does_not_claim_installation_when_panel_contract_is_unavailable(): void
    {
        config()->set('hospedfree.ssl.enabled', true);
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'sslmanual',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $this->actingAs($user, 'sanctum');
        $this->app->instance(
            HostingCertificateInstaller::class,
            new class implements HostingCertificateInstaller {
                public function installCertificate(
                    PanelAccountCredentialsData $account,
                    string $domain,
                    string $privateKey,
                    string $certificate,
                    ?string $caCertificate = null,
                ): ProviderResponse {
                    return ProviderResponse::failure(
                        'panel_ssl_install_not_supported',
                        'The panel does not expose a verified installation contract.',
                    );
                }
            },
        );

        $resource = app(
            \App\Hosting\Controllers\HostingSslController::class,
        )->store(
            $this->requestFor($user, ['domain' => $account->fqdn]),
            $account->id,
        );
        $certificate = $resource->toArray($this->requestFor($user));
        $response = app(
            \App\Hosting\Controllers\HostingSslController::class,
        )->verify($this->requestFor($user), $account->id, $certificate['id']);
        $payload = $response->getData(true)['data'];

        $this->assertSame('issued', $payload['status']);
        $this->assertSame('manual_required', $payload['installation_status']);
        $this->assertNull($payload['installed_at']);
        $this->assertStringNotContainsString(
            'fake-private-key',
            json_encode($payload),
        );
        $this->assertDatabaseHas('hosting_ssl_operations', [
            'hosting_ssl_certificate_id' => $certificate['id'],
            'operation' => 'install',
            'status' => 'permanent_failed',
            'safe_code' => 'panel_ssl_install_not_supported',
        ]);
    }

    public function test_ssl_renewal_preserves_current_certificate_until_replacement_is_issued(): void
    {
        config()->set('hospedfree.ssl.enabled', true);
        config()->set('hospedfree.ssl.renew_before_days', 30);
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'sslrenew',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $this->actingAs($user, 'sanctum');

        $resource = app(
            \App\Hosting\Controllers\HostingSslController::class,
        )->store(
            $this->requestFor($user, ['domain' => $account->fqdn]),
            $account->id,
        );
        $requested = $resource->toArray($this->requestFor($user));
        app(\App\Hosting\Controllers\HostingSslController::class)->verify(
            $this->requestFor($user),
            $account->id,
            $requested['id'],
        );

        $certificate = \App\Hosting\Models\HostingSslCertificate::query()->findOrFail(
            $requested['id'],
        );
        $certificate
            ->forceFill([
                'valid_until' => now()->addDays(5),
                'last_checked_at' => now(),
            ])
            ->save();
        $currentMaterial = $certificate->certificate;
        $provider = app(HostingSslProvider::class);

        (new RequestHostingSslRenewal(
            $certificate->id,
            "test-renew-request:{$certificate->id}",
        ))->handle($provider);

        $certificate->refresh();
        $this->assertSame('issued', $certificate->status);
        $this->assertSame($currentMaterial, $certificate->certificate);
        $this->assertSame('action_required', $certificate->renewal_status);
        $this->assertNotNull($certificate->renewal_order_id);
        $this->assertNotNull($certificate->renewal_dns_validation);

        (new CompleteHostingSslRenewal(
            $certificate->id,
            "test-renew-complete:{$certificate->id}",
        ))->handle($provider);

        $certificate->refresh();
        $this->assertSame('issued', $certificate->status);
        $this->assertSame('installed', $certificate->installation_status);
        $this->assertNull($certificate->renewal_status);
        $this->assertNull($certificate->renewal_order_id);
        $this->assertNull($certificate->renewal_dns_validation);
        $this->assertNotNull($certificate->last_renewed_at);
        $this->assertTrue(
            $certificate->valid_until->isAfter(now()->addDays(80)),
        );
        $this->assertSame(
            2,
            $certificate->operations()->where('operation', 'renew')->count(),
        );
        $this->assertSame(
            2,
            $certificate->operations()->where('operation', 'install')->count(),
        );
    }

    public function test_ssl_reconciliation_records_safe_history_without_changing_valid_material(): void
    {
        config()->set('hospedfree.ssl.enabled', true);
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'sslreconcile',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $this->actingAs($user, 'sanctum');

        $resource = app(
            \App\Hosting\Controllers\HostingSslController::class,
        )->store(
            $this->requestFor($user, ['domain' => $account->fqdn]),
            $account->id,
        );
        $requested = $resource->toArray($this->requestFor($user));
        app(\App\Hosting\Controllers\HostingSslController::class)->verify(
            $this->requestFor($user),
            $account->id,
            $requested['id'],
        );
        $certificate = \App\Hosting\Models\HostingSslCertificate::query()->findOrFail(
            $requested['id'],
        );
        $material = $certificate->certificate;
        $certificate->forceFill(['last_checked_at' => null])->save();

        (new ReconcileHostingSslCertificate(
            $certificate->id,
            "test-reconcile:{$certificate->id}",
        ))->handle(app(HostingSslProvider::class));

        $certificate->refresh();
        $this->assertSame('issued', $certificate->status);
        $this->assertSame($material, $certificate->certificate);
        $this->assertNotNull($certificate->last_checked_at);
        $this->assertDatabaseHas('hosting_ssl_operations', [
            'hosting_ssl_certificate_id' => $certificate->id,
            'operation' => 'reconcile',
            'status' => 'succeeded',
        ]);
    }

    public function test_hosting_maintenance_dispatches_due_ssl_reconciliation_and_renewal(): void
    {
        config()->set('hospedfree.ssl.enabled', true);
        config()->set('hospedfree.ssl.maintenance_enabled', true);
        config()->set('hospedfree.ssl.renew_before_days', 30);
        [$user, $workspace, $plan, $zone] = $this->freeFixture();
        $account = app(CreateHostingOrder::class)
            ->execute(
                $user,
                $workspace,
                $plan,
                $zone,
                'sslmaintenance',
                'free-order-' . Str::random(24),
            )
            ->account->fresh();
        $this->actingAs($user, 'sanctum');

        $resource = app(
            \App\Hosting\Controllers\HostingSslController::class,
        )->store(
            $this->requestFor($user, ['domain' => $account->fqdn]),
            $account->id,
        );
        $requested = $resource->toArray($this->requestFor($user));
        app(\App\Hosting\Controllers\HostingSslController::class)->verify(
            $this->requestFor($user),
            $account->id,
            $requested['id'],
        );
        $certificate = \App\Hosting\Models\HostingSslCertificate::query()->findOrFail(
            $requested['id'],
        );
        $certificate
            ->forceFill([
                'valid_until' => now()->addDays(5),
                'last_checked_at' => null,
            ])
            ->save();

        Queue::fake();
        $this->assertSame(0, app(ProcessHostingMaintenance::class)->handle());

        Queue::assertPushed(
            ReconcileHostingSslCertificate::class,
            fn(ReconcileHostingSslCertificate $job) => $job->certificateId ===
                $certificate->id,
        );
        Queue::assertPushed(
            RequestHostingSslRenewal::class,
            fn(RequestHostingSslRenewal $job) => $job->certificateId ===
                $certificate->id,
        );
    }

    public function test_awaiting_payment_order_expires_and_releases_domain_and_plan_capacity_idempotently(): void
    {
        [$user, $workspace, , $zone] = $this->freeFixture();
        [$paidPlan, $price] = $this->paidPlan();
        $price->forceFill(['stripe_id' => 'price_expiring_order'])->save();
        settings()->set('billing.stripe.enable', true);
        Queue::fake();

        $order = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $paidPlan,
            $zone,
            'expiring-paid',
            'expiring-order-' . Str::random(32),
            $price,
        );

        $this->assertSame(HostingOrderStatus::AwaitingPayment, $order->status);
        $this->assertNotNull($order->expires_at);
        $this->assertTrue($order->expires_at->isFuture());
        $this->assertSame(
            'expiring-paid.hsite.top',
            $order->domain_reservation_key,
        );

        $order->forceFill(['expires_at' => now()->subMinute()])->save();
        $pendingOrders = app(PendingHostingOrderService::class);

        $this->assertSame(1, $pendingOrders->expireDue());
        $this->assertSame(0, $pendingOrders->expireDue());

        $order->refresh();
        $this->assertSame(HostingOrderStatus::Cancelled, $order->status);
        $this->assertNull($order->domain_reservation_key);
        $this->assertNotNull($order->cancelled_at);

        $replacement = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $paidPlan,
            $zone,
            'expiring-paid',
            'replacement-order-' . Str::random(32),
            $price,
        );

        $this->assertSame(
            HostingOrderStatus::AwaitingPayment,
            $replacement->status,
        );
        $this->assertSame(
            'expiring-paid.hsite.top',
            $replacement->domain_reservation_key,
        );
    }

    public function test_domain_availability_expires_stale_payment_reservation(): void
    {
        [$user, $workspace, , $zone] = $this->freeFixture();
        [$paidPlan, $price] = $this->paidPlan();
        $price->forceFill(['stripe_id' => 'price_domain_expiry'])->save();
        settings()->set('billing.stripe.enable', true);

        $order = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $paidPlan,
            $zone,
            'stale-domain',
            'stale-domain-order-' . Str::random(32),
            $price,
        );
        $order->forceFill(['expires_at' => now()->subMinute()])->save();

        $result = app(HostingDomainService::class)->checkAvailability(
            'stale-domain',
            $zone,
        );

        $this->assertTrue($result->success);
        $this->assertSame('available', $result->status);
        $order->refresh();
        $this->assertSame(HostingOrderStatus::Cancelled, $order->status);
        $this->assertNull($order->domain_reservation_key);
    }

    public function test_customer_can_cancel_only_their_own_unpaid_order(): void
    {
        [$user, $workspace, , $zone] = $this->freeFixture();
        [$paidPlan, $price] = $this->paidPlan();
        $price->forceFill(['stripe_id' => 'price_cancel_order'])->save();
        settings()->set('billing.stripe.enable', true);

        $order = app(CreateHostingOrder::class)->execute(
            $user,
            $workspace,
            $paidPlan,
            $zone,
            'owner-only',
            'owner-only-order-' . Str::random(32),
            $price,
        );
        $otherUser = $this->user('outro-cliente@example.test');
        $controller = app(HostingOrdersController::class);
        $pendingOrders = app(PendingHostingOrderService::class);

        try {
            $controller->destroy(
                $this->requestFor($otherUser),
                $order->id,
                $pendingOrders,
            );
            $this->fail('Another customer cancelled an order they do not own.');
        } catch (ModelNotFoundException) {
            $this->assertTrue(true);
        }

        $order->refresh();
        $this->assertSame(HostingOrderStatus::AwaitingPayment, $order->status);
        $this->assertNotNull($order->domain_reservation_key);

        $payload = $controller
            ->destroy($this->requestFor($user), $order->id, $pendingOrders)
            ->toArray($this->requestFor($user));

        $this->assertSame('cancelled', $payload['status']);
        $this->assertFalse($payload['can_cancel']);
        $this->assertNull($order->fresh()->domain_reservation_key);

        $secondPayload = $controller
            ->destroy($this->requestFor($user), $order->id, $pendingOrders)
            ->toArray($this->requestFor($user));
        $this->assertSame('cancelled', $secondPayload['status']);
    }

    private function freeFixture(): array
    {
        $user = $this->user();
        $workspace = Workspace::create([
            'name' => 'Pessoal',
            'owner_id' => $user->id,
            'is_personal' => true,
        ]);
        $product = Product::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Hospedagem Free',
            'description' => 'Plano gratuito',
            'feature_list' => [],
            'position' => 0,
            'recommended' => false,
            'free' => true,
            'hidden' => false,
            'trial_period_days' => 0,
        ]);
        $plan = HostingPlan::create([
            'product_id' => $product->id,
            'type' => HostingPlanType::Free,
            'max_accounts_per_workspace' => 2,
            'quotas' => [
                'disk_mb' => 5120,
                'bandwidth_mb' => 50000,
                'domains' => 2,
                'databases' => 2,
                'ad_free' => true,
            ],
            'is_active' => true,
            'sort_order' => 0,
        ]);
        HostingProviderPackage::create([
            'hosting_plan_id' => $plan->id,
            'provider' => 'fake',
            'remote_package' => 'free',
            'is_active' => true,
        ]);
        $zone = HostingZone::create([
            'domain' => 'hsite.top',
            'is_default' => true,
            'is_active' => true,
        ]);
        return [
            $user,
            $workspace,
            $plan->load(['product', 'providerPackages']),
            $zone,
        ];
    }

    private function paidPlan(): array
    {
        $product = Product::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Hospedagem Pro',
            'description' => 'Plano pago',
            'feature_list' => [],
            'position' => 1,
            'recommended' => true,
            'free' => false,
            'hidden' => false,
            'trial_period_days' => 0,
        ]);
        $price = Price::create([
            'product_id' => $product->id,
            'amount' => 10,
            'currency' => 'BRL',
            'interval' => 'month',
            'interval_count' => 1,
            'default' => true,
        ]);
        $plan = HostingPlan::create([
            'product_id' => $product->id,
            'type' => HostingPlanType::Paid,
            'max_accounts_per_workspace' => 1,
            'is_active' => true,
            'sort_order' => 1,
        ]);
        HostingProviderPackage::create([
            'hosting_plan_id' => $plan->id,
            'provider' => 'fake',
            'remote_package' => 'pro',
            'is_active' => true,
        ]);
        return [$plan->load(['product', 'providerPackages']), $price];
    }

    private function user(string $email = 'cliente@example.test'): User
    {
        return User::withoutEvents(
            fn() => User::create([
                'name' => 'Cliente',
                'email' => $email,
                'email_verified_at' => now(),
                'password' => bcrypt('password'),
            ]),
        );
    }

    private function requestFor(User $user, array $data = []): Request
    {
        $request = Request::create('/testing', 'POST', $data);
        $request->setUserResolver(fn() => $user);
        return $request;
    }

    private function createSchema(): void
    {
        Schema::create('users', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('remember_token')->nullable();
            $table->string('paypal_id')->nullable()->unique();
            $table->timestamps();
        });
        Schema::create('personal_access_tokens', function (
            Blueprint $table,
        ): void {
            $table->bigIncrements('id');
            $table->unsignedInteger('tokenable_id');
            $table->string('tokenable_type');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->index(['tokenable_type', 'tokenable_id']);
        });
        Schema::create('workspaces', function (Blueprint $table): void {
            $table->id();
            $table->unsignedInteger('owner_id');
            $table->string('name');
            $table->boolean('is_personal')->default(false);
            $table->timestamps();
        });
        Schema::create('products', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid');
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('feature_list')->nullable();
            $table->integer('position')->default(0);
            $table->boolean('recommended')->default(false);
            $table->boolean('free')->default(false);
            $table->boolean('hidden')->default(false);
            $table->integer('trial_period_days')->default(0);
            $table->timestamps();
        });
        Schema::create('prices', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->decimal('amount', 12, 2);
            $table->string('currency');
            $table->string('interval');
            $table->integer('interval_count')->default(1);
            $table->boolean('default')->default(false);
            $table->boolean('active')->default(true);
            $table->string('stripe_id')->nullable();
            $table->string('paypal_id')->nullable();
            $table->timestamps();
        });
        Schema::create('subscriptions', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('user_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('price_id');
            $table->string('gateway_name');
            $table->string('gateway_id');
            $table->string('gateway_status')->nullable();
            $table->string('checkout_reference')->nullable();
            $table->integer('quantity')->default(1);
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('renews_at')->nullable();
            $table->timestamps();
        });
        $this->createHostingSchema();
        $this->createSupportSchema();
    }

    private function createHostingSchema(): void
    {
        Schema::create('hosting_plans', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('product_id')->unique();
            $table->string('type');
            $table->integer('max_accounts_per_workspace')->default(1);
            $table->json('quotas')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
        Schema::create('hosting_provider_packages', function (
            Blueprint $table,
        ): void {
            $table->id();
            $table->unsignedBigInteger('hosting_plan_id');
            $table->string('provider');
            $table->string('remote_package');
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['hosting_plan_id', 'provider']);
        });
        Schema::create('hosting_zones', function (Blueprint $table): void {
            $table->id();
            $table->string('domain')->unique();
            $table->boolean('is_default');
            $table->boolean('is_active');
            $table->timestamps();
        });
        Schema::create('hosting_premium_subdomains', function (
            Blueprint $table,
        ): void {
            $table->id();
            $table->unsignedBigInteger('hosting_zone_id');
            $table->string('label', 4);
            $table->unsignedBigInteger('annual_price_id')->nullable();
            $table->unsignedInteger('assigned_user_id')->nullable();
            $table->unsignedInteger('subscription_id')->nullable()->unique();
            $table->timestamp('complimentary_until')->nullable();
            $table->unsignedInteger('reserved_user_id')->nullable();
            $table->timestamp('reservation_expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['hosting_zone_id', 'label']);
        });
        Schema::create('hosting_premium_subdomain_purchases', function (
            Blueprint $table,
        ): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('premium_subdomain_id');
            $table->unsignedInteger('user_id');
            $table->unsignedBigInteger('price_id');
            $table->unsignedInteger('subscription_id')->nullable()->unique();
            $table->string('status', 32)->default('pending');
            $table->string('gateway', 16)->nullable();
            $table->string('gateway_subscription_id', 191)->nullable();
            $table->string('failure_code', 64)->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();
            $table->unique(['gateway', 'gateway_subscription_id']);
        });
        Schema::create('hosting_orders', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('workspace_id');
            $table->unsignedInteger('user_id');
            $table->unsignedBigInteger('hosting_plan_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('price_id')->nullable();
            $table->unsignedInteger('subscription_id')->nullable()->unique();
            $table->unsignedBigInteger('hosting_zone_id');
            $table->unsignedBigInteger('premium_subdomain_id')->nullable();
            $table->string('subdomain');
            $table->string('fqdn');
            $table->string('domain_reservation_key')->nullable()->unique();
            $table->string('idempotency_key')->unique();
            $table->string('request_fingerprint', 64)->nullable();
            $table->string('status');
            $table->string('failure_code')->nullable();
            $table->text('safe_failure_message')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('fulfilled_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
        Schema::create('hosting_accounts', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('hosting_order_id')->unique();
            $table->unsignedBigInteger('workspace_id');
            $table->unsignedInteger('user_id');
            $table->unsignedBigInteger('hosting_plan_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('price_id')->nullable();
            $table->unsignedInteger('subscription_id')->nullable()->unique();
            $table->unsignedBigInteger('hosting_zone_id');
            $table->unsignedBigInteger('premium_subdomain_id')->nullable();
            $table->string('provider');
            $table->string('provider_account_id')->nullable();
            $table->string('username')->nullable();
            $table->string('fqdn');
            $table->string('active_domain')->nullable()->unique();
            $table->integer('free_slot')->nullable();
            $table->string('status');
            $table->string('desired_status')->nullable();
            $table->text('control_panel_url')->nullable();
            $table->text('webftp_url')->nullable();
            $table->text('installer_url')->nullable();
            $table->string('ftp_host')->nullable();
            $table->string('sql_host')->nullable();
            $table->text('credential_secret')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('suspended_at')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamp('deletion_requested_at')->nullable();
            $table->timestamp('deletes_at')->nullable();
            $table->softDeletes();
            $table->timestamps();
            $table->unique(['workspace_id', 'free_slot']);
        });
        Schema::create('hosting_checkout_attempts', function (
            Blueprint $table,
        ): void {
            $table->id();
            $table->unsignedBigInteger('hosting_order_id');
            $table->unsignedInteger('user_id');
            $table->string('gateway');
            $table->string('gateway_subscription_id');
            $table->unsignedInteger('subscription_id')->nullable()->unique();
            $table->string('status')->default('pending');
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('last_checked_at')->nullable();
            $table->string('failure_code')->nullable();
            $table->timestamps();
            $table->unique(['gateway', 'gateway_subscription_id']);
        });

        Schema::create('hosting_domains', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('hosting_account_id');
            $table->string('domain');
            $table->string('type')->default('custom');
            $table->string('status')->default('pending');
            $table->boolean('is_primary')->default(false);
            $table->string('dns_status')->nullable();
            $table->string('safe_code')->nullable();
            $table->json('dns_instructions')->nullable();
            $table->unsignedSmallInteger('failure_count')->default(0);
            $table->unsignedSmallInteger('reconcile_attempts')->default(0);
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamp('next_check_at')->nullable();
            $table->timestamps();
            $table->unique(['hosting_account_id', 'domain']);
        });
        Schema::create('hosting_provider_operations', function (
            Blueprint $table,
        ): void {
            $table->id();
            $table->uuid('uuid');
            $table->unsignedBigInteger('hosting_order_id')->nullable();
            $table->unsignedBigInteger('hosting_account_id')->nullable();
            $table->string('provider');
            $table->string('operation');
            $table->string('idempotency_key')->unique();
            $table->string('request_fingerprint')->nullable();
            $table->string('status');
            $table->integer('attempt_count')->default(0);
            $table->string('safe_code')->nullable();
            $table->text('safe_message')->nullable();
            $table->timestamp('retry_after')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
        Schema::create('hosting_account_events', function (
            Blueprint $table,
        ): void {
            $table->id();
            $table->unsignedBigInteger('hosting_account_id');
            $table->unsignedInteger('actor_user_id')->nullable();
            $table->string('event');
            $table->string('from_status')->nullable();
            $table->string('to_status')->nullable();
            $table->text('safe_message')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
        Schema::create('hosting_ssl_certificates', function (
            Blueprint $table,
        ): void {
            $table->id();
            $table->unsignedBigInteger('hosting_account_id');
            $table->unsignedBigInteger('workspace_id');
            $table->unsignedInteger('user_id');
            $table->string('domain');
            $table->string('provider')->default('manual');
            $table->string('status');
            $table->string('installation_status')->default('not_started');
            $table->string('renewal_status')->nullable();
            $table->string('validation_method')->default('dns-01');
            $table->json('dns_validation')->nullable();
            $table->json('renewal_dns_validation')->nullable();
            $table->string('remote_order_id')->nullable();
            $table->string('renewal_order_id')->nullable();
            $table->text('safe_message')->nullable();
            $table->text('private_key')->nullable();
            $table->text('csr')->nullable();
            $table->text('certificate')->nullable();
            $table->text('ca_certificate')->nullable();
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('issued_at')->nullable();
            $table->timestamp('installation_attempted_at')->nullable();
            $table->timestamp('installed_at')->nullable();
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamp('renewal_requested_at')->nullable();
            $table->timestamp('renewal_retry_after')->nullable();
            $table->timestamp('last_renewed_at')->nullable();
            $table->timestamp('valid_until')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
            $table->unique(['hosting_account_id', 'domain', 'status']);
        });
        Schema::create('hosting_ssl_operations', function (
            Blueprint $table,
        ): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('hosting_ssl_certificate_id');
            $table->unsignedBigInteger('hosting_account_id');
            $table->string('operation');
            $table->string('idempotency_key')->unique();
            $table->string('status');
            $table->unsignedInteger('attempt_count')->default(0);
            $table->string('safe_code')->nullable();
            $table->text('safe_message')->nullable();
            $table->timestamp('retry_after')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    private function createSupportSchema(): void
    {
        Schema::create('support_tickets', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid');
            $table->unsignedBigInteger('workspace_id');
            $table->unsignedInteger('user_id');
            $table->unsignedBigInteger('hosting_account_id')->nullable();
            $table->string('subject');
            $table->string('type')->default('ticket');
            $table->string('department')->default('technical');
            $table->string('status');
            $table->string('priority');
            $table->timestamp('last_message_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });
        Schema::create('support_ticket_messages', function (
            Blueprint $table,
        ): void {
            $table->id();
            $table->unsignedBigInteger('support_ticket_id');
            $table->unsignedInteger('user_id')->nullable();
            $table->string('author_type');
            $table->text('body');
            $table->boolean('is_internal')->default(false);
            $table->timestamps();
        });
        Schema::create('support_ticket_attachments', function (
            Blueprint $table,
        ): void {
            $table->id();
            $table->unsignedBigInteger('support_ticket_message_id');
            $table->unsignedInteger('user_id')->nullable();
            $table->string('disk')->default('local');
            $table->string('path');
            $table->string('file_name');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size');
            $table->timestamps();
        });
    }
}

final class RecordingHostingDomainProvider implements HostingDomainProvider
{
    public int $addSubdomainCalls = 0;

    public function __construct(
        private readonly ?ProviderResponse $addSubdomainResponse = null,
    ) {}

    public function listDomains(
        string $remoteAccountId,
        string $primaryDomain,
    ): ProviderResponse {
        throw new \LogicException('Unexpected listDomains call.');
    }

    public function checkDomain(
        string $remoteAccountId,
        string $domain,
    ): ProviderResponse {
        throw new \LogicException('Unexpected checkDomain call.');
    }

    public function domainVerificationInstructions(
        string $remoteAccountId,
        string $domain,
    ): ProviderResponse {
        throw new \LogicException(
            'Unexpected domainVerificationInstructions call.',
        );
    }

    public function addCustomDomain(
        PanelAccountCredentialsData $account,
        string $domain,
    ): ProviderResponse {
        throw new \LogicException('Unexpected addCustomDomain call.');
    }

    public function addSubdomain(
        PanelAccountCredentialsData $account,
        string $label,
        string $zone,
    ): ProviderResponse {
        $this->addSubdomainCalls++;

        return $this->addSubdomainResponse ??
            throw new \LogicException('Unexpected addSubdomain call.');
    }

    public function deleteDomain(
        PanelAccountCredentialsData $account,
        string $domain,
        string $type,
    ): ProviderResponse {
        throw new \LogicException('Unexpected deleteDomain call.');
    }
}
