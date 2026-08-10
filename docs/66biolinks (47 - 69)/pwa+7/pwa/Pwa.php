<?php

namespace Altum\Plugin;

use Altum\Plugin;

class Pwa {
    public static $plugin_id = 'pwa';

    public static function install() {

        /* Run the installation process of the plugin */
        $queries = [
            'INSERT IGNORE INTO `settings` (`key`, `value`) VALUES (\'pwa\', \'{"is_enabled":true,"display_install_bar":true,"display_install_bar_for_guests":true,"display_install_bar_delay":5,"app_name":"","short_app_name":"","app_description":"","theme_color":"#237FFF","app_start_url":"","app_icon":"","app_icon_maskable":"","mobile_screenshot_1":"","desktop_screenshot_1":"","mobile_screenshot_2":"","desktop_screenshot_2":"","mobile_screenshot_3":"","desktop_screenshot_3":"","mobile_screenshot_4":null,"desktop_screenshot_4":null,"mobile_screenshot_5":null,"desktop_screenshot_5":null,"mobile_screenshot_6":null,"desktop_screenshot_6":null,"shortcut_name_1":"","shortcut_description_1":"","shortcut_url_1":"","shortcut_icon_1":"","shortcut_name_2":"","shortcut_description_2":"","shortcut_url_2":"","shortcut_icon_2":"","shortcut_name_3":"","shortcut_description_3":"","shortcut_url_3":"","shortcut_icon_3":null}\');',
        ];

        if(PRODUCT_KEY == '66pusher') {
            $queries[] = "
                CREATE TABLE `pwas` (
                `pwa_id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `user_id` bigint unsigned NOT NULL,
                `name` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
                `settings` text COLLATE utf8mb4_unicode_ci,
                `manifest` text COLLATE utf8mb4_unicode_ci,
                `last_datetime` datetime DEFAULT NULL,
                `datetime` datetime NOT NULL,
                PRIMARY KEY (`pwa_id`),
                KEY `user_id` (`user_id`),
                CONSTRAINT `pwas_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
            ";
        }

        foreach($queries as $query) {
            database()->query($query);
        }

        return Plugin::save_status(self::$plugin_id, 'active');

    }

    public static function uninstall() {

        /* Run the installation process of the plugin */
        $queries = [
            "DELETE FROM `settings` WHERE `key` = 'pwa';",
        ];

        if(PRODUCT_KEY == '66pusher') {
            $queries[] = "DROP TABLE IF EXISTS `pwas`;";
        }

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
