<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?> d-flex justify-content-center <?= 'link-btn-' . ($data->link->settings->border_radius ?? 'rounded') . ' large' ?>">
    <blockquote
            class="snapchat-embed"
            data-snapchat-embed-width="416" data-snapchat-embed-height="692"
            data-snapchat-embed-url="<?= $data->link->location_url . '/embed' ?>"
            data-snapchat-embed-style="border-radius: 40px;"
            data-test="<?= $data->link->location_url ?>"
            style="background:#C4C4C4; border:0; border-radius:40px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:416px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px); display: flex; flex-direction: column; position: relative; height:650px;"
    ></blockquote>
</div>

<?php if(!\Altum\Event::exists_content_type_key('javascript', 'snapchat')): ?>
    <?php ob_start() ?>
    <script async src="https://www.snapchat.com/embed.js"></script>
    <?php \Altum\Event::add_content(ob_get_clean(), 'javascript', 'snapchat') ?>
<?php endif ?>

<?php if(!\Altum\Event::exists_content_type_key('head', 'snapchat')): ?>
    <?php ob_start() ?>
    <style media="screen,print">
        [data-biolink-block-type="snapchat"] iframe {
            width: 100% !important;
        }

        [data-biolink-block-type="snapchat"].link-btn-straight iframe {
            border-radius: 0 !important;
            overflow: hidden;
        }

        [data-biolink-block-type="snapchat"].link-btn-round iframe {
            border-radius: 50px !important;
            overflow: hidden;
        }

        [data-biolink-block-type="snapchat"].link-btn-round.large iframe, [data-biolink-block-type="snapchat"].link-avatar-round.large iframe {
            border-radius: 25px !important;
            overflow: hidden;
        }

        [data-biolink-block-type="snapchat"].link-btn-rounded iframe {
            border-radius: .4rem !important;
            overflow: hidden;
        }
    </style>
    <?php \Altum\Event::add_content(ob_get_clean(), 'head', 'snapchat') ?>
<?php endif ?>
