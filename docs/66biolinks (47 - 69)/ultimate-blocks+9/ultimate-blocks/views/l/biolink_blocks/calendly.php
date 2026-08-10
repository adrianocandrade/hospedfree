<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?>">
    <div class="calendly-inline-widget w-100 <?= 'link-btn-' . ($data->link->settings->border_radius ?? 'rounded') . ' large' ?>" style="height: 720px" data-url="<?= $data->link->location_url ?>?hide_landing_page_details=0&hide_gdpr_banner=1"></div>
</div>

<?php if(!\Altum\Event::exists_content_type_key('javascript', 'calendly')): ?>
    <?php ob_start() ?>
    <script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
    <?php \Altum\Event::add_content(ob_get_clean(), 'javascript', 'calendly') ?>
<?php endif ?>
