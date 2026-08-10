<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 col-lg-<?= ($data->link->settings->columns ?? 1) == 1 ? '12' : '6' ?> my-2">
    <?php if(!empty($data->link->settings->before_image) && !empty($data->link->settings->after_image)): ?>

        <div
                id="<?= 'image_comparison_' . $data->link->biolink_block_id ?>"
                class="image-comparison-viewer <?= 'link-btn-' . ($data->link->settings->border_radius ?? 'rounded') . ' large' ?>"
                style="border-width: <?= $data->link->settings->border_width ?>px; border-color: <?= $data->link->settings->border_color ?>; border-style: <?= $data->link->settings->border_style ?>; <?= \Altum\Link::get_processed_box_shadow_style($data->link->settings) ?>"
                data-border-width data-border-radius data-border-style data-border-color data-border-shadow
        >
            <img
                    src="<?= \Altum\Uploads::get_full_url('block_images') . $data->link->settings->before_image ?>"
                    alt="<?= $data->link->settings->before_image_alt ?>"
            />

            <img
                    src="<?= \Altum\Uploads::get_full_url('block_images') . $data->link->settings->after_image ?>"
                    alt="<?= $data->link->settings->after_image_alt ?>"
            />
        </div>

    <?php endif ?>
</div>

<?php if(!\Altum\Event::exists_content_type_key('javascript', 'image_comparison')): ?>
    <?php ob_start() ?>
    <link href="<?= ASSETS_FULL_URL . 'css/libraries/image-compare-viewer.min.css?v=' . PRODUCT_CODE ?>" rel="stylesheet" media="screen,print">
    <?php \Altum\Event::add_content(ob_get_clean(), 'head', 'image_comparison') ?>

    <?php ob_start() ?>
    <script src="<?= ASSETS_FULL_URL . 'js/libraries/image-compare-viewer.min.js?v=' . PRODUCT_CODE ?>"></script>
    <?php \Altum\Event::add_content(ob_get_clean(), 'javascript', 'image_comparison') ?>
<?php endif ?>

<?php ob_start() ?>
<script>
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const element = document.getElementById('<?= 'image_comparison_' . $data->link->biolink_block_id ?>');

        const viewer = new ImageCompare(element, {
            smoothing: false,

            showLabels: <?= json_encode((!empty($data->link->settings->before_text) && !empty($data->link->settings->after_text))) ?>,
            labelOptions: {
                before: <?= json_encode($data->link->settings->before_text) ?>,
                after: <?= json_encode($data->link->settings->after_text) ?>,
                onHover: false
            },
        }).mount();
    });
</script>
<?php \Altum\Event::add_content(ob_get_clean(), 'javascript') ?>
