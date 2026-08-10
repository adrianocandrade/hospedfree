<?php defined('ALTUMCODE') || die() ?>

<?php $has_expired = (new DateTime($data->link->settings->counter_end_date)) <= new DateTime(); ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?>">
    <?php if($has_expired): ?>
        <div class="card <?= 'link-btn-' . $data->link->settings->border_radius . ' large' ?>" style="<?= 'border-width: ' . ($data->link->settings->border_width ?? '1') . 'px;' . 'border-color: ' . (empty($data->link->settings->border_color) ? 'transparent' : $data->link->settings->border_color) . ';' . 'border-style: ' . ($data->link->settings->border_style ?? 'solid') . ';' . 'background: ' . ($data->link->settings->background_color ?? 'transparent') . ';' . \Altum\Link::get_processed_box_shadow_style($data->link->settings) ?>" data-border-width data-border-radius data-border-style data-border-color data-border-shadow data-background-color>
            <div class="card-body text-break" style="color: <?= $data->link->settings->text_color ?>;" data-text-color>

                <div class="ql-content">
                    <?= $data->link->settings->expired_text ?? 'sugi' ?>
                </div>

            </div>
        </div>
    <?php else: ?>
        <div class="d-flex align-items-center justify-content-center">
            <div id="<?= 'countdown_' . $data->link->biolink_block_id ?>" class="countdown simply-countdown" data-end-date="<?= (new DateTime($data->link->settings->counter_end_date))->getTimestamp() ?>"></div>
        </div>
    <?php endif ?>
</div>

<?php if(!\Altum\Event::exists_content_type_key('javascript', 'countdown')): ?>
    <?php ob_start() ?>
    <link href="<?= ASSETS_FULL_URL . 'css/libraries/simplyCountdown.default.css?v=' . PRODUCT_CODE ?>" rel="stylesheet" media="screen,print">

    <style>
        .simply-countdown > .simply-section {
            <?= \Altum\Link::get_processed_box_shadow_style($data->link->settings) ?>
            background: <?= $data->link->settings->background_color ?> !important;
            border-color: <?= $data->link->settings->border_color ?> !important;
            border-width: <?= $data->link->settings->border_width ?>px !important;
            border-style: <?= $data->link->settings->border_style ?> !important;
        }

        .simply-countdown > .simply-section .simply-amount {
            color: <?= $data->link->settings->text_color ?> !important;
        }

        .simply-countdown > .simply-section .simply-word {
            color: <?= $data->link->settings->description_color ?> !important;
        }
    </style>
    <?php \Altum\Event::add_content(ob_get_clean(), 'head', 'countdown') ?>

    <?php ob_start() ?>
    <script src="<?= ASSETS_FULL_URL . 'js/libraries/simplyCountdown.min.js?v=' . PRODUCT_CODE ?>"></script>
    <?php \Altum\Event::add_content(ob_get_clean(), 'javascript', 'countdown') ?>
<?php endif ?>

<?php ob_start() ?>
<script>
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        let countdown_element = document.querySelector('<?= '#countdown_' . $data->link->biolink_block_id ?>');

        if(!countdown_element) return;

        let end_timestamp = parseInt(countdown_element.getAttribute('data-end-date')) * 1000;
        let end_date = new Date(end_timestamp);

        simplyCountdown('<?= '#countdown_' . $data->link->biolink_block_id ?>', {
            year: end_date.getFullYear(),
            month: end_date.getMonth() + 1,
            day: end_date.getDate(),
            hours: end_date.getHours(),
            minutes: end_date.getMinutes(),
            seconds: end_date.getSeconds(),

            words: {
                days: {
                    root: <?= json_encode(l('global.date.days')) ?>,
                    lambda: (root) => root
                },
                hours: {
                    root: <?= json_encode(l('global.date.hours')) ?>,
                    lambda: (root) => root
                },
                minutes: {
                    root: <?= json_encode(l('global.date.minutes')) ?>,
                    lambda: (root) => root
                },
                seconds: {
                    root: <?= json_encode(l('global.date.seconds')) ?>,
                    lambda: (root) => root
                }
            },

            plural: false,
            inline: false,
            enableUtc: false,
            refresh: 1000,
            zeroPad: false,
            removeZeroUnits: false,
            countUp: false
        });
    });
</script>
<?php \Altum\Event::add_content(ob_get_clean(), 'javascript') ?>
