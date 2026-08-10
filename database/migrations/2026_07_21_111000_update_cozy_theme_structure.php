<?php

use Illuminate\Database\Migrations\Migration;
use App\Biolinks\Models\BiolinkTheme;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up()
    {
        $theme = BiolinkTheme::where('slug', Str::slug('Cozy Warm'))->first();
        if (!$theme) return;

        $config = $theme->config;
        
        $customCss = '
.linkbio-theme-cozy-warm {
    --theme-page-bg: #fffbee;
    --theme-panel-bg: #fff7d6;
    --theme-primary: #e2bd4c;
    --theme-primary-hover: #d3ac37;
    --theme-text: #5D4037;
    --theme-border: rgba(174, 130, 37, 0.22);
}

/* Page Background */
.linkbio-theme-cozy-warm.biolink-layout-container {
    background-color: var(--theme-page-bg) !important;
}
.linkbio-theme-cozy-warm, .linkbio-theme-cozy-warm * {
    color: var(--theme-text);
}

/* Header Avatar */
.linkbio-theme-cozy-warm header {
    margin-top: 20px;
}
.linkbio-theme-cozy-warm header img {
    width: 100px !important;
    height: 100px !important;
    border-radius: 24px !important;
    object-fit: cover;
    border: 3px solid #FFE082;
    box-shadow: 0 4px 14px rgba(0,0,0,0.06);
}

/* Panel Background */
.linkbio-theme-cozy-warm .biolink-panel-group {
    background-color: var(--theme-panel-bg);
    border-radius: 32px;
    padding: 32px;
    margin-top: 16px;
    border: 1px solid var(--theme-border);
    box-shadow: 0 10px 40px rgba(0,0,0,0.03);
}
@media (max-width: 767px) {
    .linkbio-theme-cozy-warm .biolink-panel-group {
        padding: 24px 20px;
        border-radius: 32px 32px 0 0;
        margin-left: -24px;
        margin-right: -24px;
        width: calc(100% + 48px);
        border-bottom: none;
        border-left: none;
        border-right: none;
    }
}

/* Buttons / Links */
.linkbio-theme-cozy-warm .biolink-btn-custom {
    background-color: var(--theme-primary) !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 20px !important;
    height: 64px;
    transition: all 0.2s ease;
    font-weight: 600;
    font-size: 15px;
    box-shadow: 0 4px 12px rgba(226, 189, 76, 0.3) !important;
    margin-bottom: 16px !important;
}
.linkbio-theme-cozy-warm .biolink-btn-custom:hover {
    background-color: var(--theme-primary-hover) !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(226, 189, 76, 0.4) !important;
}

/* Socials */
.linkbio-theme-cozy-warm .biolink-top-group a {
    background-color: var(--theme-primary) !important;
    color: #ffffff !important;
    width: 48px;
    height: 48px;
    border-radius: 16px !important;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
    box-shadow: 0 4px 10px rgba(226, 189, 76, 0.3);
    border: none !important;
}
.linkbio-theme-cozy-warm .biolink-top-group a:hover {
    transform: translateY(-2px);
}
.linkbio-theme-cozy-warm .biolink-top-group a svg {
    width: 22px;
    height: 22px;
}

/* Passwords / Forms */
.linkbio-theme-cozy-warm form {
    background-color: transparent !important;
    border: 1px solid var(--theme-border) !important;
    padding: 24px !important;
    border-radius: 24px !important;
}
.linkbio-theme-cozy-warm input {
    background-color: #ffffff !important;
    border: 1px solid var(--theme-border) !important;
    border-radius: 14px !important;
}
.linkbio-theme-cozy-warm form button {
    background-color: var(--theme-primary) !important;
    color: #ffffff !important;
    border-radius: 14px !important;
    font-weight: 600 !important;
}
';

        $config['customCss'] = $customCss;
        
        $config['bgConfig']['backgroundColor'] = '#fffbee';
        $config['bgConfig']['color'] = '#5D4037';
        $config['btnConfig']['color'] = '#e2bd4c';
        $config['btnConfig']['textColor'] = '#ffffff';
        $config['headerConfig']['titleColor'] = '#5D4037';

        $theme->config = $config;
        $theme->save();
    }

    public function down()
    {
        // rollback
    }
};
