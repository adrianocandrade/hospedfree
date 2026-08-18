<?php

namespace Tests\Feature\Security;

use App\Models\User;
use App\Security\Models\AdministrativeSecurityEvent;
use Common\Logging\Mail\OutgoingEmailLogController;
use Common\Logging\Mail\OutgoingEmailLogItem;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class OutgoingEmailLogSecurityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');
        DB::reconnect('sqlite');

        Schema::create('users', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->timestamps();
        });
        Schema::create('outgoing_email_log', function (Blueprint $table): void {
            $table->id();
            $table->string('message_id')->nullable();
            $table->string('from')->nullable();
            $table->string('to')->nullable();
            $table->string('subject')->nullable();
            $table->binary('mime');
            $table->string('status')->nullable();
            $table->timestamps();
        });
        Schema::create('administrative_security_events', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedInteger('actor_user_id')->index();
            $table->string('event', 120)->index();
            $table->string('target_type', 120)->index();
            $table->string('target_id')->nullable();
            $table->string('ip_address', 80)->nullable();
            $table->timestamp('created_at')->nullable();
        });
    }

    public function test_email_metadata_content_and_download_use_separate_permissions(): void
    {
        $controller = app(OutgoingEmailLogController::class);
        $denied = $this->requestFor($this->userWithPermissions(['admin.access']));

        try {
            $controller->index($denied);
            $this->fail('Metadata access should have been denied.');
        } catch (HttpException $exception) {
            $this->assertSame(403, $exception->getStatusCode());
        }

        $metadataUser = $this->userWithPermissions([
            'admin.access',
            'email_logs.view',
        ]);
        $response = $controller->index($this->requestFor($metadataUser));
        $this->assertCount(0, $response->resource);

        $log = OutgoingEmailLogItem::query()->create([
            'message_id' => 'message-safe-id',
            'from' => 'no-reply@example.test',
            'to' => 'customer@example.test',
            'subject' => "Aviso\r\nX-Injected: value",
            'mime' => utf8_encode("From: no-reply@example.test\r\nTo: customer@example.test\r\nSubject: Aviso\r\n\r\nSafe body"),
            'status' => 'sent',
        ]);

        $contentRequest = $this->requestFor(
            $this->userWithPermissions([
                'admin.access',
                'email_logs.view_content',
                'email_logs.download',
            ]),
        );
        $controller->show($contentRequest, $log->id);
        $download = $controller->downloadLogItem($contentRequest, $log->id);

        $this->assertStringNotContainsString(
            "\r\n",
            (string) $download->headers->get('Content-Disposition'),
        );
        $this->assertDatabaseHas('administrative_security_events', [
            'event' => 'outgoing_email.content_viewed',
            'target_id' => (string) $log->id,
            'ip_address' => '198.51.100.xxx',
        ]);
        $this->assertDatabaseHas('administrative_security_events', [
            'event' => 'outgoing_email.item_downloaded',
            'target_id' => (string) $log->id,
        ]);
    }

    private function requestFor(User $user): Request
    {
        $request = Request::create('/api/v1/logs/outgoing-email');
        $request->server->set('REMOTE_ADDR', '198.51.100.18');
        $request->setUserResolver(fn() => $user);

        return $request;
    }

    private function userWithPermissions(array $permissions): User
    {
        $user = new class extends User {
            public array $testPermissions = [];

            public function hasPermission(string $name): bool
            {
                return in_array($name, $this->testPermissions, true);
            }
        };
        $user->setTable('users');
        User::withoutEvents(fn() => $user->forceFill([
            'name' => 'Operador',
            'email' => uniqid('operator-', true) . '@example.test',
            'password' => bcrypt('password'),
        ])->save());
        $user->testPermissions = $permissions;

        return $user;
    }
}
