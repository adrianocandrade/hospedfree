<?php

use App\Biolinks\Support\BiolinkSystemBadgeCatalog;
use Common\Database\Seeders\PermissionTableSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('biolink_badge_definitions')) {
            Schema::create('biolink_badge_definitions', function (Blueprint $table) {
                $table->increments('id');
                $table->string('key', 80)->unique();
                $table->string('kind', 20)->default('official')->index();
                $table->string('label_key', 160);
                $table->string('description_key', 160);
                $table->string('icon')->nullable();
                $table->string('color', 20)->nullable();
                $table->string('required_feature', 80)->nullable()->index();
                $table->string('grant_mode', 20)->default('admin')->index();
                $table->timestamp('starts_at')->nullable()->index();
                $table->timestamp('claim_until')->nullable()->index();
                $table->boolean('is_active')->default(true)->index();
                $table->json('metadata')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('biolink_badge_grants')) {
            Schema::create('biolink_badge_grants', function (Blueprint $table) {
                $table->increments('id');
                $table->unsignedInteger('badge_id')->index();
                $table->unsignedInteger('user_id')->index();
                $table->string('source', 20)->default('admin')->index();
                $table->unsignedInteger('granted_by')->nullable()->index();
                $table->timestamp('granted_at')->nullable();
                $table->timestamp('revoked_at')->nullable()->index();
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->unique(['badge_id', 'user_id']);
                $table
                    ->foreign('badge_id')
                    ->references('id')
                    ->on('biolink_badge_definitions')
                    ->cascadeOnDelete();
            });
        }

        $this->seedDefinitions();
        $this->backfillLegacyGrants();
        $this->seedPermission();
    }

    public function down(): void
    {
        Schema::dropIfExists('biolink_badge_grants');
        Schema::dropIfExists('biolink_badge_definitions');
    }

    private function seedDefinitions(): void
    {
        $now = now();
        $eventWindows = [
            'summer_2026' => ['2026-06-01 00:00:00', '2026-08-31 23:59:59'],
            'easter_2026' => ['2026-03-29 00:00:00', '2026-04-12 23:59:59'],
            'christmas_2025' => ['2025-12-01 00:00:00', '2026-01-06 23:59:59'],
            'easter_2025' => ['2025-04-13 00:00:00', '2025-04-27 23:59:59'],
            'christmas_2024' => ['2024-12-01 00:00:00', '2025-01-06 23:59:59'],
        ];

        foreach (BiolinkSystemBadgeCatalog::all() as $key => $badge) {
            $isEvent = in_array($key, [
                'summer_2026',
                'easter_2026',
                'christmas_2025',
                'easter_2025',
                'christmas_2024',
            ], true);

            DB::table('biolink_badge_definitions')->updateOrInsert(
                ['key' => $key],
                [
                    'kind' => $isEvent ? 'event' : 'official',
                    'label_key' => $badge['label'],
                    'description_key' => $badge['description'],
                    'icon' => '/' . $badge['icon'],
                    'color' => $badge['color'],
                    'required_feature' => $badge['requiredFeature'],
                    'grant_mode' => $isEvent
                        ? 'claim'
                        : ($badge['requiredFeature'] ? 'derived' : 'admin'),
                    'starts_at' => $eventWindows[$key][0] ?? null,
                    'claim_until' => $eventWindows[$key][1] ?? null,
                    'is_active' => true,
                    'updated_at' => $now,
                    'created_at' => $now,
                ],
            );
        }
    }

    private function backfillLegacyGrants(): void
    {
        if (
            !Schema::hasTable('biolink_appearances') ||
            !Schema::hasTable('links')
        ) {
            return;
        }

        DB::table('biolink_appearances')
            ->join('links', 'links.id', '=', 'biolink_appearances.biolink_id')
            ->select([
                'biolink_appearances.id as appearance_id',
                'links.user_id',
                'biolink_appearances.config',
            ])
            ->orderBy('biolink_appearances.id')
            ->chunkById(100, function ($appearances) {
                foreach ($appearances as $appearance) {
                    $config = is_string($appearance->config)
                        ? json_decode($appearance->config, true)
                        : $appearance->config;

                    if (!is_array($config)) {
                        continue;
                    }

                    foreach (
                        $config['badgeConfig']['items'] ?? [] as $item
                    ) {
                        if (
                            !is_array($item) ||
                            ($item['type'] ?? null) !== 'system'
                        ) {
                            continue;
                        }

                        $badgeId = DB::table('biolink_badge_definitions')
                            ->where('key', $item['id'] ?? '')
                            ->value('id');

                        if (!$badgeId || !$appearance->user_id) {
                            continue;
                        }

                        DB::table('biolink_badge_grants')->updateOrInsert(
                            [
                                'badge_id' => $badgeId,
                                'user_id' => $appearance->user_id,
                            ],
                            [
                                'source' => 'legacy',
                                'granted_at' => now(),
                                'revoked_at' => null,
                                'updated_at' => now(),
                                'created_at' => now(),
                            ],
                        );
                    }
                }
            }, 'biolink_appearances.id', 'appearance_id');
    }

    private function seedPermission(): void
    {
        if (!Schema::hasTable('permissions')) {
            return;
        }

        app(PermissionTableSeeder::class)->run();
    }
};
