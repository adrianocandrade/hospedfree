<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?>" style="padding-bottom: <?= $data->link->settings->avatar_size / 2 ?>px">
    <?php if($data->link->location_url): ?>
    <a href="<?= $data->link->location_url . $data->link->utm_query ?>" data-track-biolink-block-id="<?= $data->link->biolink_block_id ?>" target="<?= $data->link->settings->open_in_new_tab ? '_blank' : '_self' ?>">
    <?php endif ?>

        <div class="d-flex flex-column align-items-center position-relative">
            <?php if($data->embed): ?>
                <div class="embed-responsive embed-responsive-16by9 <?= 'link-avatar-' . $data->link->settings->border_radius . ' large' ?>" data-border-avatar-radius>
                    <iframe class="embed-responsive-item" scrolling="no" frameborder="no" src="https://www.youtube-nocookie.com/embed/<?= $data->embed ?>?controls=<?= (int) ($data->link->settings->video_controls ?? 0) ?>&autoplay=<?= (int) ($data->link->settings->video_autoplay ?? 1) ?>&loop=<?= (int) ($data->link->settings->video_loop ?? 1) ?>&mute=<?= (int) ($data->link->settings->video_muted ?? 1) ?>&playlist=<?= $data->embed ?>" allow="<?= ($data->link->settings->video_controls ?? 0) ? 'controls;' : null ?> <?= ($data->link->settings->video_autoplay ?? 1) ? 'autoplay;' : null ?>accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
            <?php elseif($data->link->settings->video_file): ?>
                <video class="w-100 <?= 'link-avatar-' . $data->link->settings->border_radius . ' large' ?>" autoplay loop muted>
                    <source src="<?= \Altum\Uploads::get_full_url('files') . $data->link->settings->video_file ?>">
                </video>
            <?php else: ?>
            <img
                    src="<?= $data->link->settings->background ? \Altum\Uploads::get_full_url('backgrounds') . $data->link->settings->background : null ?>"
                    class="img-fluid <?= 'link-avatar-' . $data->link->settings->border_radius . ' large' ?>"
                    style="<?= $data->link->settings->background ? null : 'display: none;' ?>border-width: <?= $data->link->settings->border_width ?>px; border-color: <?= $data->link->settings->border_color ?>; border-style: <?= $data->link->settings->border_style ?>; object-fit: <?= $data->link->settings->object_fit ?>; <?= \Altum\Link::get_processed_box_shadow_style($data->link->settings) ?>" alt="<?= $data->link->settings->background_alt ?>"
                    loading="lazy"
                    data-border-avatar-radius
            />
            <?php endif ?>

            <img
                    src="<?= $data->link->settings->avatar ? \Altum\Uploads::get_full_url('avatars') . $data->link->settings->avatar : null ?>"
                    class="position-absolute link-image <?= 'link-avatar-' . $data->link->settings->border_radius ?> <?= $data->link->location_url ? ($data->biolink->settings->hover_animation ?? 'smooth') != 'false' ? 'link-hover-animation-' . ($data->biolink->settings->hover_animation ?? 'smooth') : null : null ?>"
                    style="<?= $data->link->settings->avatar ? null : 'display: none;' ?>bottom: <?= -($data->link->settings->avatar_size / 2) ?>px;width: <?= $data->link->settings->avatar_size ?>px; height: <?= $data->link->settings->avatar_size ?>px; border-width: <?= $data->link->settings->border_width ?>px; border-color: <?= $data->link->settings->border_color ?>; border-style: <?= $data->link->settings->border_style ?>; object-fit: <?= $data->link->settings->object_fit ?>; <?= \Altum\Link::get_processed_box_shadow_style($data->link->settings) ?>" alt="<?= $data->link->settings->avatar_alt ?>"
                    loading="lazy"
                    data-border-width data-border-avatar-radius data-border-style data-border-color data-border-shadow data-avatar />
        </div>

    <?php if($data->link->location_url): ?>
    </a>
    <?php endif ?>
</div>

