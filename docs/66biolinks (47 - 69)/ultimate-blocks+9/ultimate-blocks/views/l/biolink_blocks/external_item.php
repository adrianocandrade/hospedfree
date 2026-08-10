<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?>">
    <div class="card position-relative p-3 <?= ($data->biolink->settings->hover_animation ?? 'smooth') != 'false' ? 'link-hover-animation-' . ($data->biolink->settings->hover_animation ?? 'smooth') : null ?> <?= 'link-btn-' . $data->link->settings->border_radius ?> <?= $data->link->design->card_class ?>" style="<?= $data->link->design->card_style . ';' . \Altum\Link::get_processed_box_shadow_style($data->link->settings) ?>" data-border-width data-border-radius data-border-style data-border-color data-border-shadow data-animation data-background-color>

        <?php if($data->link->location_url): ?>
            <a
                    href="<?= $data->link->location_url . $data->link->utm_query ?>"
                    data-track-biolink-block-id="<?= $data->link->biolink_block_id ?>"
                    target="<?= $data->link->settings->open_in_new_tab ? '_blank' : '_self' ?>"
                    rel="<?= $data->user->plan_settings->dofollow_is_enabled ? 'dofollow' : 'nofollow' ?>"
                    class="link-external-item-click-layer"
            ></a>
        <?php endif ?>

        <div class="row g-0">
            <?php if($data->link->settings->image): ?>
            <div class="col-md-4 d-flex justify-content-center align-items-center mb-3 mb-md-0">
                <img src="<?= $data->link->settings->image ? \Altum\Uploads::get_full_url('block_thumbnail_images') . $data->link->settings->image : null ?>" class="link-external-item-image <?= 'link-btn-' . $data->link->settings->border_radius ?>" loading="lazy" />
            </div>
            <?php endif ?>

            <div class="col-md-8">
                <div class="d-flex flex-column" style="<?= 'text-align: ' . ($data->link->settings->text_alignment ?? 'left') . ';' ?>"  data-text-alignment>
                    <span class="h5" style="<?= 'color: ' . $data->link->settings->name_color ?>" data-name data-name-color><?= $data->link->settings->name ?></span>
                    <p class="p-0" style="<?= 'color: ' . $data->link->settings->description_color ?>" data-description data-description-color><?= $data->link->settings->description ?></p>
                    <span class="h4" style="<?= 'color: ' . $data->link->settings->price_color ?>" data-price data-price-color><?= $data->link->settings->price ?></span>
                </div>
            </div>
        </div>

    </div>
</div>


