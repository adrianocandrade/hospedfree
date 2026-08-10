<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?> d-flex justify-content-center <?= 'link-btn-' . ($data->link->settings->border_radius ?? 'rounded') . ' large' ?>">
    <a data-pin-do="embedUser" data-pin-board-width="auto" data-pin-scale-height="280" data-pin-scale-width="80" href="<?= $data->link->location_url ?>"></a>
</div>

<?php if(!\Altum\Event::exists_content_type_key('head', 'pinterest_profile')): ?>
    <?php ob_start() ?>
    <style media="screen,print">
        [data-pin-href] {
            max-width: none !important;
        }

        .link-btn-straight [data-pin-href] {
            border-radius: 0 !important;
            overflow: hidden;
        }

        .link-btn-round [data-pin-href] {
            border-radius: 50px !important;
            overflow: hidden;
        }

        .link-btn-round.large [data-pin-href], .link-avatar-round.large [data-pin-href] {
            border-radius: 25px !important;
            overflow: hidden;
        }

        .link-btn-rounded [data-pin-href] {
            border-radius: .4rem !important;
            overflow: hidden;
        }
    </style>
    <?php \Altum\Event::add_content(ob_get_clean(), 'head', 'pinterest_profile') ?>
<?php endif ?>

<?php if(!\Altum\Event::exists_content_type_key('javascript', 'pinterest_profile')): ?>
    <?php ob_start() ?>
    <script async defer src="https://assets.pinterest.com/js/pinit.js"></script>
    <?php \Altum\Event::add_content(ob_get_clean(), 'javascript', 'pinterest_profile') ?>
<?php endif ?>
