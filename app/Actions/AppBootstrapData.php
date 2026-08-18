<?php

namespace App\Actions;

use Common\Core\Bootstrap\BaseBootstrapData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AppBootstrapData extends BaseBootstrapData
{
    public function init(): self
    {
        parent::init();
        $this->data['linkeableResponse'] = app(Request::class)->route(
            'linkeableResponse',
        );

        if (Auth::check()) {
            $this->data['biolinks'] = [];
            $this->data['workspaces'] = [];
        }

        $this->data['settings']['unsplash_is_setup'] = config(
            'services.unsplash.access_key',
        );

        return $this;
    }

    protected function getAuthRedirectUri(): string
    {
        $uri = settings('dashboard.homepage', 'hosting');

        if ($uri === 'overview') {
            return '/dashboard';
        }

        return "/dashboard/$uri";
    }
}
