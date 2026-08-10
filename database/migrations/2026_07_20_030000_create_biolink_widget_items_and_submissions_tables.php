<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('biolink_widget_items')) {
            Schema::create('biolink_widget_items', function (Blueprint $table) {
                $table->id();
                $table
                    ->foreignId('biolink_id')
                    ->constrained('biolinks')
                    ->cascadeOnDelete();
                $table
                    ->foreignId('biolink_widget_id')
                    ->nullable()
                    ->constrained('biolink_widgets')
                    ->nullOnDelete();
                $table->string('type', 50)->nullable();
                $table->boolean('active')->default(true);
                $table->unsignedInteger('sort_order')->default(0);
                $table->string('title', 160)->nullable();
                $table->text('description')->nullable();
                $table->string('url', 1000)->nullable();
                $table->string('image', 1000)->nullable();
                $table->decimal('price', 10, 2)->nullable();
                $table->string('currency', 3)->nullable();
                $table->json('payload')->nullable();
                $table->timestamps();

                $table->index(
                    ['biolink_id', 'biolink_widget_id'],
                    'bwi_biolink_widget_idx',
                );
                $table->index(
                    ['biolink_widget_id', 'sort_order'],
                    'bwi_widget_sort_idx',
                );
            });
        }

        if (!Schema::hasTable('biolink_widget_submissions')) {
            Schema::create('biolink_widget_submissions', function (
                Blueprint $table,
            ) {
                $table->id();
                $table
                    ->foreignId('biolink_id')
                    ->constrained('biolinks')
                    ->cascadeOnDelete();
                $table
                    ->foreignId('widget_id')
                    ->nullable()
                    ->constrained('biolink_widgets')
                    ->nullOnDelete();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->unsignedInteger('workspace_id')->nullable();
                $table->string('widget_type', 50);
                $table->string('status', 20)->default('new');
                $table->string('name', 160)->nullable();
                $table->string('email', 255)->nullable();
                $table->string('phone', 60)->nullable();
                $table->text('message')->nullable();
                $table->json('payload')->nullable();
                $table->timestamp('consent_at')->nullable();
                $table->string('ip_hash', 64)->nullable();
                $table->string('user_agent', 500)->nullable();
                $table->string('referrer', 1000)->nullable();
                $table->timestamp('read_at')->nullable();
                $table->timestamp('archived_at')->nullable();
                $table->timestamps();

                $table->index('user_id', 'bws_user_idx');
                $table->index('workspace_id', 'bws_workspace_idx');
                $table->index('widget_type', 'bws_widget_type_idx');
                $table->index('status', 'bws_status_idx');
                $table->index(
                    ['biolink_id', 'status', 'created_at'],
                    'bws_biolink_status_created_idx',
                );
                $table->index(
                    ['biolink_id', 'widget_type', 'created_at'],
                    'bws_biolink_type_created_idx',
                );
            });
        }

        $this->ensureIndexes();
    }

    public function down(): void
    {
        Schema::dropIfExists('biolink_widget_submissions');
        Schema::dropIfExists('biolink_widget_items');
    }

    private function ensureIndexes(): void
    {
        $this->addIndexIfMissing(
            'biolink_widget_items',
            ['biolink_id', 'biolink_widget_id'],
            'bwi_biolink_widget_idx',
        );
        $this->addIndexIfMissing(
            'biolink_widget_items',
            ['biolink_widget_id', 'sort_order'],
            'bwi_widget_sort_idx',
        );

        $this->addIndexIfMissing(
            'biolink_widget_submissions',
            'user_id',
            'bws_user_idx',
        );
        $this->addIndexIfMissing(
            'biolink_widget_submissions',
            'workspace_id',
            'bws_workspace_idx',
        );
        $this->addIndexIfMissing(
            'biolink_widget_submissions',
            'widget_type',
            'bws_widget_type_idx',
        );
        $this->addIndexIfMissing(
            'biolink_widget_submissions',
            'status',
            'bws_status_idx',
        );
        $this->addIndexIfMissing(
            'biolink_widget_submissions',
            ['biolink_id', 'status', 'created_at'],
            'bws_biolink_status_created_idx',
        );
        $this->addIndexIfMissing(
            'biolink_widget_submissions',
            ['biolink_id', 'widget_type', 'created_at'],
            'bws_biolink_type_created_idx',
        );
    }

    private function addIndexIfMissing(
        string $tableName,
        string|array $columns,
        string $indexName,
    ): void {
        if (
            !Schema::hasTable($tableName) ||
            Schema::hasIndex($tableName, $indexName) ||
            Schema::hasIndex($tableName, (array) $columns)
        ) {
            return;
        }

        Schema::table(
            $tableName,
            fn(Blueprint $table) => $table->index($columns, $indexName),
        );
    }
};
