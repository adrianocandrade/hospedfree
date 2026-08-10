<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?>">
    <div class="<?= 'link-btn-' . ($data->link->settings->border_radius ?? 'rounded') . ' large' ?>">
        <?= $data->link->settings->content ?>
    </div>
</div>

<?php if(!\Altum\Event::exists_content_type_key('head', 'reddit')): ?>
    <?php ob_start() ?>
    <style media="screen,print">
        [data-biolink-block-type="reddit"] iframe {
            width: 100% !important;
        }

        [data-biolink-block-type="reddit"] .link-btn-straight iframe {
            border-radius: 0 !important;
            overflow: hidden;
        }

        [data-biolink-block-type="reddit"] .link-btn-round iframe {
            border-radius: 50px !important;
            overflow: hidden;
        }

        [data-biolink-block-type="reddit"] .link-btn-round.large iframe, [data-biolink-block-type="reddit"] .link-avatar-round.large iframe {
            border-radius: 25px !important;
            overflow: hidden;
        }

        [data-biolink-block-type="reddit"] .link-btn-rounded iframe {
            border-radius: .4rem !important;
            overflow: hidden;
        }
    </style>
    <?php \Altum\Event::add_content(ob_get_clean(), 'head', 'reddit') ?>
<?php endif ?>
