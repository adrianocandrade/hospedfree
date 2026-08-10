<?php defined('ALTUMCODE') || die() ?>

<?php if(count((array) $data->link->settings->items)): ?>
    <div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?>">
        <section class="splide <?= 'splide_' . $data->link->biolink_block_id ?>">
            <div class="splide__track">
                <ul class="splide__list">
                    <?php foreach((array) $data->link->settings->items as $key => $item): ?>
                        <li class="splide__slide">
                            <?php if($item->location_url): ?>
                                <a href="<?= $item->location_url . $data->link->utm_query ?>" data-track-biolink-block-id="<?= $data->link->biolink_block_id ?>" target="<?= $data->link->settings->open_in_new_tab ? '_blank' : '_self' ?>" class="<?= ($data->biolink->settings->hover_animation ?? 'smooth') != 'false' ? 'link-hover-animation-' . ($data->biolink->settings->hover_animation ?? 'smooth') : null ?>">
                                    <img
                                            src="<?= \Altum\Uploads::get_full_url('block_images') . $item->image ?>"
                                            class="link-image-slider-image <?= 'link-btn-' . ($data->link->settings->border_radius ?? 'rounded') . ' large' ?> <?= ($data->biolink->settings->hover_animation ?? 'smooth') != 'false' ? 'link-hover-animation-' . ($data->biolink->settings->hover_animation ?? 'smooth') : null ?>"
                                            style="<?= 'width: ' . $data->link->settings->width_height . 'rem;' . 'height: ' . $data->link->settings->width_height . 'rem;' ?>border-width: <?= $data->link->settings->border_width ?>px; border-color: <?= $data->link->settings->border_color ?>; border-style: <?= $data->link->settings->border_style ?>; <?= \Altum\Link::get_processed_box_shadow_style($data->link->settings) ?>"
                                            alt="<?= $item->image_alt ?>"
                                            loading="lazy"
                                            data-border-width data-border-radius data-border-style data-border-color data-border-shadow
                                    />
                                </a>
                            <?php else: ?>
                                <img
                                        src="<?= \Altum\Uploads::get_full_url('block_images') . $item->image ?>"
                                        class="link-image-slider-image <?= 'link-btn-' . ($data->link->settings->border_radius ?? 'rounded') . ' large' ?> <?= ($data->biolink->settings->hover_animation ?? 'smooth') != 'false' ? 'link-hover-animation-' . ($data->biolink->settings->hover_animation ?? 'smooth') : null ?>"
                                        style="<?= 'width: ' . $data->link->settings->width_height . 'rem;' . 'height: ' . $data->link->settings->width_height . 'rem;' ?>border-width: <?= $data->link->settings->border_width ?>px; border-color: <?= $data->link->settings->border_color ?>; border-style: <?= $data->link->settings->border_style ?>; <?= \Altum\Link::get_processed_box_shadow_style($data->link->settings) ?>"
                                        alt="<?= $item->image_alt ?>"
                                        loading="lazy"
                                        data-border-width data-border-radius data-border-style data-border-color data-border-shadow
                                />
                            <?php endif ?>
                        </li>
                    <?php endforeach ?>
                </ul>
            </div>
        </section>
    </div>

    <?php if(!\Altum\Event::exists_content_type_key('javascript', 'image_slider')): ?>
        <?php ob_start() ?>
        <link href="<?= ASSETS_FULL_URL . 'css/libraries/splide.min.css?v=' . PRODUCT_CODE ?>" rel="stylesheet" media="screen,print">
        <?php \Altum\Event::add_content(ob_get_clean(), 'head', 'image_slider') ?>

        <?php ob_start() ?>
        <script src="<?= ASSETS_FULL_URL . 'js/libraries/splide.min.js?v=' . PRODUCT_CODE ?>"></script>
        <?php \Altum\Event::add_content(ob_get_clean(), 'javascript', 'image_slider') ?>
    <?php endif ?>

    <?php ob_start() ?>
    <script>
        'use strict';
        document.addEventListener('DOMContentLoaded', () => {
            let splide = new Splide('.<?= 'splide_' . $data->link->biolink_block_id ?>', {
                type: 'loop',
                arrows: <?= json_encode($data->link->settings->display_arrows) ?>,
                autoplay: <?= json_encode($data->link->settings->autoplay) ?>,
                pagination: <?= json_encode($data->link->settings->display_pagination) ?>,
                autoWidth: <?= json_encode($data->link->settings->display_multiple) ?>,
                gap: '<?= $data->link->settings->gap . 'rem' ?>',
                direction: '<?= l('direction') ?>',
                interval: <?= json_encode(($data->link->settings->autoplay_interval ?? 5) * 1000) ?>
            });
            splide.mount();
        });
    </script>
    <?php \Altum\Event::add_content(ob_get_clean(), 'javascript') ?>
<?php endif ?>
