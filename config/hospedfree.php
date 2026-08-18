<?php

return [
    'retention' => [
        'outgoing_email_days' => max(
            1,
            (int) env('OUTGOING_EMAIL_LOG_RETENTION_DAYS', 7),
        ),
        'customer_communications_days' => max(
            1,
            (int) env('CUSTOMER_COMMUNICATION_RETENTION_DAYS', 365),
        ),
        'security_events_days' => max(
            1,
            (int) env('CUSTOMER_SECURITY_EVENT_RETENTION_DAYS', 365),
        ),
        'administrative_audit_days' => max(
            1,
            (int) env('ADMINISTRATIVE_SECURITY_AUDIT_RETENTION_DAYS', 365),
        ),
        'user_sessions_days' => max(
            1,
            (int) env('USER_SESSION_RETENTION_DAYS', 90),
        ),
    ],
    'personal_access_tokens' => [
        'enabled' => env('HOSPEDFREE_PERSONAL_ACCESS_TOKENS_ENABLED', true),
        'max_active' => (int) env('HOSPEDFREE_PERSONAL_ACCESS_TOKENS_MAX_ACTIVE', 10),
        'max_ttl_days' => (int) env('HOSPEDFREE_PERSONAL_ACCESS_TOKENS_MAX_TTL_DAYS', 90),
    ],
    'enabled' => env('HOSPEDFREE_HOSTING_ENABLED', true),
    'paid_enabled' => env('HOSPEDFREE_PAID_ENABLED', false),
    'legacy_ui_enabled' => env('HOSPEDFREE_LEGACY_UI_ENABLED', false),
    'legacy_links_enabled' => env('HOSPEDFREE_LEGACY_LINKS_ENABLED', false),

    'base_domain' => env('HOSPEDFREE_BASE_DOMAIN', 'hsite.top'),
    'allowed_domains' => array_values(
        array_filter(
            array_map(
                'trim',
                explode(
                    ',',
                    (string) env('HOSPEDFREE_ALLOWED_DOMAINS', 'hsite.top'),
                ),
            ),
        ),
    ),
    'domains' => [
        'cname_target' => env('HOSPEDFREE_DOMAIN_CNAME_TARGET', 'ns1.byet.org'),
        'max_reconcile_attempts' => max(
            1,
            (int) env('HOSPEDFREE_DOMAIN_MAX_RECONCILE_ATTEMPTS', 12),
        ),
    ],
    'order_payment_window_minutes' => max(
        5,
        (int) env('HOSPEDFREE_ORDER_PAYMENT_WINDOW_MINUTES', 30),
    ),
    'premium_reservation_minutes' => max(
        10,
        (int) env('HOSPEDFREE_PREMIUM_RESERVATION_MINUTES', 30),
    ),
    'checkout_attempt_grace_minutes' => max(
        15,
        (int) env('HOSPEDFREE_CHECKOUT_ATTEMPT_GRACE_MINUTES', 60),
    ),
    'reserved_subdomains' => array_values(
        array_filter(
            array_map(
                'trim',
                explode(
                    ',',
                    (string) env(
                        'HOSPEDFREE_RESERVED_SUBDOMAINS',
                        'www,mail,ftp,cpanel,webmail,admin,api,app,status,support,help,billing,ns1,ns2',
                    ),
                ),
            ),
        ),
    ),

    'provider' => [
        'driver' => env('HOSPEDFREE_PROVIDER', 'fake'),
        'timeout_seconds' => (int) env('HOSPEDFREE_PROVIDER_TIMEOUT', 15),
        'connect_timeout_seconds' => (int) env(
            'HOSPEDFREE_PROVIDER_CONNECT_TIMEOUT',
            5,
        ),
        'retries' => (int) env('HOSPEDFREE_PROVIDER_RETRIES', 2),
    ],

    'mofh' => [
        'base_url' => env(
            'HOSPEDFREE_MOFH_API_URL',
            'https://panel.myownfreehost.net/xml-api/',
        ),
        'username' => env('HOSPEDFREE_MOFH_USERNAME'),
        'password' => env('HOSPEDFREE_MOFH_PASSWORD'),
        'ftp_host' => env('HOSPEDFREE_MOFH_FTP_HOST', 'ftpupload.net'),
    ],

    'package_quotas' => [
        'mofh' => [
            'free' => [
                'disk_mb' => 5120,
                'bandwidth_mb' => 50000,
                'domains' => 2,
                'databases' => 2,
                'ad_free' => true,
            ],
            'pro' => [
                'disk_mb' => 10240,
                'bandwidth_mb' => 150000,
                'domains' => 5,
                'databases' => 10,
                'ad_free' => true,
            ],
        ],
    ],

    'tools' => [
        'control_panel_url' => env('HOSPEDFREE_CONTROL_PANEL_URL'),
        'webftp_url' => env('HOSPEDFREE_WEBFTP_URL'),
        'installer_url' => env('HOSPEDFREE_INSTALLER_URL'),
        'installer_allowed_hosts' => array_values(
            array_filter(
                array_map(
                    'trim',
                    explode(
                        ',',
                        (string) env(
                            'HOSPEDFREE_INSTALLER_ALLOWED_HOSTS',
                            '',
                        ),
                    ),
                ),
            ),
        ),
        'file_manager_url' => env('HOSPEDFREE_FILE_MANAGER_URL'),
    ],

    'file_manager' => [
        'enabled' => env('HOSPEDFREE_FILE_MANAGER_ENABLED', false),
        'external_fallback' => env(
            'HOSPEDFREE_FILE_MANAGER_EXTERNAL_FALLBACK',
            false,
        ),
        'host' => env(
            'HOSPEDFREE_FILE_MANAGER_HOST',
            env('HOSPEDFREE_MOFH_FTP_HOST'),
        ),
        'port' => (int) env('HOSPEDFREE_FILE_MANAGER_PORT', 21),
        'ssl' => (bool) env('HOSPEDFREE_FILE_MANAGER_SSL', true),
        'passive' => (bool) env('HOSPEDFREE_FILE_MANAGER_PASSIVE', true),
        'utf8' => (bool) env('HOSPEDFREE_FILE_MANAGER_UTF8', false),
        'root' => env('HOSPEDFREE_FILE_MANAGER_ROOT', '/'),
        'allow_zip_operations' => env(
            'HOSPEDFREE_FILE_MANAGER_ALLOW_ZIP_OPERATIONS',
            true,
        ),
        'editor_theme' => env('HOSPEDFREE_FILE_MANAGER_EDITOR_THEME', 'auto'),
        'code_beautify' => env('HOSPEDFREE_FILE_MANAGER_CODE_BEAUTIFY', true),
        'code_suggestion' => env(
            'HOSPEDFREE_FILE_MANAGER_CODE_SUGGESTION',
            true,
        ),
        'auto_complete' => env('HOSPEDFREE_FILE_MANAGER_AUTO_COMPLETE', true),
        'max_upload_bytes' => (int) env(
            'HOSPEDFREE_FILE_MANAGER_MAX_UPLOAD_BYTES',
            25_165_824,
        ),
        'max_download_bytes' => (int) env(
            'HOSPEDFREE_FILE_MANAGER_MAX_DOWNLOAD_BYTES',
            25_165_824,
        ),
        'max_editable_bytes' => (int) env(
            'HOSPEDFREE_FILE_MANAGER_MAX_EDITABLE_BYTES',
            1_048_576,
        ),
        'max_archive_entries' => (int) env(
            'HOSPEDFREE_FILE_MANAGER_MAX_ARCHIVE_ENTRIES',
            500,
        ),
        'max_archive_source_bytes' => (int) env(
            'HOSPEDFREE_FILE_MANAGER_MAX_ARCHIVE_SOURCE_BYTES',
            25_165_824,
        ),
        'max_archive_bytes' => (int) env(
            'HOSPEDFREE_FILE_MANAGER_MAX_ARCHIVE_BYTES',
            25_165_824,
        ),
        'max_extract_entries' => (int) env(
            'HOSPEDFREE_FILE_MANAGER_MAX_EXTRACT_ENTRIES',
            500,
        ),
        'max_extract_bytes' => (int) env(
            'HOSPEDFREE_FILE_MANAGER_MAX_EXTRACT_BYTES',
            50_331_648,
        ),
        'editable_extensions' => [
            'txt',
            'html',
            'htm',
            'css',
            'js',
            'json',
            'xml',
            'md',
            'php',
            'env',
            'ini',
            'conf',
            'htaccess',
        ],
    ],

    'site_builder' => [
        'enabled' => env('HOSPEDFREE_SITE_BUILDER_ENABLED', false),
        'provider' => env('HOSPEDFREE_SITE_BUILDER_PROVIDER', 'sitepro'),
        'endpoint' => env('HOSPEDFREE_SITE_BUILDER_ENDPOINT'),
        'allowed_redirect_hosts' => array_values(
            array_filter(
                array_map(
                    fn(string $host) => strtolower(trim($host)),
                    explode(
                        ',',
                        (string) env(
                            'HOSPEDFREE_SITE_BUILDER_ALLOWED_HOSTS',
                            '',
                        ),
                    ),
                ),
            ),
        ),
        'username' => env('HOSPEDFREE_SITE_BUILDER_USERNAME'),
        'password' => env('HOSPEDFREE_SITE_BUILDER_PASSWORD'),
    ],

    'ssl' => [
        'enabled' => env('HOSPEDFREE_SSL_ENABLED', false),
        'provider' => env('HOSPEDFREE_SSL_PROVIDER', 'manual'),
        'maintenance_enabled' => env(
            'HOSPEDFREE_SSL_MAINTENANCE_ENABLED',
            false,
        ),
        'renew_before_days' => (int) env(
            'HOSPEDFREE_SSL_RENEW_BEFORE_DAYS',
            30,
        ),
        'reconcile_after_hours' => (int) env(
            'HOSPEDFREE_SSL_RECONCILE_AFTER_HOURS',
            24,
        ),
    ],

    'cloudflare' => [
        'enabled' => env('HOSPEDFREE_CLOUDFLARE_ENABLED', false),
        'api_token' => env('HOSPEDFREE_CLOUDFLARE_API_TOKEN'),
        'account_id' => env('HOSPEDFREE_CLOUDFLARE_ACCOUNT_ID'),
        'zone_id' => env('HOSPEDFREE_CLOUDFLARE_ZONE_ID'),
    ],

    'acme' => [
        'enabled' => env('HOSPEDFREE_ACME_ENABLED', false),
        'openssl_config' => env('HOSPEDFREE_ACME_OPENSSL_CONFIG'),
        'directory_url' => env(
            'HOSPEDFREE_ACME_DIRECTORY_URL',
            'https://acme-staging-v02.api.letsencrypt.org/directory',
        ),
        'email' => env('HOSPEDFREE_ACME_EMAIL'),
        'allowed_directory_hosts' => array_values(
            array_filter(
                array_map(
                    'trim',
                    explode(
                        ',',
                        (string) env(
                            'HOSPEDFREE_ACME_ALLOWED_DIRECTORY_HOSTS',
                            'acme-staging-v02.api.letsencrypt.org,acme-v02.api.letsencrypt.org',
                        ),
                    ),
                ),
            ),
        ),
    ],

    'vistapanel' => [
        'enabled' => env('HOSPEDFREE_VISTAPANEL_TOOLS_ENABLED', false),
        'cpanel_url' => env('HOSPEDFREE_VISTAPANEL_URL'),
        'login_seed' => env(
            'HOSPEDFREE_VISTAPANEL_LOGIN_SEED',
            '567811917014474432',
        ),
    ],
];
