<?php

use App\Admin\GoogleSafeBrowsingCredentialsValidator;
use App\Admin\PhishtankCredentialsValidator;
use App\Admin\SecurityRetentionSettingsValidator;

return [
    PhishtankCredentialsValidator::class,
    GoogleSafeBrowsingCredentialsValidator::class,
    SecurityRetentionSettingsValidator::class,
];
