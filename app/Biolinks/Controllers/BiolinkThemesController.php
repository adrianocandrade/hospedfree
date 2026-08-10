<?php

namespace App\Biolinks\Controllers;

use App\Biolinks\Models\BiolinkTheme;
use App\Biolinks\Requests\CrupdateBiolinkThemeRequest;
use App\Biolinks\Resources\BiolinkThemeResource;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * @tags Biolink Themes
 */
class BiolinkThemesController extends Controller
{
    /**
     * List biolink themes.
     *
     * @operationId listBiolinkThemes
     */
    public function index(Request $request)
    {
        $request->merge($this->normalizeBooleanQueryParams($request, [
            'include_unpublished',
            'models_only',
            'starred',
            'mine',
        ]));

        $filters = $request->validate([
            'include_unpublished' => ['nullable', 'boolean'],
            'models_only' => ['nullable', 'boolean'],
            'category' => ['nullable', 'string', 'in:customizable,curated,user,community'],
            'device' => ['nullable', 'string', 'in:mobile,desktop,both'],
            'industry' => ['nullable', 'string'],
            'search' => ['nullable', 'string'],
            'starred' => ['nullable', 'boolean'],
            'mine' => ['nullable', 'boolean'],
        ]);
        $canManage = $request->user()?->hasPermission('settings.update');
        $includeUnpublished =
            $request->boolean('include_unpublished') && $canManage;
        $hasMetadataColumn = Schema::hasColumn('biolink_themes', 'metadata');
        $userId = $request->user()?->id;

        $themes = BiolinkTheme::query()
            ->when(!$includeUnpublished, fn($query) => $query->where('is_published', true))
            ->when(
                isset($filters['category']),
                fn($query) => $query->where('category', $filters['category']),
            )
            ->when(
                isset($filters['industry']) && $hasMetadataColumn,
                fn($query) => $query->where('metadata->industry', $filters['industry']),
            )
            ->when(
                isset($filters['search']),
                fn($query) => $query->where('name', 'like', '%' . $filters['search'] . '%'),
            )
            ->when(
                $request->boolean('mine') && $userId,
                fn($query) => $query->where('created_by', $userId),
            )
            ->when(
                $request->boolean('starred') && $userId,
                fn($query) => $query->whereExists(function ($q) use ($userId) {
                    $q->select(DB::raw(1))
                      ->from('biolink_theme_stars')
                      ->whereColumn('biolink_theme_stars.biolink_theme_id', 'biolink_themes.id')
                      ->where('biolink_theme_stars.user_id', $userId);
                }),
            )
            ->when(
                $request->boolean('models_only') && $hasMetadataColumn,
                fn($query) => $query->where('metadata->isModel', true),
            )
            ->when(
                $request->boolean('models_only') && !$hasMetadataColumn,
                fn($query) => $query->whereRaw('1 = 0'),
            )
            ->when(isset($filters['device']) && $hasMetadataColumn, function ($query) use ($filters) {
                $device = $filters['device'];
                return $query->where(function ($query) use ($device) {
                    $query
                        ->where('metadata->device', $device)
                        ->orWhere('metadata->device', 'both');
                });
            })
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return BiolinkThemeResource::collection($themes);
    }

    /**
     * Create a biolink theme.
     *
     * @operationId createBiolinkTheme
     */
    public function store(CrupdateBiolinkThemeRequest $request)
    {
        $this->authorizeManage($request);

        $data = $this->preparePayload($request->validated());
        $data['created_by'] = $request->user()?->id;
        $data['is_system'] = false;

        $theme = BiolinkTheme::query()->create($data);

        return new BiolinkThemeResource($theme);
    }

    /**
     * Update a biolink theme.
     *
     * @operationId updateBiolinkTheme
     */
    public function update(
        BiolinkTheme $biolinkTheme,
        CrupdateBiolinkThemeRequest $request,
    ) {
        $this->authorizeManage($request, $biolinkTheme);

        $biolinkTheme
            ->fill($this->preparePayload($request->validated(), $biolinkTheme))
            ->save();

        return new BiolinkThemeResource($biolinkTheme);
    }

    /**
     * Delete a biolink theme.
     *
     * @operationId deleteBiolinkTheme
     */
    public function destroy(BiolinkTheme $biolinkTheme, Request $request)
    {
        $this->authorizeManage($request, $biolinkTheme);

        if ($biolinkTheme->is_system) {
            abort(422, 'System themes cannot be deleted.');
        }

        $biolinkTheme->delete();

        return response()->noContent();
    }

    private function normalizeBooleanQueryParams(Request $request, array $keys): array
    {
        $normalized = [];

        foreach ($keys as $key) {
            if (!$request->has($key)) {
                continue;
            }

            $value = $request->query($key);
            if (!is_string($value)) {
                $normalized[$key] = $value;
                continue;
            }

            $normalized[$key] = match (Str::lower($value)) {
                'true' => '1',
                'false' => '0',
                default => $value,
            };
        }

        return $normalized;
    }

    private function authorizeManage(Request $request, ?BiolinkTheme $theme = null): void
    {
        if ($theme) {
            $this->authorize('update', $theme);
        } else {
            $this->authorize('create', BiolinkTheme::class);
        }
    }

    private function preparePayload(
        array $data,
        BiolinkTheme|null $theme = null,
    ): array {
        $data['slug'] = $data['slug'] ?? $theme?->slug ?? $this->uniqueSlug(
            Str::slug($data['name']),
            $theme,
        );
        $data['sort_order'] = $data['sort_order'] ?? 0;
        $data['is_published'] = $data['is_published'] ?? true;
        if (Schema::hasColumn('biolink_themes', 'metadata')) {
            $data['metadata'] = $data['metadata'] ?? $theme?->metadata ?? null;
        } else {
            unset($data['metadata']);
        }

        $data['config']['theme'] = [
            'slug' => $data['slug'],
            'category' => $data['category'],
            'locked' => $data['category'] === 'curated',
            'modified' => false,
        ];

        return $data;
    }

    private function uniqueSlug(string $base, BiolinkTheme|null $theme = null): string
    {
        $base = $base ?: 'biolink-theme';
        $slug = $base;
        $suffix = 2;

        while (
            BiolinkTheme::query()
                ->where('slug', $slug)
                ->when($theme, fn($query) => $query->where('id', '!=', $theme->id))
                ->exists()
        ) {
            $slug = "$base-$suffix";
            $suffix++;
        }

        return $slug;
    }
}
