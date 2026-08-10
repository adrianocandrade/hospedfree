<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 col-lg-<?= ($data->link->settings->columns ?? 1) == 1 ? '12' : '6' ?> my-<?= $data->biolink->settings->block_spacing ?? '2' ?>">
    <div class="card position-relative p-3 <?= ($data->biolink->settings->hover_animation ?? 'smooth') != 'false' ? 'link-hover-animation-' . ($data->biolink->settings->hover_animation ?? 'smooth') : null ?> <?= 'link-btn-' . $data->link->settings->border_radius ?> <?= $data->link->design->card_class ?>" style="<?= $data->link->design->card_style . ';' . \Altum\Link::get_processed_box_shadow_style($data->link->settings) ?>" data-border-width data-border-radius data-border-style data-border-color data-border-shadow data-animation data-background-color>

        <?php if($data->link->location_url): ?>
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
                    class="link-external-item-click-layer"
            ></a>
        <?php endif ?>

        <div class="d-flex flex-column" data-text-alignment style="color: <?= $data->link->settings->number_color ?>;">
            <div class="h3">
                <span data-number_prefix><?= $data->link->settings->number_prefix ?></span>

                <span
                        data-number
                        data-count-up-number="<?= $data->link->settings->number ?>"
                        data-count-up-starting-number="<?= $data->link->settings->starting_number ?>"
                        data-count-up-number-animation-duration="<?= $data->link->settings->number_animation_duration * 1000 ?>"
                ><?= $data->link->settings->number ?></span>

                <span data-number_suffix><?= $data->link->settings->number_suffix ?></span>
            </div>

            <p class="mb-0 mt-2" style="color: <?= $data->link->settings->description_color ?>;" data-description data-description-color><?= nl2br($data->link->settings->description) ?></p>
        </div>
    </div>
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

<?php if(!\Altum\Event::exists_content_type_key('javascript', 'counter')): ?>
    <?php ob_start() ?>
    <script>
        'use script';

        let count_up_animation = (element, max_duration = 3000, start_on_view = false) => {
            let start_time = null;
            let has_started = false;

            let target = parseInt(element.getAttribute('data-count-up-number'), 10) || 0;
            let starting = parseInt(element.getAttribute('data-count-up-starting-number'), 10) || 0;
            let range = target - starting;

            const ease_out = progress => 1 - Math.pow(1 - progress, 8);

            const step = timestamp => {
                if (!start_time) start_time = timestamp;

                const elapsed = timestamp - start_time;
                const progress = Math.min(elapsed / max_duration, 1);
                const eased = ease_out(progress);

                const value = Math.round(starting + eased * range);
                element.textContent = nr(value, 0, false, true);

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    element.textContent = nr(target, 0, false, true);
                }
            };

            const start_animation = () => {
                if (has_started) return;
                has_started = true;
                requestAnimationFrame(step);
            };

            if (!start_on_view) {
                start_animation();
                return;
            }

            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    observer.unobserve(element);
                    start_animation();
                });
            }, { threshold: 0.3 });

            observer.observe(element);
        };

        document.querySelectorAll('[data-count-up-number]').forEach(element => {
            let duration = element.getAttribute('data-count-up-number-animation-duration') || 3000;
            count_up_animation(element, duration, true);
        });
    </script>
    <?php \Altum\Event::add_content(ob_get_clean(), 'javascript', 'counter') ?>
<?php endif ?>
