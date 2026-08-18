<?php

namespace Common\Auth\Controllers;

use App\Models\User;
use App\Security\CustomerSecurityEventRecorder;
use App\Security\Enums\CustomerSecurityEventType;
use Illuminate\Support\Facades\Auth;
use Common\API\ExcludeRoutesFromPublicDocs;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;

/**
 * @tags Account
 */
#[ExcludeRoutesFromPublicDocs]
class AccessTokenController extends Controller
{
    private const ALLOWED_ABILITIES = [
        'hosting:read',
        'hosting:write',
        'hosting:domains',
        'hosting:files',
        'hosting:databases',
        'hosting:ssl',
        'hosting:tools',
        'support:read',
        'support:write',
    ];

    public function __construct(
        private readonly CustomerSecurityEventRecorder $securityEventRecorder,
    )
    {
        $this->middleware(['auth']);
    }

    /**
     * Create access token.
     *
     * @operationId createAccessToken
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'tokenName' => 'required|string|min:3|max:100',
            'abilities' => 'required|array|min:1|max:9',
            'abilities.*' => ['required', 'string', Rule::in(self::ALLOWED_ABILITIES)],
            'expiresInDays' => 'required|integer|min:1|max:' .
                (int) config('hospedfree.personal_access_tokens.max_ttl_days', 90),
        ]);

        abort_unless(
            (bool) config('hospedfree.personal_access_tokens.enabled', true),
            404,
        );
        abort_if(
            Auth::user()->tokens()->count() >=
                (int) config('hospedfree.personal_access_tokens.max_active', 10),
            422,
            'The active access token limit has been reached.',
        );

        $token = Auth::user()->createToken(
            $data['tokenName'],
            array_values(array_unique($data['abilities'])),
            now()->addDays($data['expiresInDays']),
        );

        /** @var User $user */
        $user = Auth::user();
        $this->securityEventRecorder->record(
            $user,
            CustomerSecurityEventType::AccessTokenCreated,
            $request,
        );

        return response()->json([
            'token' => $token->accessToken,
            'plainTextToken' => $token->plainTextToken,
        ]);
    }

    /**
     * Delete access token.
     *
     * @operationId deleteAccessToken
     */
    public function destroy(Request $request, int $tokenId)
    {
        /** @var User $user */
        $user = Auth::user();
        $deleted = $user->tokens()->where('id', $tokenId)->delete();

        if ($deleted) {
            $this->securityEventRecorder->record(
                $user,
                CustomerSecurityEventType::AccessTokenRevoked,
                $request,
            );
        }

        return response()->noContent();
    }
}
