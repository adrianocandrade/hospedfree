<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 col-lg-<?= ($data->link->settings->columns ?? 1) == 1 ? '12' : '6' ?> my-<?= $data->biolink->settings->block_spacing ?? '2' ?>">
    <a href="#" data-toggle="modal" data-target="<?= '#coupon_' . $data->link->biolink_block_id ?>" class="btn btn-block btn-primary link-btn <?= ($data->biolink->settings->hover_animation ?? 'smooth') != 'false' ? 'link-hover-animation-' . ($data->biolink->settings->hover_animation ?? 'smooth') : null ?> <?= 'link-btn-' . $data->link->settings->border_radius ?> <?= $data->link->design->link_class ?>" style="<?= $data->link->design->link_style ?>" data-text-color data-border-width data-border-radius data-border-style data-border-color data-border-shadow data-animation data-background-color data-text-alignment>
        <div class="link-btn-image-wrapper <?= 'link-btn-' . $data->link->settings->border_radius ?>" <?= $data->link->settings->image ? null : 'style="display: none;"' ?>>
            <img src="<?= $data->link->settings->image ? \Altum\Uploads::get_full_url('block_thumbnail_images') . $data->link->settings->image : null ?>" class="link-btn-image" loading="lazy" />
        </div>

        <span data-icon>
            <?php if($data->link->settings->icon): ?>
                <i class="<?= $data->link->settings->icon ?> mr-1"></i>
            <?php endif ?>
        </span>

        <span data-name><?= $data->link->settings->name ?></span>
    </a>
</div>

<?php ob_start() ?>
<div class="modal fade" id="<?= 'coupon_' . $data->link->biolink_block_id ?>" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">

            <div class="modal-body">
                <div class="d-flex justify-content-between mb-3">
                    <h5 class="modal-title">
                        <i class="fas fa-fw fa-sm fa-tags text-dark mr-2"></i>
                        <?= $data->link->settings->name ?>
                    </h5>
                    <button type="button" class="close" data-dismiss="modal" title="<?= l('global.close') ?>">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                <?php if($data->link->settings->description): ?>
                <p class="text-muted"><?= $data->link->settings->description ?></p>
                <?php endif ?>

                <div class="card border-gray-200 rounded-2x">
                    <div class="card-body d-flex align-items-center justify-content-between">
                        <span class="font-weight-bold" id="<?= 'coupon_text_' . $data->link->biolink_block_id ?>"><?= $data->link->settings->coupon ?></span>

                        <div>
                            <button
                                    type="button"
                                    class="btn btn-light border"
                                    data-toggle="tooltip"
                                    title="<?= l('global.clipboard_copy') ?>"
                                    aria-label="<?= l('global.clipboard_copy') ?>"
                                    data-copy="<?= l('global.clipboard_copy') ?>"
                                    data-copied="<?= l('global.clipboard_copied') ?>"
                                    data-clipboard-target="#<?= 'coupon_text_' . $data->link->biolink_block_id ?>"
                            >
                                <i class="fas fa-fw fa-sm fa-copy"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <?php if($data->link->settings->button_text): ?>
                <form>
                    <div class="text-center mt-4">
                        <a href="<?= $data->link->location_url ?>" target="_blank" rel="nofollow noreferrer" class="btn btn-block btn-lg btn-primary" data-track-biolink-block-id="<?= $data->link->biolink_block_id ?>"><?= $data->link->settings->button_text ?></a>
                    </div>
                </form>
                <?php endif ?>
            </div>

        </div>
    </div>
</div>
<?php \Altum\Event::add_content(ob_get_clean(), 'modals') ?>

