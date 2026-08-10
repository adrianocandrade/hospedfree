<?php

namespace App\Biolinks\Controllers;

use App\Biolinks\Models\BiolinkBadgeDefinition;
use App\Biolinks\Resources\BiolinkBadgeDefinitionResource;
use App\Biolinks\Resources\BiolinkBadgeGrantResource;
use App\Biolinks\Support\BiolinkBadgeClaimException;
use App\Biolinks\Support\BiolinkBadgeService;
use App\Models\User;
use Common\Workspaces\ActiveWorkspace;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;

/** @tags Biolink badges */
class BiolinkBadgesController extends Controller
{
    public function __construct(private BiolinkBadgeService $badges) {}

    /** @operationId listBiolinkBadgeCatalog */
    public function catalog(Request $request)
    {
        $user = $this->owner($request);

        return BiolinkBadgeDefinitionResource::collection(
            $this->badges->catalog($user),
        );
    }

    /** @operationId listMyBiolinkBadges */
    public function mine(Request $request)
    {
        return BiolinkBadgeGrantResource::collection(
            $this->badges->owned($this->owner($request)),
        );
    }

    /** @operationId claimBiolinkBadge */
    public function claim(string $badge, Request $request)
    {
        try {
            $grant = $this->badges->claim($this->owner($request), $badge);
        } catch (BiolinkBadgeClaimException $exception) {
            throw ValidationException::withMessages([
                'badge' => $exception->reason,
            ])->status($exception->status);
        }

        return new BiolinkBadgeGrantResource($grant->load('badge'));
    }

    private function owner(Request $request): User
    {
        $owner = ActiveWorkspace::get()?->getOwnerUser() ?? $request->user();
        abort_unless($owner instanceof User, 401);

        return $owner;
    }
}
