<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?> d-flex justify-content-center <?= 'link-btn-' . ($data->link->settings->border_radius ?? 'rounded') . ' large' ?>">
    <blockquote class="twitter-tweet" data-media-max-width="1920"><a href="<?= $data->link->location_url ?>"></a></blockquote>
</div>

<?php if(!\Altum\Event::exists_content_type_key('javascript', 'twitter')): ?>
    <?php ob_start() ?>
    <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
    <?php \Altum\Event::add_content(ob_get_clean(), 'javascript', 'twitter') ?>
<?php endif ?>

<?php if(!\Altum\Event::exists_content_type_key('head', 'twitter')): ?>
    <?php ob_start() ?>
    <style media="screen,print">
        .link-btn-straight .twitter-tweet iframe {
            border-radius: 0 !important;
            overflow: hidden;
        }

        .link-btn-round .twitter-tweet iframe {
            border-radius: 50px !important;
            overflow: hidden;
        }

        .link-btn-round.large .twitter-tweet iframe, .link-avatar-round.large .twitter-tweet iframe {
            border-radius: 25px !important;
            overflow: hidden;
        }

        .link-btn-rounded .twitter-tweet iframe {
            border-radius: .4rem !important;
            overflow: hidden;
        }
    </style>
    <?php \Altum\Event::add_content(ob_get_clean(), 'head', 'twitter') ?>
<?php endif ?>


