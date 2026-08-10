<?php defined('ALTUMCODE') || die() ?>

<?php ob_start() ?>
<div class="modal fade" id="plisio_whitelabel_modal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">

            <div class="modal-body">
                <div class="d-flex justify-content-between mb-3">
                    <h5 class="modal-title">
                        <i class="fas fa-fw fa-sm fa-coins text-dark mr-2"></i>
                        <?= l('pay.custom_plan.plisio_whitelabel.header') ?>
                    </h5>
                    <button type="button" class="close" data-dismiss="modal" title="<?= l('global.close') ?>">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                <p class="text-muted"><?= l('pay.custom_plan.plisio_whitelabel.subheader') ?></p>

                <div id="plisio_whitelabel_qr_code" class="text-center mb-4">
                    <img src="" class="img-fluid rounded-2x" />
                </div>

                <div class="form-group">
                    <label for="plisio_whitelabel_wallet"><?= l('pay.custom_plan.plisio_whitelabel.wallet') ?></label>
                    <div class="input-group">
                        <input type="text" id="plisio_whitelabel_wallet" name="wallet" class="form-control" value="" readonly="readonly" />
                        <div class="input-group-append">
                            <button
                                type="button"
                                class="btn btn-light"
                                data-toggle="tooltip"
                                title="<?= l('global.clipboard_copy') ?>"
                                aria-label="<?= l('global.clipboard_copy') ?>"
                                data-copy="<?= l('global.clipboard_copy') ?>"
                                data-copied="<?= l('global.clipboard_copied') ?>"
                                data-clipboard-target="#plisio_whitelabel_wallet"
                            >
                                <i class="fas fa-fw fa-sm fa-copy"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="plisio_whitelabel_amount" data-translation="<?= l('pay.custom_plan.plisio_whitelabel.amount') ?>"><?= l('pay.custom_plan.plisio_whitelabel.amount') ?></label>
                    <div class="input-group">
                        <input type="text" id="plisio_whitelabel_amount" name="amount" class="form-control" value="" readonly="readonly" />
                        <div class="input-group-append">
                            <button
                                type="button"
                                class="btn btn-light"
                                data-toggle="tooltip"
                                title="<?= l('global.clipboard_copy') ?>"
                                aria-label="<?= l('global.clipboard_copy') ?>"
                                data-copy="<?= l('global.clipboard_copy') ?>"
                                data-copied="<?= l('global.clipboard_copied') ?>"
                                data-clipboard-target="#plisio_whitelabel_amount"
                            >
                                <i class="fas fa-fw fa-sm fa-copy"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="plisio_whitelabel_expiration"><?= l('pay.custom_plan.plisio_whitelabel.expiration') ?></label>
                    <input type="text" id="plisio_whitelabel_expiration" name="expiration" class="form-control" value="" readonly="readonly" />
                </div>

                <div class="row">
                    <div class="col-6">
                        <button type="button" class="btn btn-block btn-light" data-dismiss="modal"><?= l('global.cancel') ?></button>
                    </div>
                    <div class="col-6">
                        <button type="button" class="btn btn-block btn-primary" onclick="$('.modal.show').modal('hide');"><?= l('pay.custom_plan.plisio_whitelabel.success_button') ?></button>
                    </div>
                </div>
            </div>

        </div>
    </div>
</div>

    <?php ob_start() ?>
    <script>
        'use strict';

        /* Countdown timer */
        let plisio_whitelabel_timer = {
            second: '<?= l('global.date.second') ?>',
            seconds: '<?= l('global.date.seconds') ?>',
            minute: '<?= l('global.date.minute') ?>',
            minutes: '<?= l('global.date.minutes') ?>',
            hour: '<?= l('global.date.hour') ?>',
            hours: '<?= l('global.date.hours') ?>',
            day: '<?= l('global.date.day') ?>',
            days: '<?= l('global.date.days') ?>',
            week: '<?= l('global.date.week') ?>',
            weeks: '<?= l('global.date.weeks') ?>',
            month: '<?= l('global.date.month') ?>',
            months: '<?= l('global.date.months') ?>',
            year: '<?= l('global.date.year') ?>',
            years: '<?= l('global.date.years') ?>',
            disabled: '<?= l('global.disabled') ?>'
        };

        let plisio_whitelabel_plural = (unit, value) => {
            return value === 1 ? plisio_whitelabel_timer[unit] : plisio_whitelabel_timer[unit + 's'];
        }

        let plisio_whitelabel_timer_start = () => {
            const countdown_element = document.getElementById('plisio_whitelabel_expiration');

            const expiration_timestamp = countdown_element.value;

            function update_countdown() {
                const now = Math.floor(Date.now() / 1000);
                let diff = expiration_timestamp - now;

                if (diff <= 0) {
                    countdown_element.value = t.disabled;
                    document.querySelector('#plisio_whitelabel_success_button').setAttribute('disabled', 'disabled');
                    return;
                }

                const days = Math.floor(diff / 86400);
                diff -= days * 86400;

                const hours = Math.floor(diff / 3600);
                diff -= hours * 3600;

                const minutes = Math.floor(diff / 60);
                const seconds = diff % 60;

                const parts = [];

                if (days > 0) {
                    parts.push(days + ' ' + plisio_whitelabel_plural('day', days));
                }

                if (hours > 0) {
                    parts.push(hours + ' ' + plisio_whitelabel_plural('hour', hours));
                }

                if (minutes > 0) {
                    parts.push(minutes + ' ' + plisio_whitelabel_plural('minute', minutes));
                }

                parts.push(seconds + ' ' + plisio_whitelabel_plural('second', seconds));

                countdown_element.value = parts.join(', ');
            }

            update_countdown();
            setInterval(update_countdown, 1000);
        }
    </script>
    <?php \Altum\Event::add_content(ob_get_clean(), 'javascript', 'plisio_whitelabel') ?>
<?php \Altum\Event::add_content(ob_get_clean(), 'modals', 'plisio_whitelabel_modal') ?>
