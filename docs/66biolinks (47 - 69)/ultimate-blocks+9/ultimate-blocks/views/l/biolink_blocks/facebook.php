<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?>">
    <div class="fb-post-responsive <?= 'link-btn-' . ($data->link->settings->border_radius ?? 'rounded') . ' large' ?>">
        <div class="fb-post" data-href="<?= $data->link->location_url ?>" data-width="auto"></div>
    </div>
</div>

<?php if(!\Altum\Event::exists_content_type_key('javascript', 'facebook')): ?>
    <?php ob_start() ?>
    <div id="fb-root"></div>
    <script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v14.0"></script>
    <?php \Altum\Event::add_content(ob_get_clean(), 'javascript', 'facebook') ?>

    <?php ob_start() ?>
    <style>
        .fb-post-responsive {
            position: relative;
            width: 100%;
            overflow: hidden;
        }

        .fb-post-responsive .fb-post {
            max-width: 100%;
            width: 100%;
            display: block;
        }

        .fb-post-responsive iframe {
            background: white !important;
        }
    </style>
    <?php \Altum\Event::add_content(ob_get_clean(), 'head', 'facebook') ?>
<?php endif ?>


