<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_application_boots(): void
    {
        $response = $this->get('/up');

        $response->assertStatus(200);
    }
}
