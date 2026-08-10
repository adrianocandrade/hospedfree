<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?>">
    <script async src="https://telegram.org/js/telegram-widget.js?22" data-telegram-post="<?= $data->embed ?>" data-width="100%"></script>
</div>

<?php if(!\Altum\Event::exists_content_type_key('head', 'telegram')): ?>
    <?php ob_start() ?>
    <style>
        iframe[id^="telegram-post"] {
            color-scheme: none !important;
        }
    </style>
    <?php \Altum\Event::add_content(ob_get_clean(), 'head', 'telegram') ?>
<?php endif ?>
