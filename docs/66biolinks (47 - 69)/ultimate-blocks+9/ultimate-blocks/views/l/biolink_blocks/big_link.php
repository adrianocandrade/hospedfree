<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 col-lg-<?= ($data->link->settings->columns ?? 1) == 1 ? '12' : '6' ?> my-<?= $data->biolink->settings->block_spacing ?? '2' ?>">
    <a
        <?php if($data->link->settings->sensitive_content): ?>
            href="#"
            data-toggle="modal"
            data-target="<?= '#link_sensitive_content_' . $data->link->biolink_block_id ?>"
        <?php else: ?>
            href="<?= $data->link->location_url . $data->link->utm_query ?>"
            data-track-biolink-block-id="<?= $data->link->biolink_block_id ?>"
            target="<?= $data->link->settings->open_in_new_tab ? '_blank' : '_self' ?>"
            rel="<?= $data->user->plan_settings->dofollow_is_enabled ? 'dofollow' : 'nofollow' ?>"
        <?php endif ?>

            class="btn btn-block btn-primary link-btn link-big-btn <?= ($data->biolink->settings->hover_animation ?? 'smooth') != 'false' ? 'link-hover-animation-' . ($data->biolink->settings->hover_animation ?? 'smooth') : null ?> <?= 'link-btn-' . $data->link->settings->border_radius ?> <?= $data->link->design->link_class ?> d-flex align-items-center"
            style="<?= $data->link->design->link_style ?>"
            data-text-color data-border-width data-border-radius data-border-style data-border-color data-border-shadow data-animation data-background-color data-text-alignment
    >
        <div class="link-big-btn-image-wrapper <?= 'link-btn-' . $data->link->settings->border_radius ?>" <?= $data->link->settings->image ? null : 'style="display: none;"' ?>>
            <img src="<?= $data->link->settings->image ? \Altum\Uploads::get_full_url('block_thumbnail_images') . $data->link->settings->image : null ?>" class="link-big-btn-image" loading="lazy" />
        </div>

        <?php
        if (!empty($data->link->settings->image) && !empty($data->link->settings->icon)) {
            $width = '75%';
        } elseif (!empty($data->link->settings->image) || !empty($data->link->settings->icon)) {
            $width = '85%';
        } else {
            $width = '100%';
        }
        $margin_left = !empty($data->link->settings->image) ? '66px' : '0';
        $padding = !empty($data->link->settings->image) ? '0 1rem' : '0';
        ?>

        <div class="link-big-content-wrapper d-flex flex-column" <?= 'style="width: ' . $width . ' !important;margin-left: ' . $margin_left . ' !important; padding: ' . $padding . '"' ?>>
            <span class="h5" data-name><?= $data->link->settings->name ?></span>
            <small style="color: <?= $data->link->settings->description_color ?>;" data-description data-description-color><?= nl2br($data->link->settings->description) ?></small>
        </div>

        <?php if($data->link->settings->icon): ?>
        <div class="link-big-icon-wrapper text-center" data-icon>
            <i class="<?= $data->link->settings->icon ?>"></i>
        </div>
        <?php endif ?>
    </a>
</div>


<?php if($data->link->settings->sensitive_content): ?>
    <?php ob_start() ?>
    <div class="modal fade" id="<?= 'link_sensitive_content_' . $data->link->biolink_block_id ?>" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">

                <div class="modal-body">
                    <div class="d-flex justify-content-between mb-3">
                        <h5 class="modal-title">
                            <?= l('link.sensitive_content.header') ?>
                        </h5>
                        <button type="button" class="close" data-dismiss="modal" title="<?= l('global.close') ?>">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>

                    <p class="text-muted"><?= l('link.sensitive_content.subheader') ?></p>

                    <div class="row mt-4">
                        <div class="col-6">
                            <button type="button" class="btn btn-block btn-secondary" data-dismiss="modal"><?= l('global.close') ?></button>
                        </div>

                        <div class="col-6">
                            <a href="<?= $data->link->location_url . $data->link->utm_query ?>" data-track-biolink-block-id="<?= $data->link->biolink_block_id ?>" target="<?= $data->link->settings->open_in_new_tab ? '_blank' : '_self' ?>" rel="<?= $data->user->plan_settings->dofollow_is_enabled ? 'dofollow' : 'nofollow' ?>" class="btn btn-block btn-primary">
                                <?= l('link.sensitive_content.button') ?> <i class="fas fa-fw fa-sm fa-external-link-alt ml-1"></i>
                            </a>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
    <?php \Altum\Event::add_content(ob_get_clean(), 'modals') ?>
<?php endif ?>
