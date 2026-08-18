<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('custom_pages')) {
            return;
        }

        $pages = [
            'privacy-policy' => [
                'title' => 'Política de Privacidade',
                'file' => 'privacy-policy.html',
                'description' => 'Entenda como a HospedFree coleta, usa, protege e compartilha dados pessoais para prestar o serviço de hospedagem.',
            ],
            'terms-of-service' => [
                'title' => 'Termos de Uso',
                'file' => 'terms-of-service.html',
                'description' => 'Conheça as regras de uso da hospedagem gratuita e dos planos pagos da HospedFree.',
            ],
            'cookies' => [
                'title' => 'Política de Cookies',
                'file' => 'cookies.html',
                'description' => 'Saiba quais cookies a HospedFree usa e controle suas preferências de analytics.',
            ],
        ];

        foreach ($pages as $slug => $definition) {
            $body = file_get_contents(
                base_path(
                    'common/foundation/resources/defaults/' . $definition['file'],
                ),
            );

            if ($body === false) {
                throw new RuntimeException(
                    "Could not read the legal page source for {$slug}.",
                );
            }

            $existing = DB::table('custom_pages')->where('slug', $slug)->first();

            if (!$existing) {
                DB::table('custom_pages')->insert([
                    'title' => $definition['title'],
                    'slug' => $slug,
                    'body' => $body,
                    'meta' => json_encode([
                        'description' => $definition['description'],
                    ], JSON_THROW_ON_ERROR),
                    'type' => 'default',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                continue;
            }

            $isGeneratedPlaceholder = str_starts_with(
                (string) $existing->title,
                'Example ',
            ) || str_contains((string) $existing->body, '[Website Name]') ||
                str_contains((string) $existing->body, 'Welcome to HospedFree');

            if ($isGeneratedPlaceholder) {
                DB::table('custom_pages')
                    ->where('id', $existing->id)
                    ->update([
                        'title' => $definition['title'],
                        'body' => $body,
                        'meta' => json_encode([
                            'description' => $definition['description'],
                        ], JSON_THROW_ON_ERROR),
                        'type' => 'default',
                        'updated_at' => now(),
                    ]);
            }
        }
    }

    public function down(): void
    {
        // Legal documents are intentionally preserved on rollback.
    }
};
