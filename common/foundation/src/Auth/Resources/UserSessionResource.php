<?php

namespace Common\Auth\Resources;

use App\Security\RequestSecurityContext;
use Common\Auth\Models\UserSession;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin UserSession
 */
#[SchemaName('UserSession')]
class UserSessionResource extends JsonResource
{
    public function toArray(Request $request)
    {
        $currentToken = $request->user()?->currentAccessToken();
        $isCurrentDevice = (bool) ($this->resource->session_id
            ? $this->resource->session_id === $request->session()->getId()
            : $currentToken &&
                $this->resource->token === $currentToken->token);

        return [
            'id' => $this->id,
            'country' => $this->country,
            'city' => $this->city,
            'platform' => $this->platform,
            'device' => $this->device,
            'browser' => $this->browser,
            'ip_address' => app(RequestSecurityContext::class)->maskIp(
                $this->ip_address,
            ),
            'is_current_device' => $isCurrentDevice,
            'access_type' => $this->session_id ? 'browser' : 'api_token',
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
