<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 col-lg-<?= ($data->link->settings->columns ?? 1) == 1 ? '12' : '6' ?> my-<?= $data->biolink->settings->block_spacing ?? '2' ?>">
    <a href="#" data-toggle="modal" data-target="<?= '#appointment_calendar_' . $data->link->biolink_block_id ?>" class="btn btn-block btn-primary link-btn <?= ($data->biolink->settings->hover_animation ?? 'smooth') != 'false' ? 'link-hover-animation-' . ($data->biolink->settings->hover_animation ?? 'smooth') : null ?> <?= 'link-btn-' . $data->link->settings->border_radius ?> <?= $data->link->design->link_class ?>" style="<?= $data->link->design->link_style ?>" data-text-color data-border-width data-border-radius data-border-style data-border-color data-border-shadow data-animation data-background-color data-text-alignment>
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
<div class="modal fade" id="<?= 'appointment_calendar_' . $data->link->biolink_block_id ?>" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">

            <div class="modal-header">
                <h5 class="modal-title"><?= $data->link->settings->name ?></h5>
                <button type="button" class="close" data-dismiss="modal" title="<?= l('global.close') ?>">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>

            <div class="modal-body">
                <form
                        id="<?= 'appointment_calendar_form_' . $data->link->biolink_block_id ?>"
                        method="post"
                        role="form"
                        data-available-slots='<?= json_encode($data->available_slots) ?>'
                >
                    <input type="hidden" name="token" value="<?= \Altum\Csrf::get() ?>" required="required" />
                    <input type="hidden" name="biolink_block_id" value="<?= $data->link->biolink_block_id ?>" />

                    <div class="notification-container"></div>

                    <div class="form-group">
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <div class="input-group-text bg-gray-50"><i class="fas fa-fw fa-calendar"></i></div>
                            </div>

                            <input
                                    type="text"
                                    name="date"
                                    class="form-control"
                                    data-min-date="<?= date('Y-m-d') ?>"
                                    data-max-date="<?= date('Y-m-d', strtotime('+' . $data->link->settings->allowed_scheduling_days_ahead . ' days')) ?>"
                                    aria-label=""
                            />
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <div class="input-group-text bg-gray-50"><i class="fas fa-fw fa-clock"></i></div>
                            </div>

                            <select name="time" class="custom-select" aria-label="">
                                <option value="" selected="selected" disabled="disabled" hidden="hidden"><?= l('biolink_appointment_calendar.time_placeholder') ?></option>
                            </select>

                            <div class="input-group-append">
                                <span class="input-group-text bg-gray-50"><?= $data->link->settings->timezone ?></span>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <div class="input-group-text bg-gray-50"><i class="fas fa-fw fa-envelope"></i></div>
                            </div>
                            <input type="email" class="form-control" name="email" maxlength="320" required="required" placeholder="<?= $data->link->settings->email_placeholder ?>" aria-label="<?= $data->link->settings->email_placeholder ?>" />
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <div class="input-group-text bg-gray-50"><i class="fas fa-fw fa-phone-square-alt"></i></div>
                            </div>
                            <input type="text" class="form-control" name="phone" maxlength="32" required="required" placeholder="<?= $data->link->settings->phone_placeholder ?>" aria-label="<?= $data->link->settings->phone_placeholder ?>" />
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <div class="input-group-text bg-gray-50"><i class="fas fa-fw fa-signature"></i></div>
                            </div>
                            <input type="text" class="form-control" name="name" maxlength="64" required="required" placeholder="<?= $data->link->settings->name_placeholder ?>" aria-label="<?= $data->link->settings->name_placeholder ?>" />
                        </div>
                    </div>

                    <div class="form-group">
                        <textarea class="form-control" name="message" maxlength="512" required="required" placeholder="<?= $data->link->settings->message_placeholder ?>" aria-label="<?= $data->link->settings->message_placeholder ?>"></textarea>
                    </div>

                    <?php if($data->link->settings->show_agreement): ?>
                        <div class="custom-control custom-switch">
                            <input type="checkbox" id="<?= 'appointment_calendar_agreement_' . $data->link->biolink_block_id ?>" name="agreement" class="custom-control-input" required="required" />
                            <label class="custom-control-label font-weight-normal" for="<?= 'appointment_calendar_agreement_' . $data->link->biolink_block_id ?>">
                                <?= $data->link->settings->agreement_text ?>

                                <?php if(!empty($data->link->settings->agreement_url)): ?>
                                    <a href="<?= $data->link->settings->agreement_url ?>" target="_blank"><i class="fas fa-fw fa-sm fa-external-link-alt"></i></a>
                                <?php endif ?>
                            </label>
                        </div>
                    <?php endif ?>

                    <?php if(settings()->captcha->biolink_is_enabled && settings()->captcha->type != 'basic'): ?>
                        <div class="form-group">
                            <?php (new \Altum\Captcha())->display() ?>
                        </div>
                    <?php endif ?>

                    <div class="text-center mt-4">
                        <button type="submit" name="submit" class="btn btn-block btn-lg btn-primary" data-is-ajax><?= $data->link->settings->button_text ?></button>
                    </div>
                </form>
            </div>

        </div>
    </div>
</div>
<?php \Altum\Event::add_content(ob_get_clean(), 'modals') ?>


<?php if(!\Altum\Event::exists_content_type_key('javascript', 'appointment_calendar')): ?>
    <?php ob_start() ?>
    <script src="<?= ASSETS_FULL_URL . 'js/libraries/moment.min.js?v=' . PRODUCT_CODE ?>"></script>
    <script src="<?= ASSETS_FULL_URL . 'js/libraries/daterangepicker.min.js?v=' . PRODUCT_CODE ?>"></script>
    <script src="<?= ASSETS_FULL_URL . 'js/libraries/moment-timezone-with-data-10-year-range.min.js?v=' . PRODUCT_CODE ?>"></script>

    <script>
        'use strict';

        /* Loop through each appointment calendar form */
        document.querySelectorAll('form[id^="appointment_calendar_"]').forEach((form) => {
            const date_input = form.querySelector('input[name="date"]');
            const time_select = form.querySelector('select[name="time"]');

            /* Parse available slots from data attribute */
            const available_slots_by_date = JSON.parse(form.dataset.availableSlots);

            $(date_input).daterangepicker({
                autoApply: true,
                minDate: date_input.dataset.minDate,
                maxDate: date_input.dataset.maxDate,
                alwaysShowCalendars: true,
                linkedCalendars: false,
                singleCalendar: true,
                singleDatePicker: true,
                locale: <?= json_encode(require APP_PATH . 'includes/daterangepicker_translations.php') ?>,

                isInvalidDate: (date) => {
                    const formatted_date = date.format('YYYY-MM-DD');
                    return !available_slots_by_date.some((slot) => slot.date === formatted_date);
                }

            }, (start) => {
                const selected_date = start.format('YYYY-MM-DD');
                time_select.innerHTML = '';

                const slots_for_date = available_slots_by_date.filter((slot) => slot.date === selected_date);

                if(slots_for_date.length === 0) {
                    time_select.innerHTML = `<option disabled='disabled'><?= l('biolink_appointment_calendar.no_time_slots') ?></option>`;
                    return;
                }

                slots_for_date.forEach((slot) => {
                    const label = `${slot.start_time} - ${slot.end_time}`;
                    const disabled = slot.is_booked ? 'disabled="disabled"' : '';
                    const text = slot.is_booked ? `${label} <?= l('biolink_appointment_calendar.time_slot_booked') ?>` : label;

                    time_select.insertAdjacentHTML('beforeend', `<option value='${slot.start_time}' ${disabled}>${text}</option>`);
                });
            });

            const default_start = moment(date_input.value, 'YYYY-MM-DD');
            $(date_input).data('daterangepicker').callback(default_start, default_start, '');

            const biolink_block_id = form.querySelector('input[name="biolink_block_id"]').value;
            const is_converted = sessionStorage.getItem(`appointment_calendar_${biolink_block_id}`);

            if(is_converted) {
                form.querySelector('button[type="submit"]').setAttribute('disabled', 'disabled');
            }

            form.addEventListener('submit', event => {
                event.preventDefault();

                const notification_container = form.querySelector('.notification-container');
                notification_container.innerHTML = '';
                pause_submit_button(form.querySelector('[type="submit"][name="submit"]'));

                if(!is_converted) {
                    $.ajax({
                        type: 'POST',
                        url: `${site_url}l/link/appointment_calendar`,
                        data: $(form).serialize(),
                        dataType: 'json',
                        success: (data) => {
                            enable_submit_button(form.querySelector('[type="submit"][name="submit"]'));

                            if(data.status === 'error') {
                                display_notifications(data.message, 'error', notification_container);
                            } else if(data.status === 'success') {
                                display_notifications(data.message, 'success', notification_container);

                                /* Set the submit button to disabled */
                                $(event.currentTarget).find('button[type="submit"]').attr('disabled', 'disabled');

                                setTimeout(() => {

                                    /* Hide modal */
                                    $(event.currentTarget).closest('.modal').modal('hide');

                                    /* Remove the notification */
                                    notification_container.innerHTML = '';

                                    /* Set the localstorage to mention that the user was converted */
                                    sessionStorage.setItem(`appointment_calendar_${biolink_block_id}`, true);

                                    if(data.details.thank_you_url) {
                                        window.location.replace(data.details.thank_you_url);
                                    }

                                }, 2000);
                            }

                            try {
                                grecaptcha.reset();
                                hcaptcha.reset();
                                turnstile.reset();
                            } catch (error) {}
                        },
                        error: () => {
                            enable_submit_button(form.querySelector('[type="submit"][name="submit"]'));
                            display_notifications(<?= json_encode(l('global.error_message.basic')) ?>, 'error', notification_container);
                        }
                    });
                }
            });
        });
    </script>
    <?php \Altum\Event::add_content(ob_get_clean(), 'javascript', 'appointment_calendar') ?>
<?php endif ?>


<?php ob_start() ?>
<link href="<?= ASSETS_FULL_URL . 'css/libraries/daterangepicker.min.css?v=' . PRODUCT_CODE ?>" rel="stylesheet" media="screen,print">
<?php \Altum\Event::add_content(ob_get_clean(), 'head', 'appointment_calendare') ?>
