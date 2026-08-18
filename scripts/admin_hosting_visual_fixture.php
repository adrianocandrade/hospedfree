<?php

use App\Models\User;
use Common\Permissions\Models\Permission;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Hash;

require dirname(__DIR__) . '/vendor/autoload.php';

$app = require dirname(__DIR__) . '/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$email = 'codex-admin-hosting-visual@example.test';
$action = $argv[1] ?? null;

if ($action === 'create') {
    if (User::query()->where('email', $email)->exists()) {
        fwrite(STDERR, "Admin visual fixture already exists.\n");
        exit(2);
    }

    $user = User::withoutEvents(
        fn() => User::query()->create([
            'name' => 'Admin Visual',
            'email' => $email,
            'email_verified_at' => now(),
            'password' => Hash::make('VisualTest-2026!'),
        ]),
    );
    $permission = Permission::query()->firstOrCreate(['name' => 'admin']);
    $user->permissions()->attach($permission->id);

    echo "created\n";
    exit(0);
}

if ($action === 'delete') {
    User::query()->where('email', $email)->delete();
    echo "deleted\n";
    exit(0);
}

fwrite(STDERR, "Use create or delete.\n");
exit(1);
