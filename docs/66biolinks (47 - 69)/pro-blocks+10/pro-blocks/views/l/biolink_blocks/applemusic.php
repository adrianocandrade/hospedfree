<?php defined('ALTUMCODE') || die() ?>

<?php
$iframe_height = 450;
$apple_music_url_path = parse_url($data->link->location_url, PHP_URL_PATH);

if (str_contains($apple_music_url_path, '/song/')) {
	$iframe_height = 175;
}
?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?>">
    <iframe class="embed-responsive-item <?= 'link-btn-' . ($data->link->settings->border_radius ?? 'rounded') . ' large' ?>" scrolling="no" frameborder="no" style="height: <?= $iframe_height ?>px;width:100%;overflow:hidden;background:transparent;" src="<?= $data->link->location_url ?>" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen="allowfullscreen"></iframe>
</div>
