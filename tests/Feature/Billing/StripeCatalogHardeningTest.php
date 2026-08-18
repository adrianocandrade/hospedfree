<?php

namespace Tests\Feature\Billing;

use Common\Billing\GatewayException;
use Common\Billing\Gateways\Stripe\StripePlans;
use Common\Billing\Models\Price;
use Common\Billing\Models\Product;
use Common\Billing\Products\CrupdateProduct;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Stripe\Exception\ApiConnectionException;
use Stripe\Exception\InvalidRequestException;
use Stripe\Collection as StripeCollection;
use Stripe\Price as StripePrice;
use Stripe\Product as StripeProduct;
use Stripe\StripeClient;
use Tests\TestCase;

class StripeCatalogHardeningTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');
        DB::reconnect('sqlite');

        $this->createSchema();
    }

    public function test_synced_price_change_creates_a_new_catalog_version(): void
    {
        $product = $this->createProduct();
        $oldPrice = $this->createPrice($product, [
            'amount' => 9.9,
            'stripe_id' => 'price_existing',
        ]);

        (new CrupdateProduct())->execute(
            $this->productPayload($product, [[
                'id' => $oldPrice->id,
                'amount' => 12.9,
                'currency' => 'BRL',
                'interval' => 'MONTH',
                'interval_count' => 1,
            ]]),
            $product,
            false,
        );

        $this->assertDatabaseHas('prices', [
            'id' => $oldPrice->id,
            'amount' => 9.9,
            'stripe_id' => 'price_existing',
            'active' => false,
        ]);
        $this->assertDatabaseHas('prices', [
            'product_id' => $product->id,
            'amount' => 12.9,
            'currency' => 'brl',
            'interval' => 'month',
            'stripe_id' => null,
            'active' => true,
        ]);
        $this->assertCount(1, $product->fresh()->prices);
        $this->assertCount(2, $product->fresh()->allPrices);
    }

    public function test_removed_subscribed_price_is_retired_without_breaking_history(): void
    {
        $product = $this->createProduct();
        $price = $this->createPrice($product);
        DB::table('subscriptions')->insert(['price_id' => $price->id]);

        (new CrupdateProduct())->execute(
            $this->productPayload($product, []),
            $product,
            false,
        );

        $this->assertDatabaseHas('prices', [
            'id' => $price->id,
            'active' => false,
        ]);
        $this->assertDatabaseHas('subscriptions', ['price_id' => $price->id]);
        $this->assertCount(0, $product->fresh()->prices);
    }

    public function test_foreign_price_id_is_rejected_before_product_or_catalog_mutation(): void
    {
        $product = $this->createProduct(['name' => 'Original']);
        $ownPrice = $this->createPrice($product);
        $otherProduct = $this->createProduct();
        $foreignPrice = $this->createPrice($otherProduct);
        $payload = $this->productPayload($product, [[
            'id' => $foreignPrice->id,
            'amount' => 12.9,
            'currency' => 'brl',
            'interval' => 'month',
            'interval_count' => 1,
        ]]);
        $payload['name'] = 'Should not persist';

        try {
            (new CrupdateProduct())->execute($payload, $product, false);
            $this->fail('A foreign price ID should be rejected.');
        } catch (ValidationException) {
            // Expected: validation happens before any local mutation.
        }

        $this->assertSame('Original', $product->fresh()->name);
        $this->assertDatabaseHas('prices', [
            'id' => $ownPrice->id,
            'active' => true,
        ]);
    }

    public function test_stripe_sync_updates_product_and_archives_retired_price(): void
    {
        $product = $this->createProduct(['name' => 'Hospedagem Pro']);
        $activePrice = $this->createPrice($product, [
            'stripe_id' => 'price_active',
        ]);
        $retiredPrice = $this->createPrice($product, [
            'stripe_id' => 'price_retired',
            'active' => false,
        ]);
        $client = new FakeStripeClient();
        $client->products->items[$product->uuid] = StripeProduct::constructFrom([
            'id' => $product->uuid,
            'name' => 'Nome antigo',
            'active' => true,
            'metadata' => [],
        ]);
        $client->prices->items['price_active'] = $this->remotePrice(
            $product,
            $activePrice,
            'price_active',
        );
        $client->prices->items['price_retired'] = $this->remotePrice(
            $product,
            $retiredPrice,
            'price_retired',
        );

        $this->assertTrue((new StripePlans($client))->sync($product));

        $this->assertSame(
            'Hospedagem Pro',
            $client->products->updateCalls[0]['params']['name'],
        );
        $this->assertSame(
            (string) $product->id,
            $client->products->updateCalls[0]['params']['metadata']['local_product_id'],
        );
        $archiveCall = collect($client->prices->updateCalls)->firstWhere(
            'id',
            'price_retired',
        );
        $this->assertFalse($archiveCall['params']['active']);
        $this->assertStringStartsWith(
            'hospedfree-price-archive-',
            $archiveCall['options']['idempotency_key'],
        );
        $this->assertSame('price_active', $activePrice->fresh()->stripe_id);
    }

    public function test_price_creation_retry_uses_same_idempotency_key(): void
    {
        $product = $this->createProduct();
        $price = $this->createPrice($product);
        $client = new FakeStripeClient();
        $client->products->items[$product->uuid] = StripeProduct::constructFrom([
            'id' => $product->uuid,
            'name' => $product->name,
            'active' => true,
            'metadata' => ['local_product_id' => (string) $product->id],
        ]);
        $client->prices->failAfterPersistOnce = true;
        $client->prices->lookupVisibilityDelay = 2;

        try {
            (new StripePlans($client))->sync($product);
            $this->fail('The simulated connection failure was not raised.');
        } catch (GatewayException $e) {
            $this->assertSame('stripe_catalog_sync_failed', $e->safeCode);
            $this->assertTrue($e->retryable);
            $this->assertStringNotContainsString('sensitive', strtolower($e->getMessage()));
        }

        $this->assertTrue((new StripePlans($client))->sync($product));
        $this->assertCount(2, $client->prices->createCalls);
        $this->assertSame(
            $client->prices->createCalls[0]['options']['idempotency_key'],
            $client->prices->createCalls[1]['options']['idempotency_key'],
        );
        $this->assertSame(
            (string) $price->id,
            $client->prices->createCalls[0]['params']['metadata']['local_price_id'],
        );
        $this->assertStringStartsWith(
            'hospedfree_price_',
            $client->prices->createCalls[0]['params']['lookup_key'],
        );
        $this->assertSame('price_generated_1', $price->fresh()->stripe_id);
        $this->assertCount(1, $client->prices->items);
    }

    public function test_existing_stripe_price_from_another_product_is_rejected(): void
    {
        $product = $this->createProduct();
        $price = $this->createPrice($product, [
            'stripe_id' => 'price_wrong_product',
        ]);
        $client = new FakeStripeClient();
        $client->products->items[$product->uuid] = StripeProduct::constructFrom([
            'id' => $product->uuid,
            'name' => $product->name,
            'active' => true,
            'metadata' => ['local_product_id' => (string) $product->id],
        ]);
        $client->prices->items['price_wrong_product'] =
            StripePrice::constructFrom([
                'id' => 'price_wrong_product',
                'product' => 'another-product',
                'unit_amount' => (int) round($price->amount * 100),
                'currency' => $price->currency,
                'active' => true,
                'recurring' => [
                    'interval' => $price->interval,
                    'interval_count' => $price->interval_count,
                ],
            ]);

        try {
            (new StripePlans($client))->sync($product);
            $this->fail('A Stripe price from another product should be rejected.');
        } catch (GatewayException $e) {
            $this->assertSame('stripe_price_mismatch', $e->safeCode);
            $this->assertFalse($e->retryable);
        }

        $this->assertCount(0, $client->prices->createCalls);
    }

    public function test_lookup_key_recovers_price_after_remote_creation_without_local_save(): void
    {
        $product = $this->createProduct();
        $price = $this->createPrice($product);
        $client = new FakeStripeClient();
        $client->products->items[$product->uuid] = StripeProduct::constructFrom([
            'id' => $product->uuid,
            'name' => $product->name,
            'active' => true,
            'metadata' => ['local_product_id' => (string) $product->id],
        ]);
        $client->prices->failAfterPersistOnce = true;

        try {
            (new StripePlans($client))->sync($product);
        } catch (GatewayException) {
            // Simulates a timeout after Stripe persisted the price.
        }

        $this->assertTrue((new StripePlans($client))->sync($product));
        $this->assertCount(1, $client->prices->createCalls);
        $this->assertSame('price_generated_1', $price->fresh()->stripe_id);
    }

    public function test_connection_error_is_not_treated_as_a_missing_product(): void
    {
        $product = $this->createProduct();
        $this->createPrice($product);
        $client = new FakeStripeClient();
        $client->products->retrieveFailure = ApiConnectionException::factory(
            'Sensitive upstream details',
        );

        try {
            (new StripePlans($client))->sync($product);
            $this->fail('The simulated connection failure was not raised.');
        } catch (GatewayException $e) {
            $this->assertSame('stripe_catalog_sync_failed', $e->safeCode);
            $this->assertTrue($e->retryable);
            $this->assertStringNotContainsString('Sensitive', $e->getMessage());
        }

        $this->assertCount(0, $client->products->createCalls);
    }

    public function test_invalid_request_is_not_treated_as_a_missing_product(): void
    {
        $product = $this->createProduct();
        $this->createPrice($product);
        $client = new FakeStripeClient();
        $client->products->retrieveFailure = InvalidRequestException::factory(
            'Sensitive invalid request details',
            400,
            null,
            null,
            null,
            'parameter_invalid',
        );

        try {
            (new StripePlans($client))->sync($product);
            $this->fail('The simulated invalid request was not raised.');
        } catch (GatewayException $e) {
            $this->assertSame('stripe_catalog_sync_failed', $e->safeCode);
            $this->assertFalse($e->retryable);
            $this->assertStringNotContainsString('Sensitive', $e->getMessage());
        }

        $this->assertCount(0, $client->products->createCalls);
    }

    public function test_missing_product_is_created_with_safe_metadata_and_idempotency(): void
    {
        $product = $this->createProduct();
        $this->createPrice($product);
        $client = new FakeStripeClient();

        $this->assertTrue((new StripePlans($client))->sync($product));

        $call = $client->products->createCalls[0];
        $this->assertSame(
            (string) $product->id,
            $call['params']['metadata']['local_product_id'],
        );
        $this->assertStringStartsWith(
            'hospedfree-product-create-',
            $call['options']['idempotency_key'],
        );
    }

    protected function createProduct(array $attributes = []): Product
    {
        return Product::query()->create(array_merge([
            'uuid' => 'product-' . uniqid(),
            'name' => 'Hospedagem Pro',
            'description' => null,
            'feature_list' => [],
            'position' => 0,
            'recommended' => false,
            'free' => false,
            'hidden' => false,
            'trial_period_days' => 0,
        ], $attributes));
    }

    protected function createPrice(
        Product $product,
        array $attributes = [],
    ): Price {
        return $product->allPrices()->create(array_merge([
            'amount' => 9.9,
            'currency' => 'brl',
            'interval' => 'month',
            'interval_count' => 1,
            'default' => false,
            'active' => true,
            'stripe_id' => null,
            'paypal_id' => null,
        ], $attributes));
    }

    protected function productPayload(Product $product, array $prices): array
    {
        return [
            'name' => $product->name,
            'description' => $product->description,
            'hidden' => $product->hidden,
            'free' => $product->free,
            'recommended' => $product->recommended,
            'trial_period_days' => $product->trial_period_days,
            'position' => $product->position,
            'feature_list' => $product->feature_list,
            'prices' => $prices,
        ];
    }

    protected function remotePrice(
        Product $product,
        Price $price,
        string $id,
    ): StripePrice
    {
        return StripePrice::constructFrom([
            'id' => $id,
            'product' => $product->uuid,
            'unit_amount' => (int) round($price->amount * 100),
            'currency' => $price->currency,
            'active' => true,
            'recurring' => [
                'interval' => $price->interval,
                'interval_count' => $price->interval_count,
            ],
        ]);
    }

    protected function createSchema(): void
    {
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
            $table->decimal('amount', 13, 2);
            $table->string('currency');
            $table->string('interval')->default('month');
            $table->integer('interval_count')->default(1);
            $table->string('stripe_id', 50)->nullable();
            $table->string('paypal_id', 50)->nullable();
            $table->boolean('default')->default(false);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
        Schema::create('subscriptions', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('price_id');
        });
    }
}

class FakeStripeClient extends StripeClient
{
    public FakeStripeProductService $products;
    public FakeStripePriceService $prices;

    public function __construct()
    {
        $this->products = new FakeStripeProductService();
        $this->prices = new FakeStripePriceService();
    }
}

class FakeStripeProductService
{
    /** @var array<string, StripeProduct> */
    public array $items = [];
    public array $createCalls = [];
    public array $updateCalls = [];
    public ?\Throwable $retrieveFailure = null;

    public function retrieve(string $id): StripeProduct
    {
        if ($this->retrieveFailure) {
            throw $this->retrieveFailure;
        }
        if (!isset($this->items[$id])) {
            throw InvalidRequestException::factory(
                'Missing product',
                404,
                null,
                null,
                null,
                'resource_missing',
            );
        }

        return $this->items[$id];
    }

    public function create(array $params, array $options = []): StripeProduct
    {
        $this->createCalls[] = compact('params', 'options');
        $product = StripeProduct::constructFrom(array_merge([
            'active' => true,
        ], $params));
        $this->items[$params['id']] = $product;

        return $product;
    }

    public function update(
        string $id,
        array $params,
        array $options = [],
    ): StripeProduct {
        $this->updateCalls[] = compact('id', 'params', 'options');
        $product = StripeProduct::constructFrom(array_merge(
            $this->items[$id]->toArray(),
            $params,
        ));
        $this->items[$id] = $product;

        return $product;
    }
}

class FakeStripePriceService
{
    /** @var array<string, StripePrice> */
    public array $items = [];
    /** @var array<string, StripePrice> */
    public array $idempotentResults = [];
    public array $createCalls = [];
    public array $updateCalls = [];
    public bool $failAfterPersistOnce = false;
    public int $lookupVisibilityDelay = 0;
    public int $lookupCalls = 0;

    public function retrieve(string $id): StripePrice
    {
        if (!isset($this->items[$id])) {
            throw InvalidRequestException::factory(
                'Missing price',
                404,
                null,
                null,
                null,
                'resource_missing',
            );
        }

        return $this->items[$id];
    }

    public function create(array $params, array $options = []): StripePrice
    {
        $this->createCalls[] = compact('params', 'options');
        $key = $options['idempotency_key'];

        if (isset($this->idempotentResults[$key])) {
            return $this->idempotentResults[$key];
        }

        $id = 'price_generated_' . (count($this->items) + 1);
        $price = StripePrice::constructFrom(array_merge($params, [
            'id' => $id,
            'active' => true,
        ]));
        $this->items[$id] = $price;
        $this->idempotentResults[$key] = $price;

        if ($this->failAfterPersistOnce) {
            $this->failAfterPersistOnce = false;
            throw ApiConnectionException::factory(
                'Sensitive connection failure',
            );
        }

        return $price;
    }

    public function all(array $params = []): StripeCollection
    {
        $this->lookupCalls++;
        if ($this->lookupCalls <= $this->lookupVisibilityDelay) {
            return StripeCollection::constructFrom(['data' => []]);
        }

        $lookupKey = $params['lookup_keys'][0] ?? null;
        $matches = array_values(array_filter(
            $this->items,
            fn(StripePrice $price) => $price->lookup_key === $lookupKey,
        ));

        return StripeCollection::constructFrom(['data' => $matches]);
    }

    public function update(
        string $id,
        array $params,
        array $options = [],
    ): StripePrice {
        $this->updateCalls[] = compact('id', 'params', 'options');

        if (!isset($this->items[$id])) {
            throw InvalidRequestException::factory(
                'Missing price',
                404,
                null,
                null,
                null,
                'resource_missing',
            );
        }

        $price = StripePrice::constructFrom(array_merge(
            $this->items[$id]->toArray(),
            $params,
        ));
        $this->items[$id] = $price;

        return $price;
    }
}
