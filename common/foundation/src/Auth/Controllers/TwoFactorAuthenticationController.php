<?php

namespace Common\Auth\Controllers;

use App\Models\User;
use App\Security\CustomerSecurityEventRecorder;
use App\Security\Enums\CustomerSecurityEventType;
use Common\Core\Demo\BlocksFunctionalityOnDemoSite;
use Illuminate\Http\Request;
use Laravel\Fortify\Actions\EnableTwoFactorAuthentication;
use Laravel\Fortify\Actions\DisableTwoFactorAuthentication;
use Laravel\Fortify\Http\Controllers\TwoFactorAuthenticationController as FortifyTwoFactorAuthenticationController;

class TwoFactorAuthenticationController extends
    FortifyTwoFactorAuthenticationController
{
    use BlocksFunctionalityOnDemoSite;

    public function __construct(
        private readonly CustomerSecurityEventRecorder $securityEventRecorder,
    ) {}

    public function store(
        Request $request,
        EnableTwoFactorAuthentication $enable,
    ) {
        $this->blockOnDemoSite();

        $response = parent::store($request, $enable);

        /** @var User $user */
        $user = $request->user();
        $this->securityEventRecorder->record(
            $user,
            CustomerSecurityEventType::TwoFactorEnabled,
            $request,
        );

        return $response;
    }

    public function destroy(
        Request $request,
        DisableTwoFactorAuthentication $disable,
    ) {
        $this->blockOnDemoSite();

        $response = parent::destroy($request, $disable);

        /** @var User $user */
        $user = $request->user();
        $this->securityEventRecorder->record(
            $user,
            CustomerSecurityEventType::TwoFactorDisabled,
            $request,
        );

        return $response;
    }
}
