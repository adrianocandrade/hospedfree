<?php

namespace Altum\Plugin;

use Altum\Plugin;

class PushNotifications {
    public static $plugin_id = 'push-notifications';

    public static function install() {
        $user_id_type = in_array(PRODUCT_KEY, ['66biolinks', '66analytics', '66socialproof', '66qrmenu']) ? 'int' : 'bigint unsigned';

        /* Generate the proper keys */
        $keys = \Minishlink\WebPush\VAPID::createVapidKeys();

        $settings = json_encode([
            'is_enabled' => true,
            'guests_is_enabled' => false,
            'public_key' => $keys['publicKey'],
            'private_key' => $keys['privateKey'],
            'ask_to_subscribe_is_enabled' => true,
            'ask_to_subscribe_delay' => (int) 3,
            'ask_to_subscribe_delay_minimum_pageviews_count' => (int) 3,
            'icon' => '',
        ]);

        /* Run the installation process of the plugin */
        $queries = [
            "INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('push_notifications', '{$settings}');",

            "CREATE TABLE `push_notifications` (
            `push_notification_id` bigint unsigned NOT NULL AUTO_INCREMENT,
            `title` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `description` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `url` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `segment` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `settings` text COLLATE utf8mb4_unicode_ci,
            `push_subscribers_ids` longtext COLLATE utf8mb4_unicode_ci,
            `sent_push_subscribers_ids` longtext COLLATE utf8mb4_unicode_ci,
            `sent_push_notifications` int unsigned DEFAULT '0',
            `total_push_notifications` int unsigned DEFAULT '0',
            `status` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `last_sent_datetime` datetime DEFAULT NULL,
            `datetime` datetime DEFAULT NULL,
            `last_datetime` datetime DEFAULT NULL,
            PRIMARY KEY (`push_notification_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

            "CREATE TABLE `push_subscribers` (
            `push_subscriber_id` bigint unsigned NOT NULL AUTO_INCREMENT,
            `user_id` {$user_id_type} DEFAULT NULL,
            `subscriber_id` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `endpoint` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `keys` varchar(512) DEFAULT NULL,
            `ip` varchar(64) DEFAULT NULL,
            `city_name` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `country_code` varchar(8) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `continent_code` varchar(8) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `os_name` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `browser_name` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `browser_language` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `device_type` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `datetime` datetime DEFAULT NULL,
            PRIMARY KEY (`push_subscriber_id`),
            UNIQUE KEY `push_subscribers_subscriber_id_idx` (`subscriber_id`) USING BTREE,
            KEY `user_id` (`user_id`),
            CONSTRAINT `push_subscribers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",
        ];

        foreach($queries as $query) {
            database()->query($query);
        }

        return Plugin::save_status(self::$plugin_id, 'active');

    }

    public static function uninstall() {

        /* Run the installation process of the plugin */
        $queries = [
            "DELETE FROM `settings` WHERE `key` = 'push_notifications';",
			"DROP TABLE IF EXISTS `push_notifications`;",
			"DROP TABLE IF EXISTS `push_subscribers`;",
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
