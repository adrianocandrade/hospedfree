<?php

/* Load all the related plugin files */
require_once \Altum\Plugin::get('pwa')->path . 'Pwa.php';

/* Functions */
if(!function_exists('pwa_generate_manifest')) {
    function pwa_generate_manifest($options = []) {
        $manifest = [
            'id' => $options['id'] ?? md5($options['scope'] ?? SITE_URL),
            'start_url' => $options['start_url'] ?? SITE_URL,
            'scope' => $options['scope'] ?? SITE_URL,
            'name' => $options['name'],
            'theme_color' => $options['theme_color'] ?? '#000000',
            'background_color' => $options['background_color'] ?? '#000000',
            'display' => $options['display'] ?? 'standalone',
            'orientation' => $options['orientation'] ?? 'any',
            'icons' => [],
            'screenshots' => [],
            'categories' => $options['categories'] ?? ['utilities'],
            'dir' => $options['dir'] ?? 'auto',
            'lang' => $options['lang'] ?? \Altum\Language::$default_code,
        ];

        if(isset($options['short_name'])) {
            $manifest['short_name'] = $options['short_name'];
        }

        if(isset($options['description'])) {
            $manifest['description'] = $options['description'];
        }

        if($options['app_icon_url']) {
            $manifest['icons'][] = [
                'src' => $options['app_icon_url'],
                'sizes' => '512x512',
                'type' => 'image/png',
                'purpose' => 'any'
            ];
        }

        if($options['app_icon_maskable_url']) {
            $manifest['icons'][] = [
                'src' => $options['app_icon_maskable_url'],
                'sizes' => '512x512',
                'type' => 'image/png',
                'purpose' => 'maskable'
            ];
        }

        if(isset($options['mobile_screenshots']) && is_array($options['mobile_screenshots']) && count($options['mobile_screenshots'])) {
            foreach($options['mobile_screenshots'] as $screenshot_url) {
                if(empty($screenshot_url)) continue;

                $info = getimagesize($screenshot_url);

                $manifest['screenshots'][] = [
                    'src' => $screenshot_url,
                    'sizes' => $info[0] . 'x' . $info[1],
                    'type' => $info['mime'],
                    'form_factor' => 'narrow'
                ];
            }
        }

        if(isset($options['desktop_screenshots']) && is_array($options['desktop_screenshots']) && count($options['desktop_screenshots'])) {
            foreach($options['desktop_screenshots'] as $screenshot_url) {
                if(empty($screenshot_url)) continue;

                $info = getimagesize($screenshot_url);

                $manifest['screenshots'][] = [
                    'src' => $screenshot_url,
                    'sizes' => $info[0] . 'x' . $info[1],
                    'type' => $info['mime'],
                    'form_factor' => 'wide'
                ];
            }
        }

        if(count($options['shortcuts'])) {
            foreach($options['shortcuts'] as $shortcut) {
                if(!empty($shortcut['name'])) {
                    $new_shortcut = [
                        'name' => $shortcut['name'],
                        'description' => $shortcut['description'],
                        'url' => $shortcut['url'],
                    ];

                    if($shortcut['icon_url']) {
                        $new_shortcut['icons'] = [[
                            'src' => $shortcut['icon_url'],
                            'sizes' => '192x192',
                        ]];
                    }

                    $manifest['shortcuts'][] = $new_shortcut;
                }
            }
        }

        return json_encode($manifest);
    }
}

if(!function_exists('pwa_save_manifest')) {
    function pwa_save_manifest($manifest_content, $file_name = 'manifest') {
        file_put_contents(\Altum\Uploads::get_full_path('pwa') . $file_name . '.json', $manifest_content);
    }
}

if(!function_exists('pwa_generate_dynamic_splash_screen_links')) {
	function pwa_generate_dynamic_splash_screen_links() {
		if((settings()->pwa->dynamic_splash_screen ?? true) && settings()->pwa->app_icon_maskable) {
			return '
				<link rel="apple-touch-startup-image" href="' . SITE_URL . 'pwa-splash-generator?size=750x1334&icon=' . settings()->pwa->app_icon_maskable . '&color=' . (str_replace('#', '', settings()->pwa->background_color)) . '" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)">
				<link rel="apple-touch-startup-image" href="' . SITE_URL . 'pwa-splash-generator?size=1170x2532&icon=' . settings()->pwa->app_icon_maskable . '&color=' . (str_replace('#', '', settings()->pwa->background_color)) . '" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)">
				<link rel="apple-touch-startup-image" href="' . SITE_URL . 'pwa-splash-generator?size=1179x2556&icon=' . settings()->pwa->app_icon_maskable . '&color=' . (str_replace('#', '', settings()->pwa->background_color)) . '" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)">
				<link rel="apple-touch-startup-image" href="' . SITE_URL . 'pwa-splash-generator?size=1290x2796&icon=' . settings()->pwa->app_icon_maskable . '&color=' . (str_replace('#', '', settings()->pwa->background_color)) . '" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)">
				<link rel="apple-touch-startup-image" href="' . SITE_URL . 'pwa-splash-generator?size=1536x2048&icon=' . settings()->pwa->app_icon_maskable . '&color=' . (str_replace('#', '', settings()->pwa->background_color)) . '" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)">
				<link rel="apple-touch-startup-image" href="' . SITE_URL . 'pwa-splash-generator?size=2048x2732&icon=' . settings()->pwa->app_icon_maskable . '&color=' . (str_replace('#', '', settings()->pwa->background_color)) . '" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)">
			';
		}
	}
}
