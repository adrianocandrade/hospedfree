<?php

namespace Altum\Plugin;

use Altum\Alerts;
use Altum\Plugin;

class ImageOptimizer {
    public static $plugin_id = 'image-optimizer';

    public static function optimize($file_path, $new_file_name, $original_file_name, $new_file_path) {
        if(isset(settings()->image_optimizer)) {

            $original_size = filesize($file_path);
            $original_format = mb_strtolower(pathinfo($original_file_name, PATHINFO_EXTENSION));

            switch (settings()->image_optimizer->provider) {
                case 'local':
                    $optimizer = new \ArtisansWeb\Optimizer();
                    $optimizer->qlty = settings()->image_optimizer->quality ?? 75;
                    $optimizer->provider = 'local';
                    $optimizer->root_dir = \Altum\Plugin::get(self::$plugin_id)->path;
                    break;

                case 'resmushit':
                    $optimizer = new \ArtisansWeb\Optimizer();
                    $optimizer->qlty = settings()->image_optimizer->quality ?? 75;
                    $optimizer->provider = 'resmushit';
                    $optimizer->root_dir = \Altum\Plugin::get(self::$plugin_id)->path;
                    break;

                case 'imagerypro':
                    $optimizer = new AltumImageryPro();
                    $optimizer->quality = settings()->image_optimizer->quality ?? 75;
                    $optimizer->api_key = settings()->image_optimizer->imagerypro_api_key;
                    $optimizer->domain = get_domain_from_url(SITE_URL);
                    $optimizer->url = SITE_URL;
                    break;
            }

            $result = $optimizer->optimize($file_path, '', $new_file_name);

            /* Clear cached filesystem stats */
            clearstatcache(true, $file_path);

            /* Get new stats */
            $new_format = $original_format;
            $new_size = filesize($file_path);
            $percentage_difference = number_format(get_percentage_change($original_size, $new_size), 0, '', '');

            /* Statistics */
            if(settings()->image_optimizer->statistics_is_enabled) {

                /* Insert / update */
                db()->insert('image_optimizations', [
                    'original_format' => $original_format,
                    'new_format' => $new_format,
                    'original_size' => $original_size,
                    'new_size' => $new_size,
                    'percentage_difference' => $percentage_difference,
                    'file' => $new_file_name,
                    'path' => $new_file_path,
                    'datetime' => get_date(),
                ]);

            }

        }

        else {
            /* Support old versions */
            $optimizer = new \ArtisansWeb\Optimizer();
            $optimizer->qlty = settings()->image_optimizer->quality ?? 75;
            $optimizer->provider = 'resmushit';
            $optimizer->root_dir = \Altum\Plugin::get(self::$plugin_id)->path;
        }
    }

    public static function install() {

        /* Check and make sure some required functions are available */
        if(!function_exists('mime_content_type')) {
            Alerts::add_error(sprintf(l('global.error_message.function_required'), 'mime_content_type()'));
            redirect('admin/plugins');
        }

        if(!function_exists('curl_version')) {
            Alerts::add_error(sprintf(l('global.error_message.function_required'), 'CURL'));
            redirect('admin/plugins');
        }

        if(!extension_loaded('gd') || !function_exists('gd_info')) {
            Alerts::add_error(sprintf(l('global.error_message.function_required'), 'GD'));
            redirect('admin/plugins');
        }

        /* Run the installation process of the plugin */
        $queries = [
            'INSERT IGNORE INTO `settings` (`key`, `value`) VALUES (\'image_optimizer\', \'{"is_enabled":true,"provider":"resmushit","imagerypro_api_key":"","quality":80}\');',
            "CREATE TABLE `image_optimizations` (
              `image_optimization_id` bigint unsigned NOT NULL AUTO_INCREMENT,
              `original_format` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              `new_format` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              `original_size` bigint unsigned DEFAULT NULL,
              `new_size` bigint unsigned DEFAULT NULL,
              `percentage_difference` tinyint DEFAULT NULL,
              `file` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              `path` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              `datetime` datetime DEFAULT NULL,
              PRIMARY KEY (`image_optimization_id`),
              KEY `image_optimizations_datetime_idx` (`datetime`) USING BTREE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"
        ];

        foreach($queries as $query) {
            database()->query($query);
        }

        return Plugin::save_status(self::$plugin_id, 'active');

    }

    public static function uninstall() {

        /* Run the installation process of the plugin */
        $queries = [
            "DELETE FROM `settings` WHERE `key` = 'image_optimizer';",
            "DROP TABLE IF EXISTS image_optimizations;",
        ];

        foreach($queries as $query) {
            database()->query($query);
        }

        return Plugin::save_status(self::$plugin_id, 'uninstalled');

    }

    public static function activate() {
        return Plugin::save_status(self::$plugin_id, 'active');
    }

    public static function disable() {
        return Plugin::save_status(self::$plugin_id, 'installed');
    }

}
