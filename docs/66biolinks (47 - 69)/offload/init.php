<?php

/* Load all the related plugin files */
require_once \Altum\Plugin::get('offload')->path . 'Offload.php';

if(!in_array(PRODUCT_KEY, ['66aix', '66biolinks', '66transfer'])) {
    require_once \Altum\Plugin::get('offload')->path . 'aws/aws-autoloader.php';
}
