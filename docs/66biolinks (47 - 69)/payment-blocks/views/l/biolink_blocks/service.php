<?php defined('ALTUMCODE') || die() ?>

<?php $cryptocurrencies = require APP_PATH . 'includes/plisio_cryptocurrencies.php' ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 col-lg-<?= ($data->link->settings->columns ?? 1) == 1 ? '12' : '6' ?> my-<?= $data->biolink->settings->block_spacing ?? '2' ?>">
    <a href="#" data-toggle="modal" data-target="<?= '#service_' . $data->link->biolink_block_id ?>" class="btn btn-block btn-primary link-btn <?= ($data->biolink->settings->hover_animation ?? 'smooth') != 'false' ? 'link-hover-animation-' . ($data->biolink->settings->hover_animation ?? 'smooth') : null ?> <?= 'link-btn-' . $data->link->settings->border_radius ?> <?= $data->link->design->link_class ?>" style="<?= $data->link->design->link_style ?>" data-text-color data-border-width data-border-radius data-border-style data-border-color data-border-shadow data-animation data-background-color data-text-alignment>
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
<div class="modal fade" id="<?= 'service_' . $data->link->biolink_block_id ?>" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">

            <div class="modal-body">
                <div class="d-flex justify-content-between mb-3">
                    <h5 class="modal-title">
                        <?= $data->link->settings->title ?>
                    </h5>
                    <button type="button" class="close" data-dismiss="modal" title="<?= l('global.close') ?>">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                <form id="<?= 'service_form_' . $data->link->biolink_block_id ?>" method="post" role="form" enctype="multipart/form-data">
                    <input type="hidden" name="token" value="<?= \Altum\Csrf::get() ?>" required="required" />
                    <input type="hidden" name="biolink_block_id" value="<?= $data->link->biolink_block_id ?>" />

                    <div class="notification-container"></div>

                    <p class="text-muted"><?= $data->link->settings->description ?></p>

                    <div class="form-group">
                        <label for="<?= 'service_form_price_' . $data->link->biolink_block_id ?>"><?= l('biolink_product.price') ?></label>
                        <div class="input-group">
                            <input id="<?= 'service_form_price_' . $data->link->biolink_block_id ?>" type="number" class="form-control form-control-lg" name="price" min="<?= $data->link->settings->minimum_price ?? 0 ?>" value="<?= $data->link->settings->price ?>" <?= $data->link->settings->allow_custom_price ? null : 'readonly="readonly"' ?> required="required" />
                            <div class="input-group-append">
                                <span class="input-group-text"><?= $data->link->settings->currency ?></span>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="<?= 'service_form_email_' . $data->link->biolink_block_id ?>"><?= l('global.email') ?></label>
                        <input type="email" name="email" id="<?= 'service_form_email_' . $data->link->biolink_block_id ?>" class="form-control form-control-lg" maxlength="320" placeholder="<?= l('global.email_placeholder') ?>" />
                        <small class="form-text text-muted"><?= l('biolink_service.email_help') ?></small>
                    </div>

                    <div class="form-group">
                        <label for="<?= 'service_form_message_' . $data->link->biolink_block_id ?>"><?= l('biolink_service.message') ?></label>
                        <textarea name="message" id="<?= 'service_form_message_' . $data->link->biolink_block_id ?>" class="form-control form-control-lg" maxlength="256"></textarea>
                    </div>

                    <?php $has_plisio = false ?>
                    <?php $has_plisio_whitelabel = false ?>

                    <div class="row form-group">
                        <?php $payment_processors_count = count($data->link->settings->payment_processors_ids); ?>

                        <?php foreach($data->link->settings->payment_processors_ids as $payment_processor_id): ?>
                            <?php if($data->payment_processors[$payment_processor_id]->processor == 'plisio') $has_plisio = $payment_processor_id ?>
                            <?php if($data->payment_processors[$payment_processor_id]->processor == 'plisio_whitelabel') $has_plisio_whitelabel = $payment_processor_id ?>
                            <?php if($data->payment_processors[$payment_processor_id]->processor == 'offline_payment') $has_offline_payment = $payment_processor_id ?>

                            <label class="col-<?= $payment_processors_count <= 2 ? '12' : '6' ?> my-2 custom-radio-box">
                                <input type="radio" name="payment_processor_id" value="<?= $payment_processor_id ?>" data-processor="<?= $data->payment_processors[$payment_processor_id]->processor ?>" class="custom-control-input" required="required">

                                <div class="card">
                                    <div class="card-body d-flex align-items-center justify-content-center">
                                        <i class="<?= $data->payment_processors[$payment_processor_id]->icon ?> fa-fw mr-2" style="color: <?= $data->payment_processors[$payment_processor_id]->color ?>"></i>
                                        <span class="font-weight-bold"><?= l('pay.custom_plan.' . $data->payment_processors[$payment_processor_id]->processor) ?></span>
                                    </div>
                                </div>
                            </label>
                        <?php endforeach ?>
                    </div>

                    <?php if($has_plisio): ?>
                        <div class="row form-group d-none" data-payment-processor-custom-container data-plisio-container>
                            <?php foreach($cryptocurrencies as $token => $cryptocurrency): ?>
                                <?php if(!in_array($token, settings()->plisio->accepted_cryptocurrencies ?? []) || !in_array($token, $data->payment_processors[$has_plisio]->settings->accepted_cryptocurrencies ?? [])) continue; ?>

                                <label class="col-6 my-2 custom-radio-box">
                                    <input type="radio" name="cryptocurrency" value="<?= $token ?>" class="custom-control-input" <?= $token == $data->payment_processors[$has_plisio_whitelabel]->settings->default_cryptocurrency ? 'checked="checked"' : null ?>>

                                    <div class="card">
                                        <div class="card-body d-flex align-items-center">
                                            <img src="<?= ASSETS_FULL_URL . 'images/cryptocurrencies/' . $cryptocurrency['icon'] ?>" class="cryptocurrency-icon mr-3" />

                                            <div>
                                                <div class="card-title mb-0"><?= $cryptocurrency['name'] ?></div>
                                                <span class="small text-muted"><?= $cryptocurrency['code'] ?></span>
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            <?php endforeach ?>
                        </div>
                    <?php endif ?>

                    <?php if($has_plisio_whitelabel): ?>
                        <div class="row form-group d-none" data-payment-processor-custom-container data-plisio-whitelabel-container>
                            <?php foreach($cryptocurrencies as $token => $cryptocurrency): ?>
                                <?php if(!in_array($token, settings()->plisio_whitelabel->accepted_cryptocurrencies ?? []) || empty($data->payment_processors[$has_plisio_whitelabel]->settings->{$token . '_wallet'})) continue; ?>

                                <label class="col-6 my-2 custom-radio-box">
                                    <input type="radio" name="cryptocurrency" value="<?= $token ?>" class="custom-control-input" <?= $token == $data->payment_processors[$has_plisio_whitelabel]->settings->default_cryptocurrency ? 'checked="checked"' : null ?>>

                                    <div class="card">
                                        <div class="card-body d-flex align-items-center">
                                            <img src="<?= ASSETS_FULL_URL . 'images/cryptocurrencies/' . $cryptocurrency['icon'] ?>" class="cryptocurrency-icon mr-3" />

                                            <div>
                                                <div class="card-title mb-0"><?= $cryptocurrency['name'] ?></div>
                                                <span class="small text-muted"><?= $cryptocurrency['code'] ?></span>
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            <?php endforeach ?>
                        </div>
                    <?php endif ?>

                    <?php if($has_offline_payment): ?>
                        <div class="form-group d-none" data-payment-processor-custom-container data-offline-payment-container>
                            <label><?= l('biolink_product.offline_payment.instructions') ?></label>
                            <div class="card"><div class="card-body"><?= $data->payment_processors[$has_offline_payment]->settings->instructions ?></div></div>
                        </div>

                        <div class="form-group d-none" data-payment-processor-custom-container data-offline-payment-container>
                            <div class="form-group">
                                <label for="<?= 'product_form_proof_' . $data->link->biolink_block_id ?>"><?= l('biolink_product.offline_payment.proof') ?></label>
                                <input type="file" name="offline_payment_proof" id="<?= 'product_form_proof_' . $data->link->biolink_block_id ?>" accept="<?= \Altum\Uploads::get_whitelisted_file_extensions_accept('payment_processors_offline_payment_proofs') ?>" class="form-control-file altum-file-input" required="required" />
                                <small class="form-text text-muted"><?= sprintf(l('global.accessibility.whitelisted_file_extensions'), \Altum\Uploads::get_whitelisted_file_extensions_accept('payment_processors_offline_payment_proofs'))  . ' ' . sprintf(l('global.accessibility.file_size_limit'), settings()->links->offline_payment_proof_size_limit) ?></small>
                            </div>
                        </div>
                    <?php endif ?>

                    <div class="text-center mt-4">
                        <button type="submit" name="submit" class="btn btn-block btn-lg btn-primary" data-is-ajax><?= l('biolink_service.submit') ?></button>
                    </div>
                </form>
            </div>

        </div>
    </div>
</div>

<div class="modal fade" id="<?= 'service_thank_you_' . $data->link->biolink_block_id ?>" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">

            <div class="modal-header">
                <h5 class="modal-title"><?= $data->link->settings->thank_you_title ?></h5>
                <button type="button" class="close" data-dismiss="modal" title="<?= l('global.close') ?>">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>

            <div class="modal-body">
                <p><?= $data->link->settings->thank_you_description ?></p>
            </div>

        </div>
    </div>
</div>
<?php \Altum\Event::add_content(ob_get_clean(), 'modals') ?>


<?php ob_start() ?>
<script>
    'use strict';

    document.querySelectorAll('<?= '#service_' . $data->link->biolink_block_id ?> [data-processor]').forEach(element => element.addEventListener('click', event => {
        let processor = event.currentTarget.dataset.processor;

        document.querySelectorAll('<?= '#service_' . $data->link->biolink_block_id ?> [data-payment-processor-custom-container]').forEach(element => {
            element.classList.add('d-none');

            /* Offline payment */
            let offline_payment_input = element.querySelector('input[name="offline_payment_proof"]');

            if(offline_payment_input) {
                offline_payment_input.removeAttribute('required');
            }
        });

        if(processor === 'plisio') {
            document.querySelector('<?= '#service_' . $data->link->biolink_block_id ?> [data-plisio-container]').classList.remove('d-none');
        }
        else if(processor === 'plisio_whitelabel') {
            document.querySelector('<?= '#service_' . $data->link->biolink_block_id ?> [data-plisio-whitelabel-container]').classList.remove('d-none');
        }
        else if(processor === 'offline_payment') {
            document.querySelectorAll('<?= '#service_' . $data->link->biolink_block_id ?> [data-offline-payment-container]').forEach(offline_payment_element => {
                let offline_payment_input = offline_payment_element.querySelector('input[name="offline_payment_proof"]');

                if(offline_payment_input) {
                    offline_payment_input.setAttribute('required', 'required');
                }

                offline_payment_element.classList.remove('d-none')
            });
        }
    }));

    /* Set default */
    document.querySelector('<?= '#service_' . $data->link->biolink_block_id ?> [name="payment_processor_id"]').click();
</script>
<?php \Altum\Event::add_content(ob_get_clean(), 'javascript') ?>


<?php if(!\Altum\Event::exists_content_type_key('javascript', 'service')): ?>
    <?php ob_start() ?>
    <script>
        'use strict';

        /* Modal handling */
        $('div[id^="service_"]').on('show.bs.modal', event => {
            let first_payment_processor = event.currentTarget.querySelector('input[name="payment_processor_id"]');

            if(first_payment_processor) {
                first_payment_processor.click();
            }
        });

        /* Form handling */
        $('form[id^="service_"]').on('submit', event => {
            let notification_container = event.currentTarget.querySelector('.notification-container');
            notification_container.innerHTML = '';
            pause_submit_button(event.currentTarget.querySelector('[type="submit"][name="submit"]'));

            let form = event.currentTarget;
            let form_data = new FormData(form);

            $.ajax({
                type: 'POST',
                url: `${site_url}l/link/payment_generator`,
                data: form_data,
                dataType: 'json',
                processData: false,
                contentType: false,
                success: (data) => {
                    enable_submit_button(event.currentTarget.querySelector('[type="submit"][name="submit"]'));

                    if(data.status == 'error') {
                        display_notifications(data.message, 'error', notification_container);
                    } else if(data.status == 'success') {

                        /* Plisio whitelabel custom checkout */
                        if(data.details.payment_processor == 'plisio_whitelabel') {
                            let amount_label = document.querySelector('label[for="plisio_whitelabel_amount"]');
                            amount_label.innerText = amount_label.getAttribute('data-translation').replace('%s', data.details.cryptocurrency);
                            document.querySelector('#plisio_whitelabel_qr_code img').src = data.details.qr_code;
                            document.querySelector('#plisio_whitelabel_amount').value = data.details.amount;
                            document.querySelector('#plisio_whitelabel_wallet').value = data.details.wallet;
                            document.querySelector('#plisio_whitelabel_expiration').value = data.details.expiration_timestamp;
                            plisio_whitelabel_timer_start();
                            $('#plisio_whitelabel_modal').modal('show');
                        }

                        /* Redirect to checkout */
                        else {
                            window.location.replace(data.details.checkout_url);
                        }

                    }

                },
                error: () => {
                    enable_submit_button(event.currentTarget.querySelector('[type="submit"][name="submit"]'));
                    display_notifications(<?= json_encode(l('global.error_message.basic')) ?>, 'error', notification_container);
                },
            });

            event.preventDefault();
        })

        /* Thank you modal */
        if(window.location.search) {
            let url_params = new URLSearchParams(window.location.search);

            if(url_params && url_params.get('payment_thank_you') && url_params.get('payment_thank_you') == 'service') {
                let biolink_block_id = url_params.get('biolink_block_id');
                $(`#service_thank_you_${biolink_block_id}`).modal('show');
            }
        }
    </script>
    <?php \Altum\Event::add_content(ob_get_clean(), 'javascript', 'service') ?>
<?php endif ?>

<?= include_view(\Altum\Plugin::get('payment-blocks')->path . 'views/l/partials/plisio_whitelabel_modal.php') ?>

