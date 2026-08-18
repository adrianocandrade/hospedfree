<?php

namespace Tests\Unit;

use App\Hosting\Services\HostingPassword;
use PHPUnit\Framework\TestCase;

class HostingPasswordTest extends TestCase
{
    public function test_it_generates_a_provider_compatible_password(): void
    {
        $password = HostingPassword::generate();

        $this->assertSame(16, strlen($password));
        $this->assertMatchesRegularExpression('/^[A-Za-z0-9]+$/', $password);
        $this->assertMatchesRegularExpression('/[A-Za-z]/', $password);
        $this->assertMatchesRegularExpression('/[0-9]/', $password);
    }
}
