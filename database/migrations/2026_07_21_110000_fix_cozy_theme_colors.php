<?php

use Illuminate\Database\Migrations\Migration;
use App\Biolinks\Models\BiolinkTheme;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up()
    {
        $theme = BiolinkTheme::where('slug', Str::slug('Cozy Warm'))->first();
        if ($theme) {
            $config = $theme->config;
            $config['bgConfig']['backgroundColor'] = '#fcfbf7';
            $config['bgConfig']['color'] = '#5a5a5a';
            $config['btnConfig']['color'] = '#d6b150';
            $config['btnConfig']['textColor'] = '#ffffff';
            $config['btnConfig']['variant'] = 'solid';
            $config['btnConfig']['radius'] = 'rounded-lg';
            $config['btnConfig']['shadow'] = 'none';
            unset($config['customCss']);
            $theme->config = $config;
            $theme->save();
        }
    }

    public function down()
    {
    }
};
