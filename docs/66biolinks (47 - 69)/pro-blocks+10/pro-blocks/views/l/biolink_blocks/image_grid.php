<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="<?= $data->link->settings->columns == 3 ? 'col-4' : 'col-6' ?> my-2">
    <?php if($data->link->location_url): ?>
        <a href="<?= $data->link->location_url . $data->link->utm_query ?>" data-track-biolink-block-id="<?= $data->link->biolink_block_id ?>" target="<?= $data->link->settings->open_in_new_tab ? '_blank' : '_self' ?>">
    <?php endif ?>

        <div
                class="link-grid-image-wrapper link-grid-image-wrapper-columns-<?= $data->link->settings->columns ?? 2 ?> <?= 'link-btn-' . ($data->link->settings->border_radius ?? 'rounded') . ' large' ?> <?= $data->link->location_url ? ($data->biolink->settings->hover_animation ?? 'smooth') != 'false' ? 'link-hover-animation-' . ($data->biolink->settings->hover_animation ?? 'smooth') : null : null ?>"
                role="img"
                aria-label="<?= $data->link->settings->image_alt ?>"
                style="background-image: url('<?= \Altum\Uploads::get_full_url('block_images') . $data->link->settings->image ?>');border-width: <?= $data->link->settings->border_width ?>px; border-color: <?= $data->link->settings->border_color ?>; border-style: <?= $data->link->settings->border_style ?>; <?= \Altum\Link::get_processed_box_shadow_style($data->link->settings) ?>"
                data-border-width data-border-radius data-border-style data-border-color data-border-shadow
        >

            <?php if($data->link->settings->name): ?>
                <div class="link-grid-image-overlay">
                    <span class="link-grid-image-overlay-text text-truncate"><?= $data->link->settings->name ?></span>
                </div>
            <?php endif ?>

        </div>

    <?php if($data->link->location_url): ?>
    </a>
    <?php endif ?>
</div>
