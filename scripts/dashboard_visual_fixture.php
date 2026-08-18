<?php

use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Hash;

require dirname(__DIR__) . '/vendor/autoload.php';

$app = require dirname(__DIR__) . '/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$email = 'codex-dashboard-visual@example.test';
$action = $argv[1] ?? null;

if ($action === 'create') {
    if (User::query()->where('email', $email)->exists()) {
        fwrite(STDERR, "Visual fixture already exists.\n");
        exit(2);
    }

    User::withoutEvents(fn() => User::query()->create([
        'name' => 'Cliente Visual',
        'email' => $email,
        'email_verified_at' => now(),
        'password' => Hash::make('VisualTest-2026!'),
    ]));

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
