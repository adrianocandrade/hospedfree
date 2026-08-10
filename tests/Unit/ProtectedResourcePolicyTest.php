<?php

namespace Tests\Unit;

use App\Biolinks\Models\Biolink;
use App\Biolinks\Policies\BiolinkPolicy;
use App\Folders\Models\Folder;
use App\Folders\Policies\FolderPolicy;
use App\Links\Models\Link;
use App\Links\Policies\LinkPolicy;
use App\Models\User;
use Common\Settings\Settings;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Tests\TestCase;

class ProtectedResourcePolicyTest extends TestCase
{
    public function test_password_protected_link_uses_hash_check(): void
    {
        $this->assertProtectedResourcePassword(
            new LinkPolicy(app(Request::class), app(Settings::class)),
            new Link(),
        );
    }

    public function test_password_protected_folder_uses_hash_check(): void
    {
        $this->assertProtectedResourcePassword(
            new FolderPolicy(app(Request::class), app(Settings::class)),
            new Folder(),
        );
    }

    public function test_password_protected_biolink_uses_hash_check(): void
    {
        $this->assertProtectedResourcePassword(
            new BiolinkPolicy(app(Request::class), app(Settings::class)),
            new Biolink(),
        );
    }

    public function test_invalid_biolink_password_hash_is_denied_without_error(): void
    {
        $policy = new BiolinkPolicy(app(Request::class), app(Settings::class));
        $user = $this->user();
        $resource = new Biolink();
        $resource->setRawAttributes([
            'id' => 100,
            'user_id' => 10,
            'workspace_id' => 1,
            'password' => 'plain-text-password',
        ]);

        $this->setApiRequestPassword('plain-text-password');

        $this->assertFalse($policy->show($user, $resource));
    }

    private function assertProtectedResourcePassword(
        LinkPolicy|FolderPolicy|BiolinkPolicy $policy,
        Link|Folder|Biolink $resource,
    ): void {
        $user = $this->user();

        $resource->forceFill([
            'id' => 100,
            'user_id' => 10,
            'workspace_id' => 1,
            'password' => 'correct-password',
        ]);

        $this->setApiRequestPassword('wrong-password');
        $this->assertFalse($policy->show($user, $resource));

        $this->setApiRequestPassword('correct-password');
        $this->assertTrue($policy->show($user, $resource));
    }

    private function user(): User
    {
        $user = new User(['id' => 10]);
        $user->exists = true;
        $user->setRelation('permissions', collect());

        return $user;
    }

    private function setApiRequestPassword(string $password): void
    {
        $request = Request::create('/api/v1/resource', 'GET', [
            'password' => $password,
        ]);
        $route = new Route('GET', '/api/v1/resource', []);
        $route->computedMiddleware = ['api'];
        $request->setRouteResolver(fn() => $route);

        app()->instance('request', $request);
    }
}
