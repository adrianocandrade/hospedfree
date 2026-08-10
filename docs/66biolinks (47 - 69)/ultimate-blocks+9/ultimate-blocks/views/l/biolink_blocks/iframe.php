<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?>">
    <iframe
            src="<?= $data->link->location_url ?>"
            style="width: 100%; height: 500px; object-fit: contain; border-width: <?= $data->link->settings->border_width ?>px; border-color: <?= $data->link->settings->border_color ?>; border-style: <?= $data->link->settings->border_style ?>; <?= \Altum\Link::get_processed_box_shadow_style($data->link->settings) ?>"
            class="w-100 <?= 'link-btn-' . ($data->link->settings->border_radius ?? 'rounded') . ' large' ?>"
            loading="lazy"
            data-border-width data-border-radius data-border-style data-border-color data-border-shadow
    ></iframe>
</div>
