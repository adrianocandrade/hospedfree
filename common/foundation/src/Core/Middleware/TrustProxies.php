<?php

namespace Common\Core\Middleware;

use Illuminate\Http\Middleware\TrustProxies as Middleware;

class TrustProxies extends Middleware
{
    protected $proxies;

    public function __construct()
    {
        $trustedProxies = config('app.trusted_proxies');

        $this->proxies =
            $trustedProxies === '*'
                ? '*'
                : collect(explode(',', (string) $trustedProxies))
                    ->map(fn(string $proxy) => trim($proxy))
                    ->filter()
                    ->values()
                    ->all();

        if ($this->proxies === []) {
            $this->proxies = null;
        }
    }
}
