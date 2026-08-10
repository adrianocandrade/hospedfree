<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?> d-flex justify-content-center">
    <div style="position: relative; width: 100%; height: 0; padding-top: 141.4141%; padding-bottom: 0; overflow: hidden; will-change: transform;">
    <iframe
            loading="lazy"
            style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; border: none; padding: 0;margin: 0;"
            src="<?= $data->link->location_url ?>?embed"
            allowfullscreen="allowfullscreen"
            allow="fullscreen"
            class="embed-responsive-item <?= 'link-btn-' . ($data->link->settings->border_radius ?? 'rounded') . ' large' ?>"
    ></iframe>
    </div>
</div>
