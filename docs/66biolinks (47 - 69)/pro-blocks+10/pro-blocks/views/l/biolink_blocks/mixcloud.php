<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?> d-flex justify-content-center">
    <?php if($data->link->settings->type == 'classic'): ?>
        <iframe width="100%" height="120" class="<?= 'link-btn-' . ($data->link->settings->border_radius ?? 'rounded') . ' large' ?>" src="https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&light=<?= $data->link->settings->theme == 'light' ? '1' : '0' ?>&feed=<?= $data->embed ?>" frameborder="0" ></iframe>
    <?php elseif($data->link->settings->type == 'mini'): ?>
        <iframe width="100%" height="60" class="<?= 'link-btn-' . ($data->link->settings->border_radius ?? 'rounded') . ' large' ?>" src="https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&light=<?= $data->link->settings->theme == 'light' ? '1' : '0' ?>&feed=<?= $data->embed ?>" frameborder="0" ></iframe>
    <?php else: ?>
        <iframe width="100%" height="400" class="<?= 'link-btn-' . ($data->link->settings->border_radius ?? 'rounded') . ' large' ?>" src="https://player-widget.mixcloud.com/widget/iframe/?light=<?= $data->link->settings->theme == 'light' ? '1' : '0' ?>&feed=<?= $data->embed ?>" frameborder="0" ></iframe>
    <?php endif ?>
</div>

