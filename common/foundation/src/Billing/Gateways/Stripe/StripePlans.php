<?php

namespace Common\Billing\Gateways\Stripe;

use Common\Billing\GatewayException;
use Common\Billing\Gateways\Stripe\FormatsMoney;
use Common\Billing\Models\Price;
use Common\Billing\Models\Product;
use Stripe\Exception\ApiConnectionException;
use Stripe\Exception\ApiErrorException;
use Stripe\Exception\InvalidRequestException;
use Stripe\Exception\RateLimitException;
use Stripe\Price as StripePrice;
use Stripe\Product as StripeProduct;
use Stripe\StripeClient;

class StripePlans
{
    use FormatsMoney;

    public function __construct(protected StripeClient $client) {}

    public function sync(Product $product): bool
    {
        try {
            return $this->syncCatalog($product);
        } catch (GatewayException $e) {
            throw $e;
        } catch (ApiErrorException $e) {
            throw new GatewayException(
                __('Could not synchronize the Stripe catalog. Please try again.'),
                'stripe_catalog_sync_failed',
                $this->isRetryable($e),
            );
        }
    }

    protected function syncCatalog(Product $product): bool
    {
        $product->load(['prices', 'allPrices']);

        $stripeProduct = $this->retrieveProduct($product->uuid);

        if (!$stripeProduct) {
            $this->client->products->create([
                'id' => $product->uuid,
                'name' => $product->name,
                'metadata' => [
                    'local_product_id' => (string) $product->id,
                ],
            ], [
                'idempotency_key' => $this->idempotencyKey(
                    'product-create',
                    $product->uuid,
                ),
            ]);
        } else {
            $this->syncProductDetails($product, $stripeProduct);
        }

        // Stripe prices are immutable. A changed local amount/currency/interval
        // is represented by a new local row and therefore a new Stripe price.
        $product->prices->each(function (Price $price) use ($product) {
            if (!$price->stripe_id) {
                $this->createPrice($product, $price);
                return;
            }

            $stripePrice = $this->retrievePrice($price->stripe_id);

            if (!$stripePrice) {
                $this->createPrice($product, $price);
            } elseif (
                !$this->priceCanBeLinked($product, $price, $stripePrice)
            ) {
                throw new GatewayException(
                    __('A Stripe price differs from the local catalog and requires review.'),
                    'stripe_price_mismatch',
                    false,
                );
            }
        });

        // Archiving a price prevents new checkouts while existing Stripe
        // subscriptions continue referencing their historical price safely.
        $product->allPrices
            ->where('active', false)
            ->filter(fn(Price $price) => (bool) $price->stripe_id)
            ->each(fn(Price $price) => $this->archivePrice($price));

        return true;
    }

    public function createPrice(Product $product, Price $price): StripePrice
    {
        $lookupKey = $this->priceLookupKey($product, $price);
        $existingPrice = $this->findPriceByLookupKey($lookupKey);

        if ($existingPrice) {
            if (!$this->priceCanBeLinked($product, $price, $existingPrice)) {
                throw new GatewayException(
                    __('A Stripe price differs from the local catalog and requires review.'),
                    'stripe_price_mismatch',
                    false,
                );
            }

            $price->fill(['stripe_id' => $existingPrice->id])->save();

            return $existingPrice;
        }

        $stripePrice = $this->client->prices->create([
            'product' => $product->uuid,
            'unit_amount' => $this->priceToCents($price),
            'currency' => $price->currency,
            'lookup_key' => $lookupKey,
            'recurring' => [
                'interval' => $price->interval,
                'interval_count' => $price->interval_count,
            ],
            'metadata' => [
                'local_product_id' => (string) $product->id,
                'local_price_id' => (string) $price->id,
            ],
        ], [
            'idempotency_key' => $this->idempotencyKey(
                'price-create',
                "{$product->uuid}:{$price->id}",
            ),
        ]);

        $price->fill(['stripe_id' => $stripePrice->id])->save();

        return $stripePrice;
    }

    public function delete(Product $product): bool
    {
        // stripe does not allow deleting product if it has prices attached,
        // and prices can't be deleted via API, we archive the product instead
        try {
            $this->client->products->update($product->uuid, [
                'active' => false,
            ]);
        } catch (InvalidRequestException $e) {
            // if this product is already deleted on stripe, ignore
            if ($e->getStripeCode() !== 'resource_missing') {
                throw $this->safeGatewayException($e);
            }
        } catch (ApiErrorException $e) {
            throw $this->safeGatewayException($e);
        }
        return true;
    }

    public function getAll(): array
    {
        try {
            return $this->client->products->all()->toArray();
        } catch (ApiErrorException $e) {
            throw $this->safeGatewayException($e);
        }
    }

    protected function retrieveProduct(string $stripeProductId): ?StripeProduct
    {
        try {
            return $this->client->products->retrieve($stripeProductId);
        } catch (InvalidRequestException $e) {
            if ($e->getStripeCode() === 'resource_missing') {
                return null;
            }

            throw $e;
        }
    }

    protected function retrievePrice(string $stripePriceId): ?StripePrice
    {
        try {
            return $this->client->prices->retrieve($stripePriceId);
        } catch (InvalidRequestException $e) {
            if ($e->getStripeCode() === 'resource_missing') {
                return null;
            }

            throw $e;
        }
    }

    protected function findPriceByLookupKey(string $lookupKey): ?StripePrice
    {
        $prices = $this->client->prices->all([
            'lookup_keys' => [$lookupKey],
            'limit' => 1,
        ]);

        return $prices->data[0] ?? null;
    }

    protected function syncProductDetails(
        Product $product,
        StripeProduct $stripeProduct,
    ): void {
        $changes = [];

        if ($stripeProduct->name !== $product->name) {
            $changes['name'] = $product->name;
        }
        if ($stripeProduct->active === false) {
            $changes['active'] = true;
        }
        if (
            ($stripeProduct->metadata['local_product_id'] ?? null) !==
            (string) $product->id
        ) {
            $changes['metadata'] = [
                'local_product_id' => (string) $product->id,
            ];
        }

        if ($changes) {
            $this->client->products->update(
                $product->uuid,
                $changes,
                [
                    'idempotency_key' => $this->idempotencyKey(
                        'product-update',
                        $product->uuid . ':' . hash(
                            'sha256',
                            json_encode($changes, JSON_THROW_ON_ERROR),
                        ),
                    ),
                ],
            );
        }
    }

    protected function archivePrice(Price $price): void
    {
        try {
            $this->client->prices->update(
                $price->stripe_id,
                ['active' => false],
                [
                    'idempotency_key' => $this->idempotencyKey(
                        'price-archive',
                        "{$price->id}:{$price->stripe_id}",
                    ),
                ],
            );
        } catch (InvalidRequestException $e) {
            if ($e->getStripeCode() !== 'resource_missing') {
                throw $e;
            }
        }
    }

    protected function priceMatches(
        Price $price,
        StripePrice $stripePrice,
    ): bool {
        $recurring = $stripePrice->recurring;

        return (int) $stripePrice->unit_amount ===
                (int) $this->priceToCents($price) &&
            strtolower((string) $stripePrice->currency) ===
                strtolower($price->currency) &&
            ($recurring['interval'] ?? null) === $price->interval &&
            (int) ($recurring['interval_count'] ?? 0) ===
                $price->interval_count;
    }

    protected function priceCanBeLinked(
        Product $product,
        Price $price,
        StripePrice $stripePrice,
    ): bool {
        return $stripePrice->active !== false &&
            (string) $stripePrice->product === (string) $product->uuid &&
            $this->priceMatches($price, $stripePrice);
    }

    protected function priceLookupKey(Product $product, Price $price): string
    {
        $productKey = substr(hash('sha256', (string) $product->uuid), 0, 16);

        return "hospedfree_price_{$price->id}_{$productKey}";
    }

    protected function idempotencyKey(string $operation, string $identity): string
    {
        return "hospedfree-{$operation}-" . hash('sha256', $identity);
    }

    protected function isRetryable(ApiErrorException $e): bool
    {
        $status = $e->getHttpStatus();

        return $e instanceof ApiConnectionException ||
            $e instanceof RateLimitException ||
            $status === null ||
            $status >= 500;
    }

    protected function safeGatewayException(
        ApiErrorException $e,
    ): GatewayException {
        return new GatewayException(
            __('Could not synchronize the Stripe catalog. Please try again.'),
            'stripe_catalog_sync_failed',
            $this->isRetryable($e),
        );
    }
}
