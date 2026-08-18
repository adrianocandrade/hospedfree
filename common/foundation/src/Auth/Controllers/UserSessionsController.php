<?php

namespace Common\Auth\Controllers;

use App\Models\User;
use App\Security\CustomerSecurityEventRecorder;
use App\Security\Enums\CustomerSecurityEventType;
use Common\Auth\Models\UserSession;
use Common\Auth\Resources\UserSessionResource;
use Common\Core\Demo\BlockedOnDemoSite;
use Common\API\ExcludeRoutesFromPublicDocs;
use Illuminate\Auth\SessionGuard;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;

/**
 * @tags Account
 */
#[ExcludeRoutesFromPublicDocs]
class UserSessionsController extends Controller
{
    public function __construct(
        private readonly CustomerSecurityEventRecorder $securityEventRecorder,
    )
    {
        $this->middleware('auth');
    }

    /**
     * List user's sessions.
     *
     * @operationId listUserSessions
     */
    public function index()
    {
        $sessions = Auth::user()
            ->userSessions()
            ->orderBy('updated_at', 'desc')
            ->limit(15)
            ->get();

        return UserSessionResource::collection($sessions);
    }

    /**
     * Logout other sessions.
     *
     * This will logout all the devices except the current one.
     *
     * @operationId logoutOtherSessions
     */
    #[BlockedOnDemoSite]
    public function LogoutOtherSessions(StatefulGuard $guard, Request $request)
    {
        $data = $request->validate([
            'password' => 'required',
        ]);

        /**
         * @var SessionGuard $guard
         */
        $guard->logoutOtherDevices($data['password']);

        UserSession::where('user_id', $guard->id())
            ->whereNotNull('session_id')
            ->where('session_id', '!=', request()->session()->getId())
            ->delete();

        /** @var User $user */
        $user = $request->user();
        $this->securityEventRecorder->record(
            $user,
            CustomerSecurityEventType::OtherSessionsEnded,
            $request,
        );

        return response()->noContent();
    }
}
