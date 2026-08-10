<?php

namespace Tests\Unit;

use App\Links\Policies\LinkPolicy;
use App\Models\User;
use Common\Settings\Settings;
use Illuminate\Http\Request;
use Tests\TestCase;

class WorkspaceScopePolicyTest extends TestCase
{
    public function test_workspace_all_index_is_denied_without_global_permission(): void
    {
        $request = Request::create('/api/v1/links', 'GET', [
            'workspace_id' => 'all',
        ]);
        app()->instance('request', $request);

        $user = new User(['id' => 10]);
        $user->exists = true;
        $user->setRelation('permissions', collect());

        $policy = new LinkPolicy(app(Request::class), app(Settings::class));

        $this->assertFalse($policy->index($user));
    }
}
