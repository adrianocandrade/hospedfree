<?php
defined('ALTUMCODE') || die();

return (object) [
    'plugin_id' => 'offload',
    'name' => 'Offload & CDN - assets & user content',
    'description' => 'The offload plugin is meant to help offload the assets (images, js, css) files, including user upload content and retrieve them via an external storage or/and CDN.',
    'version' => '3.0.0',
    'url' => 'https://altumco.de/offload-plugin',
    'author' => 'AltumCode',
    'author_url' => 'https://altumcode.com/',
    'status' => 'uninstalled',
    'actions'=> true,
    'settings_url' => url('admin/settings/offload'),
    'avatar_style' => 'background: #9F91B9;background: -webkit-linear-gradient(top right, #9F91B9, #406BA8);background: -moz-linear-gradient(top right, #9F91B9, #406BA8);background: linear-gradient(to bottom left, #9F91B9, #406BA8);',
    'icon' => '💻',
];
