<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?> d-flex justify-content-center">
    <iframe
            loading="lazy"
            style="width: 100%; height: 650px; border: none; padding: 0;margin: 0;background: white;"
            src="<?= $data->embed ?>"
            allowfullscreen="allowfullscreen"
            allow="fullscreen"
            class="embed-responsive-item <?= 'link-btn-' . ($data->link->settings->border_radius ?? 'rounded') . ' large' ?>"
    ></iframe>
</div>
