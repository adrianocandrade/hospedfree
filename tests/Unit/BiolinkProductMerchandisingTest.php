<?php

namespace Tests\Unit;

use App\Biolinks\Requests\CrupdateBiolinkProductRequest;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class BiolinkProductMerchandisingTest extends TestCase
{
    public function test_optional_merchandising_fields_accept_valid_values(): void
    {
        $validator = $this->validator([
            'name' => 'Capacete Adventure',
            'image' => 'https://example.com/capacete.webp',
            'price' => 899.9,
            'compare_price' => 1099.9,
            'currency' => 'BRL',
            'badge' => 'Mais vendido',
            'rating' => 4.8,
            'stock_label' => 'Pronta entrega',
            'url' => 'https://example.com/produtos/capacete',
        ]);

        $this->assertTrue($validator->passes(), $validator->errors()->toJson());
    }

    public function test_compare_price_requires_a_lower_current_price(): void
    {
        $validator = $this->validator([
            'name' => 'Capacete Adventure',
            'price' => 899.9,
            'compare_price' => 799.9,
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey(
            'compare_price',
            $validator->errors()->toArray(),
        );
    }

    public function test_rejects_invalid_rating_and_malicious_media_urls(): void
    {
        $validator = $this->validator([
            'name' => 'Capacete Adventure',
            'image' => 'javascript:alert(1)',
            'rating' => 5.1,
            'url' => 'javascript:alert(1)',
        ]);

        $this->assertTrue($validator->fails());
        $errors = $validator->errors()->toArray();
        $this->assertArrayHasKey('image', $errors);
        $this->assertArrayHasKey('rating', $errors);
        $this->assertArrayHasKey('url', $errors);
    }

    private function validator(array $data): \Illuminate\Validation\Validator
    {
        return Validator::make(
            $data,
            (new CrupdateBiolinkProductRequest())->rules(),
        );
    }
}
