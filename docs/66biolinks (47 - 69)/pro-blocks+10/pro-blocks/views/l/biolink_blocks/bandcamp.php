<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?> d-flex justify-content-center">
    <?php
    // small defaults
    $height = 42;
    $track_list = '';
    $artwork = $data->link->settings->display_artwork ? '' : '/artwork=none';

    if($data->link->settings->type == 'large') {
        $track_list = '/tracklist=none';
        $height = 120;

		$artwork = $data->link->settings->display_artwork ? '/artwork=small' : '/artwork=none';

        if($data->link->settings->display_track_list) {
			$track_list = '';
			$height = 750;
		}
    }
    ?>
    <iframe
            loading="lazy"
            style="width: 100%; height: <?= $height ?>px; border: none; padding: 0;margin: 0;"
            src="https://bandcamp.com/EmbeddedPlayer/<?= $data->link->settings->embed_type ?>=<?= $data->link->settings->embed ?>/size=<?= $data->link->settings->type == 'small' ? 'small' : 'large' ?>/bgcol=<?= str_replace('#', '', $data->link->settings->background_color) ?>/linkcol=<?= str_replace('#', '', $data->link->settings->text_color) ?><?= $track_list ?><?= $artwork ?>/transparent=true/"
            allowfullscreen="allowfullscreen"
            allow="fullscreen"
            class="embed-responsive-item <?= 'link-btn-' . ($data->link->settings->border_radius ?? 'rounded') . ' large' ?>"
    ></iframe>
</div>

