<?php

namespace App\Biolinks\Controllers;

use App\Biolinks\Models\BiolinkBadgeDefinition;
use App\Biolinks\Resources\BiolinkBadgeDefinitionResource;
use App\Biolinks\Resources\BiolinkBadgeGrantResource;
use App\Biolinks\Support\BiolinkAssetCatalog;
use App\Biolinks\Support\BiolinkBadgeService;
use App\Models\User;
use Common\Core\Demo\BlockedOnDemoSite;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** @tags Biolink badges, Admin */
class AdminBiolinkBadgesController extends Controller
{
    public function __construct(private BiolinkBadgeService $badges) {}

    /** @operationId listAdminBiolinkBadges */
    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        return BiolinkBadgeDefinitionResource::collection(
            BiolinkBadgeDefinition::query()
                ->withCount('grants')
                ->orderBy('kind')
                ->orderBy('key')
                ->get(),
        );
    }

    /** @operationId createAdminBiolinkBadge */
    #[BlockedOnDemoSite]
    public function store(Request $request)
    {
        $this->authorizeAdmin($request);
        $data = $this->validatedDefinition($request);

        $badge = BiolinkBadgeDefinition::query()->create($data);

        return new BiolinkBadgeDefinitionResource($badge);
    }

    /** @operationId updateAdminBiolinkBadge */
    #[BlockedOnDemoSite]
    public function update(string $badge, Request $request)
    {
        $this->authorizeAdmin($request);
        $definition = $this->find($badge);
        $definition->update($this->validatedDefinition($request, $definition));

        return new BiolinkBadgeDefinitionResource($definition->refresh());
    }

    /** @operationId deleteAdminBiolinkBadge */
    #[BlockedOnDemoSite]
    public function destroy(string $badge, Request $request)
    {
        $this->authorizeAdmin($request);
        $this->find($badge)->update(['is_active' => false]);

        return response()->noContent();
    }

    /** @operationId grantAdminBiolinkBadge */
    #[BlockedOnDemoSite]
    public function grant(string $badge, Request $request)
    {
        $this->authorizeAdmin($request);
        $data = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'edition_year' => 'nullable|integer|min:2000|max:2100',
        ]);
        $definition = $this->find($badge);
        $user = User::query()->findOrFail($data['user_id']);

        return new BiolinkBadgeGrantResource(
            $this->badges
                ->grant(
                    $user,
                    $definition,
                    'admin',
                    $request->user(),
                    $data['edition_year'] ?? null,
                )
                ->load('badge'),
        );
    }

    /** @operationId revokeAdminBiolinkBadge */
    #[BlockedOnDemoSite]
    public function revoke(string $badge, int $user, Request $request)
    {
        $this->authorizeAdmin($request);
        $definition = $this->find($badge);
        $this->badges->revoke(User::query()->findOrFail($user), $definition);

        return response()->noContent();
    }

    private function find(string $key): BiolinkBadgeDefinition
    {
        return BiolinkBadgeDefinition::query()
            ->where('key', $key)
            ->firstOrFail();
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless(
            $request->user()?->hasPermission('admin') ||
                $request->user()?->hasPermission('badges.manage'),
            403,
        );
    }

    private function validatedDefinition(
        Request $request,
        BiolinkBadgeDefinition|null $existing = null,
    ): array {
        $required = $existing ? 'sometimes' : 'required';

        $data = $request->validate([
            'key' => [
                $required,
                'string',
                'max:80',
                'regex:/^[a-z0-9:_-]+$/',
                Rule::unique('biolink_badge_definitions', 'key')->ignore($existing?->id),
            ],
            'kind' => [$required, Rule::in(['official', 'event'])],
            'category' => 'sometimes|string|max:40|regex:/^[a-z0-9_-]+$/',
            'access_type' => [
                'sometimes',
                Rule::in(['free', 'premium', 'paid', 'award', 'automatic']),
            ],
            'reference' => 'nullable|string|max:120',
            'label_key' => "$required|string|max:160",
            'description_key' => "$required|string|max:160",
            'icon' => 'nullable|string|max:255',
            'color' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'required_feature' => 'nullable|string|max:80',
            'grant_mode' => [$required, Rule::in(['admin', 'claim', 'derived'])],
            'repeat_yearly' => 'sometimes|boolean',
            'show_year' => 'sometimes|boolean',
            'action_url' => 'nullable|url:http,https|max:2048',
            'starts_at' => 'nullable|date',
            'claim_until' => 'nullable|date|after_or_equal:starts_at',
            'is_active' => 'sometimes|boolean',
            'metadata' => 'nullable|array',
            'metadata.edition_year' => 'nullable|integer|min:2000|max:2100',
        ]);

        $errors = [];
        app(BiolinkAssetCatalog::class)->validatePath(
            $errors,
            'icon',
            $data['icon'] ?? null,
            true,
            ['images/svg', 'images/emoji', 'images/3d'],
        );

        if ($errors) {
            throw ValidationException::withMessages($errors);
        }

        if (isset($data['icon'])) {
            $data['icon'] = app(BiolinkAssetCatalog::class)->normalizePath(
                $data['icon'],
                ['images/svg', 'images/emoji', 'images/3d'],
            );
        }

        if (!$existing) {
            $data['category'] ??= 'community';
            $data['access_type'] ??= match ($data['grant_mode'] ?? 'admin') {
                'claim' => 'free',
                'derived' => 'automatic',
                default => 'award',
            };
        }

        return $data;
    }
}
