<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?> d-flex justify-content-center <?= 'link-btn-' . ($data->link->settings->border_radius ?? 'rounded') . ' large' ?>">
    <blockquote class="instagram-media" data-instgrm-permalink="<?= $data->link->location_url ?>" data-instgrm-version="13"></blockquote>
</div>

<?php if(!\Altum\Event::exists_content_type_key('javascript', 'instagram_media')): ?>
    <?php ob_start() ?>
    <script src="https://www.instagram.com/embed.js"></script>
    <?php \Altum\Event::add_content(ob_get_clean(), 'javascript', 'instagram_media') ?>
<?php endif ?>

<?php if(!\Altum\Event::exists_content_type_key('head', 'instagram_media')): ?>
    <?php ob_start() ?>
    <style media="screen,print">
        .instagram-media.instagram-media-rendered {
            width: 100% !important;
        }

        .link-btn-straight .instagram-media.instagram-media-rendered {
            border-radius: 0 !important;
            overflow: hidden;
        }

        .link-btn-round .instagram-media.instagram-media-rendered {
            border-radius: 50px !important;
            overflow: hidden;
        }

        .link-btn-round.large .instagram-media.instagram-media-rendered, .link-avatar-round.large .instagram-media.instagram-media-rendered {
            border-radius: 25px !important;
            overflow: hidden;
        }

        .link-btn-rounded .instagram-media.instagram-media-rendered {
            border-radius: .4rem !important;
            overflow: hidden;
        }
    </style>
    <?php \Altum\Event::add_content(ob_get_clean(), 'head', 'instagram_media') ?>
<?php endif ?>
