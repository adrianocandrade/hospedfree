<?php

namespace App\Http\Controllers;

use App\Biolinks\Models\BiolinkTheme;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class BiolinkThemeStarsController extends Controller
{
    public function store(BiolinkTheme $theme)
    {
        $userId = auth()->id();

        DB::table('biolink_theme_stars')->updateOrInsert([
            'user_id' => $userId,
            'biolink_theme_id' => $theme->id,
        ], [
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['status' => 'success', 'starred' => true]);
    }

    public function destroy(BiolinkTheme $theme)
    {
        $userId = auth()->id();

        DB::table('biolink_theme_stars')
            ->where('user_id', $userId)
            ->where('biolink_theme_id', $theme->id)
            ->delete();

        return response()->json(['status' => 'success', 'starred' => false]);
    }
}
