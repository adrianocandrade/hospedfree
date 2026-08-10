<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?> <?= 'link-btn-' . ($data->link->settings->border_radius ?? 'rounded') . ' large' ?>">
    <?= $data->link->settings->html ?>
</div>

<?php if(!\Altum\Event::exists_content_type_key('head', 'bluesky_post')): ?>
    <?php ob_start() ?>
    <style media="screen,print">
        .bluesky-embed {
            margin: 0 auto !important;
        }

        .link-btn-straight .bluesky-embed {
            border-radius: 0 !important;
            overflow: hidden;
        }

        .link-btn-round .bluesky-embed {
            border-radius: 50px !important;
            overflow: hidden;
        }

        .link-btn-round.large .bluesky-embed, .link-avatar-round.large .bluesky-embed {
            border-radius: 25px !important;
            overflow: hidden;
        }

        .link-btn-rounded .bluesky-embed {
            border-radius: .4rem !important;
            overflow: hidden;
        }
    </style>
    <?php \Altum\Event::add_content(ob_get_clean(), 'head', 'bluesky_post') ?>
<?php endif ?>
