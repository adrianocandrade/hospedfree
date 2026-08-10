<?php

namespace Tests\Feature;

use App\Models\User;
use App\QrCodes\Actions\CrupdateQrCode;
use App\QrCodes\Models\QrCode;
use App\QrCodes\Policies\QrCodePolicy;
use App\QrCodes\QrCodeType;
use App\QrCodes\Requests\CrupdateQrCodeRequest;
use Common\Permissions\Models\Permission;
use Common\Workspaces\ActiveWorkspace;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class QrCodeTypesTest extends TestCase
{
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');
        DB::reconnect('sqlite');
        $this->createSchema();

        $this->user = $this->createUser();
        $this->grantAdminPermission($this->user);
        $workspaceId = DB::table('workspaces')->insertGetId([
            'name' => 'QR tests',
            'owner_id' => $this->user->id,
            'is_personal' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('workspace_user')->insert([
            'user_id' => $this->user->id,
            'workspace_id' => $workspaceId,
            'is_owner' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Auth::login($this->user->fresh());
        ActiveWorkspace::clearCache();
    }

    public function test_it_creates_and_updates_every_qr_code_type(): void
    {
        foreach ($this->validPayloads() as $type => $input) {
            $qrCode = (new CrupdateQrCode())->execute([
                'type' => $type,
                'name' => "QR $type",
                ...$input,
            ]);

            $this->assertSame($type, $qrCode->type->value);
            $this->assertNotSame('', $qrCode->getQrCodePayload());
            $this->assertSame($this->user->id, $qrCode->user_id);

            (new CrupdateQrCode())->execute(
                [
                    'type' => $type,
                    'name' => "Updated $type",
                    ...$input,
                ],
                qrCode: $qrCode,
            );

            $this->assertSame("Updated $type", $qrCode->fresh()->name);
            $this->assertSame($type, $qrCode->fresh()->type->value);
        }

        $this->assertDatabaseCount('qr_codes', count(QrCodeType::cases()));
    }

    public function test_sensitive_type_data_is_encrypted_at_rest(): void
    {
        $qrCode = (new CrupdateQrCode())->execute([
            'type' => 'wifi',
            'name' => 'Private Wi-Fi',
            'data' => [
                'ssid' => 'Minha Rede',
                'security' => 'WPA',
                'password' => 'segredo-super-seguro',
                'hidden' => false,
            ],
        ]);

        $stored = (string) DB::table('qr_codes')
            ->where('id', $qrCode->id)
            ->value('data');

        $this->assertStringNotContainsString('Minha Rede', $stored);
        $this->assertStringNotContainsString('segredo-super-seguro', $stored);
        $this->assertSame('Minha Rede', $qrCode->fresh()->data['ssid']);
        $this->assertSame(
            'segredo-super-seguro',
            $qrCode->fresh()->data['password'],
        );
    }

    public function test_legacy_records_default_to_url_type(): void
    {
        $id = DB::table('qr_codes')->insertGetId([
            'back_half' => 'legacy',
            'long_url' => 'https://example.com/legacy',
            'user_id' => $this->user->id,
            'workspace_id' => ActiveWorkspace::get()->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $qrCode = QrCode::query()->findOrFail($id);

        $this->assertSame(QrCodeType::Url, $qrCode->type);
        $this->assertSame(
            'http://localhost/qr/legacy',
            $qrCode->getQrCodePayload(),
        );
    }

    public function test_request_rejects_invalid_types_unknown_fields_and_direct_capabilities(): void
    {
        $this->assertValidationErrors(
            ['type' => 'invalid', 'data' => []],
            ['type'],
        );
        $this->assertValidationErrors(
            [
                'type' => 'text',
                'data' => [
                    'content' => 'Olá',
                    'buttonLabel' => 'Não permitido',
                ],
            ],
            ['data'],
        );
        $this->assertValidationErrors(
            [
                'type' => 'pix',
                'data' => $this->validPayloads()['pix']['data'],
                'password' => 'não pode',
            ],
            ['password'],
        );
    }

    public function test_request_requires_the_fields_for_each_type(): void
    {
        $expectedErrors = [
            'url' => 'long_url',
            'pix' => 'data.key_type',
            'wifi' => 'data.ssid',
            'whatsapp' => 'data.phone',
            'phone' => 'data.phone',
            'email' => 'data.email',
            'sms' => 'data.phone',
            'text' => 'data.content',
            'vcard' => 'data.first_name',
            'location' => 'data.latitude',
        ];

        foreach ($expectedErrors as $type => $errorKey) {
            $this->assertValidationErrors(
                ['type' => $type, 'data' => []],
                [$errorKey],
            );
        }
    }

    public function test_policy_allows_the_owner_and_denies_an_outsider(): void
    {
        $qrCode = (new CrupdateQrCode())->execute([
            'type' => 'text',
            'data' => ['content' => 'Privado'],
        ]);
        $policy = app(QrCodePolicy::class);

        $this->assertTrue($policy->show($this->user, $qrCode) === true);

        $outsider = $this->createUser();
        Auth::login($outsider);
        ActiveWorkspace::clearCache();
        $response = $policy->show($outsider, $qrCode);

        $this->assertFalse($response === true);
        $this->assertFalse($response->allowed());
    }

    /** @return array<string, array<string, mixed>> */
    private function validPayloads(): array
    {
        return [
            'url' => ['long_url' => 'https://example.com'],
            'pix' => [
                'data' => [
                    'key_type' => 'cpf',
                    'key' => '529.982.247-25',
                    'receiver_name' => 'José da Silva',
                    'receiver_city' => 'São Paulo',
                    'amount' => '10,50',
                ],
            ],
            'wifi' => [
                'data' => [
                    'ssid' => 'Minha Rede',
                    'security' => 'WPA',
                    'password' => 'senha:forte',
                    'hidden' => true,
                ],
            ],
            'whatsapp' => [
                'data' => [
                    'phone' => '(11) 99999-9999',
                    'message' => 'Olá',
                ],
            ],
            'phone' => ['data' => ['phone' => '(11) 99999-9999']],
            'email' => [
                'data' => [
                    'email' => 'cliente@example.com',
                    'subject' => 'Contato',
                ],
            ],
            'sms' => [
                'data' => [
                    'phone' => '(11) 99999-9999',
                    'message' => 'Olá',
                ],
            ],
            'text' => ['data' => ['content' => 'Conteúdo simples']],
            'vcard' => [
                'data' => [
                    'first_name' => 'Ana',
                    'last_name' => 'Silva',
                    'phone' => '(11) 99999-9999',
                    'email' => 'ana@example.com',
                    'website' => 'https://example.com',
                ],
            ],
            'location' => [
                'data' => [
                    'latitude' => '-23.5505',
                    'longitude' => '-46.6333',
                    'location_name' => 'São Paulo',
                ],
            ],
        ];
    }

    /** @param string[] $expectedKeys */
    private function assertValidationErrors(
        array $input,
        array $expectedKeys,
    ): void {
        $request = CrupdateQrCodeRequest::create(
            '/api/v1/qr-code',
            'POST',
            $input,
        );
        $request->setContainer($this->app);
        $request->setRedirector($this->app['redirect']);

        try {
            $request->validateResolved();
            $this->fail('Expected QR code validation to fail.');
        } catch (ValidationException $exception) {
            foreach ($expectedKeys as $expectedKey) {
                $this->assertArrayHasKey($expectedKey, $exception->errors());
            }
        }
    }

    private function createUser(): User
    {
        return User::query()->create([
            'name' => 'QR user',
            'email' => 'qr-' . Str::random(10) . '@example.com',
            'email_verified_at' => now(),
            'password' => 'password',
        ]);
    }

    private function grantAdminPermission(User $user): void
    {
        $permission = Permission::query()->create([
            'name' => 'admin',
            'group' => 'tests',
        ]);
        $user->permissions()->attach($permission->id);
    }

    private function createSchema(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('username')->nullable();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable();
            $table->string('image')->nullable();
            $table->string('language')->nullable();
            $table->string('country')->nullable();
            $table->string('gender')->nullable();
            $table->string('timezone')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80)->unique();
            $table->string('group', 30);
            $table->timestamps();
        });
        Schema::create('user_sessions', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('user_id')->index();
            $table->string('browser')->nullable();
            $table->string('platform')->nullable();
            $table->string('device')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->timestamps();
        });
        Schema::create('permissionables', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('permission_id')->index();
            $table->unsignedInteger('permissionable_id')->index();
            $table->string('permissionable_type', 40)->index();
            $table->text('restrictions')->nullable();
        });
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('guests')->default(false);
            $table->timestamps();
        });
        Schema::create('user_role', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('user_id')->index();
            $table->unsignedInteger('role_id')->index();
            $table->timestamps();
        });
        Schema::create('workspaces', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedInteger('owner_id')->index();
            $table->boolean('is_personal')->default(true);
            $table->timestamps();
        });
        Schema::create('workspace_user', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('user_id')->index();
            $table->unsignedInteger('workspace_id')->index();
            $table->unsignedInteger('role_id')->nullable()->index();
            $table->boolean('is_owner')->default(false);
            $table->timestamps();
        });

        Schema::create('qr_codes', function (Blueprint $table) {
            $table->id();
            $table->string('back_half', 50)->unique();
            $table->unsignedInteger('domain_id')->default(0);
            $table->unsignedBigInteger('linkeable_id')->nullable();
            $table->string('linkeable_type', 50)->nullable();
            $table->string('name')->nullable();
            $table->string('type', 20)->default('url');
            $table->longText('data')->nullable();
            $table->text('long_url')->nullable();
            $table->unsignedInteger('user_id')->index();
            $table->unsignedInteger('workspace_id')->index();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('activates_at')->nullable();
            $table->timestamp('scanned_at')->nullable();
            $table->unsignedInteger('scans_count')->default(0);
            $table->string('password', 100)->nullable();
            $table->text('utm')->nullable();
            $table->longText('style')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        foreach (['links', 'folders', 'biolinks'] as $tableName) {
            Schema::create($tableName, function (Blueprint $table) {
                $table->id();
                $table->string('back_half', 50)->nullable();
                $table->unsignedInteger('domain_id')->nullable();
            });
        }
    }
}
