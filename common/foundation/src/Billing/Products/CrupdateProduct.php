<?php

namespace Common\Billing\Products;

use Common\Permissions\Traits\SyncsPermissions;
use Common\Billing\Gateways\Actions\SyncProductOnEnabledGateways;
use Common\Billing\Models\Price;
use Common\Billing\Models\Product;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CrupdateProduct
{
    use SyncsPermissions;

    public function execute(
        array $data,
        Product|null $originalProduct = null,
        $syncProduct = true,
    ): Product {
        $wasPaid = $originalProduct ? !$originalProduct->free : false;

        $product =
            $originalProduct?->load([
                'allPrices' => fn($query) => $query->withCount(
                    'subscriptions',
                ),
            ]) ?:
            app(Product::class)->newModelInstance([
                'uuid' => Str::uuid(),
            ]);

        $prices = Arr::get($data, 'prices') ?? [];
        $existingPrices = $originalProduct
            ? $product->allPrices->where('active', true)->keyBy('id')
            : collect();
        $submittedPriceIds = collect($prices)
            ->filter(fn(array $price) => isset($price['id']))
            ->map(fn(array $price) => (int) $price['id']);

        if (
            $submittedPriceIds->duplicates()->isNotEmpty() ||
            $submittedPriceIds->diff($existingPrices->keys())->isNotEmpty()
        ) {
            throw ValidationException::withMessages([
                'prices' => __(
                    'One or more prices do not belong to this product.',
                ),
            ]);
        }

        $newData = [
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'hidden' => $data['hidden'] ?? false,
            'free' => $data['free'] ?? false,
            'recommended' => $data['recommended'] ?? false,
            'trial_period_days' => $data['trial_period_days'] ?? 0,
            'position' => $data['position'] ?? 0,
            'feature_list' => $data['feature_list'] ?? [],
        ];

        $product = $product->fill($newData);
        $product->save();

        if (
            array_key_exists('permissions', $data) &&
            is_array($data['permissions'])
        ) {
            $this->syncPermissions($product, $data['permissions']);
        }

        // Gateway prices are immutable and subscription history must remain
        // resolvable. Retire them instead of deleting them from the catalog.
        $existingPrices
            ->reject(fn(Price $price) => $submittedPriceIds->contains($price->id))
            ->each(fn(Price $price) => $this->retireOrDelete($price));

        // update existing prices and create new ones
        foreach ($prices as $price) {
            $isExistingPrice = isset($price['id']);
            $pricePayload = [
                'amount' => (float) $price['amount'],
                'interval_count' => (int) $price['interval_count'],
                'interval' => Str::lower($price['interval']),
                'currency' => Str::lower($price['currency']),
                'active' => true,
            ];

            if ($isExistingPrice) {
                /** @var Price|null $existingPrice */
                $existingPrice = $existingPrices->get((int) $price['id']);

                if (!$existingPrice) {
                    throw ValidationException::withMessages([
                        'prices' => __('One or more prices do not belong to this product.'),
                    ]);
                }

                if (!$this->priceChanged($existingPrice, $pricePayload)) {
                    continue;
                }

                if ($this->mustPreserve($existingPrice)) {
                    $existingPrice->update(['active' => false]);
                    $product->allPrices()->create($pricePayload);
                } else {
                    $existingPrice->update($pricePayload);
                }
            } else {
                $product->allPrices()->create($pricePayload);
            }
        }

        $product->unsetRelation('prices')->unsetRelation('allPrices');

        if ($syncProduct && (!$product->free || $wasPaid)) {
            app(SyncProductOnEnabledGateways::class)->execute($product);
        }

        return $product;
    }

    protected function retireOrDelete(Price $price): void
    {
        if ($this->mustPreserve($price)) {
            $price->update(['active' => false]);
        } else {
            $price->delete();
        }
    }

    protected function mustPreserve(Price $price): bool
    {
        return (bool) ($price->stripe_id ||
            $price->paypal_id ||
            $price->subscriptions_count);
    }

    protected function priceChanged(Price $price, array $payload): bool
    {
        return round((float) $price->amount, 2) !==
                round((float) $payload['amount'], 2) ||
            (int) $price->interval_count !==
                (int) $payload['interval_count'] ||
            Str::lower($price->interval) !== $payload['interval'] ||
            Str::lower($price->currency) !== $payload['currency'];
    }
}
