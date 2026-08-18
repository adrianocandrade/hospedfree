<?php

namespace Tests\Feature\Billing;

use App\Models\User;
use Common\Billing\Invoices\Invoice;
use Common\Billing\Models\Product;
use Common\Billing\Notifications\NewInvoiceAvailable;
use Common\Billing\Notifications\PaymentFailed;
use Common\Billing\Subscription;
use Tests\TestCase;

class HospedFreeBillingNotificationsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        app()->setLocale('pt-BR');
        config()->set('app.url', 'https://hospedfree.test');
    }

    public function test_payment_failure_explains_the_safe_free_plan_fallback(): void
    {
        $user = new User(['name' => 'Cliente']);
        $product = new Product(['name' => 'Hospedagem Pro']);
        $subscription = new Subscription();
        $subscription->setRelation('product', $product);

        $mail = (new PaymentFailed($subscription))->toMail($user);
        $content = implode(' ', $mail->introLines);

        $this->assertSame(
            'Não foi possível confirmar o pagamento de Hospedagem Pro',
            $mail->subject,
        );
        $this->assertStringContainsString('plano Free', $content);
        $this->assertStringContainsString('não será apagado automaticamente', $content);
        $this->assertSame('Revisar faturamento', $mail->actionText);
        $this->assertSame('error', $mail->level);
    }

    public function test_invoice_available_uses_a_success_state_and_the_existing_mail_layout(): void
    {
        $user = new User(['name' => 'Cliente']);
        $invoice = new Invoice(['uuid' => 'invoice-test']);

        $mail = (new NewInvoiceAvailable($invoice))->toMail($user);

        $this->assertSame('Seu recibo de pagamento está disponível', $mail->subject);
        $this->assertSame('success', $mail->level);
        $this->assertSame('notifications::email', $mail->markdown);
        $this->assertNull($mail->view);
        $this->assertSame(
            'https://hospedfree.test/billing/invoices/invoice-test',
            $mail->actionUrl,
        );
    }
}
