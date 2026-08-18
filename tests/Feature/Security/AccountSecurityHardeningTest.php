<?php

namespace Tests\Feature\Security;

use App\Models\User;
use Common\Users\Requests\UpdateUserRequest;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class AccountSecurityHardeningTest extends TestCase
{
    public function test_self_service_profile_request_prohibits_security_and_authorization_fields(): void
    {
        $request = $this->updateRequest([
            'name' => 'Cliente HospedFree',
            'email' => 'attacker@example.test',
            'password' => 'short',
            'email_is_verified' => true,
            'roles' => [1],
            'permissions' => [['id' => 1]],
        ]);
        $user = $this->userWithAdminPermission(false);
        $request->setUserResolver(fn() => $user);

        $validator = Validator::make($request->all(), $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertEqualsCanonicalizing(
            [
                'email',
                'password',
                'email_is_verified',
                'roles',
                'permissions',
            ],
            array_keys($validator->errors()->toArray()),
        );
        $this->assertArrayNotHasKey('name', $validator->errors()->toArray());
    }

    public function test_administrator_password_updates_require_a_production_strength_password(): void
    {
        $request = $this->updateRequest(['password' => 'short']);
        $user = $this->userWithAdminPermission(true);
        $request->setUserResolver(fn() => $user);

        $validator = Validator::make($request->all(), $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());
    }

    public function test_sensitive_routes_require_a_browser_session_and_hosting_routes_declare_token_abilities(): void
    {
        $routes = collect(app('router')->getRoutes()->getRoutes());
        $byUri = $routes->keyBy(fn($route) => $route->uri());

        $this->assertContains(
            'session.auth',
            $byUri['api/v1/hosting/accounts/{account}/credentials/reveal']
                ->gatherMiddleware(),
        );
        $this->assertContains(
            'session.auth',
            $byUri['api/v1/hosting/accounts/{account}/password-reset']
                ->gatherMiddleware(),
        );
        $this->assertContains(
            'token.ability:hosting:files',
            $byUri['api/v1/hosting/accounts/{account}/files']
                ->gatherMiddleware(),
        );
        $this->assertContains(
            'token.ability:hosting:domains',
            $byUri['api/v1/hosting/accounts/{account}/domains']
                ->gatherMiddleware(),
        );
        $this->assertContains(
            'session.auth',
            $byUri['api/v1/users/{id}']->gatherMiddleware(),
        );
        $this->assertContains(
            'session.auth',
            $byUri['api/v1/account/email-change']->gatherMiddleware(),
        );
        $this->assertContains(
            'token.ability:hosting:tools',
            $byUri['api/v1/hosting/accounts/{account}/tools/{tool}']
                ->gatherMiddleware(),
        );
        $this->assertContains(
            'session.auth',
            $byUri['api/v1/user-sessions']->gatherMiddleware(),
        );
        $this->assertContains(
            'session.auth',
            $byUri['api/v1/account/communications']->gatherMiddleware(),
        );
        $this->assertContains(
            'session.auth',
            $byUri['api/v1/account/security-events']->gatherMiddleware(),
        );
    }

    private function updateRequest(array $payload): UpdateUserRequest
    {
        $request = UpdateUserRequest::create(
            '/api/v1/users/1',
            'PUT',
            $payload,
        );
        $route = new Route(['PUT'], 'api/v1/users/{id}', fn() => null);
        $route->bind($request);
        $request->setRouteResolver(fn() => $route);

        return $request;
    }

    private function userWithAdminPermission(bool $allowed): User
    {
        $user = $this->getMockBuilder(User::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['hasPermission'])
            ->getMock();
        $user->method('hasPermission')->with('users.update')->willReturn($allowed);

        return $user;
    }
}
