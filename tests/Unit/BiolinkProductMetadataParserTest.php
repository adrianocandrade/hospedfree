<?php

namespace Tests\Unit;

use App\Biolinks\Support\BiolinkProductMetadataParser;
use Tests\TestCase;

class BiolinkProductMetadataParserTest extends TestCase
{
    private BiolinkProductMetadataParser $parser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->parser = new BiolinkProductMetadataParser();
    }

    public function test_it_extracts_product_offer_rating_and_explicit_previous_price(): void
    {
        $html = <<<'HTML'
        <!doctype html>
        <html><head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Capacete Adventure",
          "description": "<strong>Seguro</strong> para a estrada",
          "image": ["https://cdn.example.com/capacete.jpg"],
          "aggregateRating": {"@type": "AggregateRating", "ratingValue": 8, "bestRating": 10},
          "offers": {
            "@type": "Offer",
            "price": "899.90",
            "priceCurrency": "BRL",
            "availability": "https://schema.org/InStock",
            "priceSpecification": [
              {"@type": "UnitPriceSpecification", "price": "899.90"},
              {"@type": "UnitPriceSpecification", "price": "1099.90", "priceType": "https://schema.org/ListPrice"}
            ]
          }
        }
        </script>
        </head></html>
        HTML;

        $result = $this->parser->parse(
            $html,
            'https://loja.example.com/produto/capacete',
        );

        $this->assertSame('Capacete Adventure', $result['product']['name']);
        $this->assertSame(
            'Seguro para a estrada',
            $result['product']['description'],
        );
        $this->assertSame(
            'https://cdn.example.com/capacete.jpg',
            $result['product']['image'],
        );
        $this->assertSame(899.9, $result['product']['price']);
        $this->assertSame(1099.9, $result['product']['compare_price']);
        $this->assertSame('BRL', $result['product']['currency']);
        $this->assertSame(4.0, $result['product']['rating']);
        $this->assertSame('In stock', $result['product']['stock_label']);
    }

    public function test_it_reads_graph_product_group_and_never_uses_aggregate_high_price_as_previous_price(): void
    {
        $html = <<<'HTML'
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@graph": [
            {"@type": "Organization", "name": "Example"},
            {
              "@type": "ProductGroup",
              "name": "Camiseta",
              "image": {"@type": "ImageObject", "contentUrl": "/images/camiseta.jpg"},
              "hasVariant": [{
                "@type": "Product",
                "name": "Camiseta azul",
                "offers": {
                  "@type": "AggregateOffer",
                  "lowPrice": "79,90",
                  "highPrice": "149,90",
                  "priceCurrency": "BRL"
                }
              }]
            }
          ]
        }
        </script>
        HTML;

        $result = $this->parser->parse(
            $html,
            'https://shop.example.com/catalog/camiseta',
        );

        $this->assertSame('Camiseta azul', $result['product']['name']);
        $this->assertSame(79.9, $result['product']['price']);
        $this->assertNull($result['product']['compare_price']);
        $this->assertSame(
            'https://shop.example.com/images/camiseta.jpg',
            $result['product']['image'],
        );
    }

    public function test_it_uses_an_offer_with_a_price_from_an_offer_list(): void
    {
        $html = <<<'HTML'
        <script type="application/ld+json">
        {
          "@type": "Product",
          "name": "Mochila",
          "offers": [
            {"@type": "Offer", "availability": "https://schema.org/OutOfStock"},
            {"@type": "Offer", "price": "249.50", "priceCurrency": "BRL", "availability": "https://schema.org/InStock"}
          ]
        }
        </script>
        HTML;

        $result = $this->parser->parse($html, 'https://example.com/mochila');

        $this->assertSame(249.5, $result['product']['price']);
        $this->assertSame('In stock', $result['product']['stock_label']);
    }

    public function test_it_falls_back_to_product_and_open_graph_metadata(): void
    {
        $html = <<<'HTML'
        <!doctype html><html><head>
        <meta property="product:title" content="Câmera de ação">
        <meta property="product:price:amount" content="1.299,90">
        <meta property="product:original_price:amount" content="1.499,90">
        <meta property="product:price:currency" content="brl">
        <meta property="og:description" content="Grave suas aventuras.">
        <meta property="og:image" content="/media/camera.jpg">
        </head></html>
        HTML;

        $result = $this->parser->parse(
            $html,
            'https://store.example.com/products/camera',
        );

        $this->assertSame('Câmera de ação', $result['product']['name']);
        $this->assertSame(1299.9, $result['product']['price']);
        $this->assertSame(1499.9, $result['product']['compare_price']);
        $this->assertSame('BRL', $result['product']['currency']);
        $this->assertSame(
            'https://store.example.com/media/camera.jpg',
            $result['product']['image'],
        );
    }

    public function test_it_rejects_malicious_image_urls_and_handles_malformed_json_ld(): void
    {
        $html = <<<'HTML'
        <html><head>
        <script type="application/ld+json">{"@type":"Product", broken}</script>
        <meta property="og:title" content="Fallback seguro">
        <meta property="og:image" content="http://127.0.0.1/private.jpg">
        </head></html>
        HTML;

        $result = $this->parser->parse($html, 'https://example.com/product');

        $this->assertSame('Fallback seguro', $result['product']['name']);
        $this->assertNull($result['product']['image']);
    }

    public function test_it_classifies_marketplaces_short_links_and_store_engines(): void
    {
        $this->assertSame(
            'mercado_livre',
            $this->parser->detectProvider('https://meli.la/example'),
        );
        $this->assertSame(
            'shopee',
            $this->parser->detectProvider('https://shope.ee/example'),
        );
        $this->assertSame(
            'amazon',
            $this->parser->detectProvider('https://amzn.to/example'),
        );
        $this->assertSame(
            'aliexpress',
            $this->parser->detectProvider(
                'https://s.click.aliexpress.com/e/example',
            ),
        );
        $this->assertSame(
            'shopify',
            $this->parser->detectProvider(
                'https://custom.example.com/product',
                '<script>window.Shopify.theme = {}</script>',
            ),
        );
        $this->assertSame(
            'woocommerce',
            $this->parser->detectProvider(
                'https://custom.example.com/product',
                '<body class="woocommerce"></body>',
            ),
        );
    }
}
