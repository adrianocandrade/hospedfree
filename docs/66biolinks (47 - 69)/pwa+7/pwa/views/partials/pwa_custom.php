<?php if(
    !isset($_COOKIE['dismiss_pwa_' . $data->id])
): ?>

    <?php
    /* Detect extra details about the user */
    $whichbrowser = get_whichbrowser();

    /* Detect extra details about the user */
    $browser_name = $whichbrowser->browser->name ?? null;
    $os_name = $whichbrowser->os->name ?? null;
    $device_type = get_this_device_type();

    $subheader = null;

    /* Determine icon set */
    $use_emoji_icons = in_array(PRODUCT_KEY, ['66vcard', '66qrmenu', '66uptime']);

    $icon_download = $use_emoji_icons ? '⬇️' : '<i class="fas fa-fw fa-sm fa-download mx-1"></i>';
    $icon_external_link = $use_emoji_icons ? '🔗' : '<i class="fas fa-fw fa-sm fa-external-link-alt mx-1"></i>';
    $icon_plus_square = $use_emoji_icons ? '➕' : '<i class="fas fa-fw fa-sm fa-plus-square mx-1"></i>';
    $icon_ellipsis_vertical = $use_emoji_icons ? '⋮' : '<i class="fas fa-fw fa-sm fa-ellipsis-v mx-1"></i>';
    $icon_close = $use_emoji_icons ? '✖️' : '<i class="fas fa-sm fa-times" style="opacity: .5;"></i>';

    /* Desktop computers */
    if($device_type == 'desktop') {
        $subheader = sprintf(l('pwa_install.subheader.' . $device_type), $icon_download);

        if($os_name == 'OS X' && $browser_name == 'Safari') {
            $subheader = sprintf(l('pwa_install.subheader.ios_safari'), $icon_external_link, $icon_plus_square);
        }
    }

    /* Mobile phones */
    if($device_type == 'mobile' || $device_type == 'tablet') {
        if($os_name == 'Android' && $browser_name == 'Chrome') {
            $subheader = sprintf(l('pwa_install.subheader.android_chrome'), $icon_ellipsis_vertical, $icon_download);
        }

        if($os_name == 'iOS' && $browser_name == 'Chrome') {
            $subheader = sprintf(l('pwa_install.subheader.ios'), $icon_external_link, $icon_plus_square);
        }

        if($os_name == 'iOS' && $browser_name == 'Safari') {
            $subheader = sprintf(l('pwa_install.subheader.ios'), $icon_external_link, $icon_plus_square);
        }
    }
    ?>

    <div class="announcement-wrapper pwa-wrapper py-3 d-none d-print-none">
        <div class="container d-flex justify-content-center position-relative">
            <div class="row w-100">
                <div class="col">
                    <div class="d-flex flex-column flex-lg-row align-items-lg-center">
                        <?php
                        if(
                            ($device_type == 'desktop' && in_array($browser_name, ['Chrome', 'Edge']))
                            || ($device_type == 'mobile' && $os_name == 'Android' && $browser_name == 'Chrome')
                        ):
                            ?>
                            <button id="pwa_install_button" type="button" class="btn btn-sm btn-primary rounded-pill px-3 mr-lg-3 mb-1 mb-lg-0"><?= l('pwa_install.header') ?></button>
                            <span class="font-size-small text-center text-lg-left"><?= l('pwa_install.or') . ' ' . $subheader ?></span>

                            <?php ob_start() ?>
                                <script>
                                    let install_prompt = null;
                                    const install_button = document.querySelector("#pwa_install_button");

                                    window.addEventListener('beforeinstallprompt', event => {
                                        event.preventDefault();
                                        install_prompt = event;
                                    });

                                    install_button.addEventListener('click', async () => {
                                        if(!install_prompt) {
                                            return;
                                        }
                                        const result = await install_prompt.prompt();
                                        if(result === 'accepted') {
                                            document.querySelector('[data-pwa-close]').click();
                                        }
                                    });
                                </script>
                            <?php \Altum\Event::add_content(ob_get_clean(), 'javascript') ?>
                        <?php else: ?>
                            <span class="font-weight-bold mr-lg-3 mb-1 mb-lg-0"><?= l('pwa_install.header') ?></span>
                            <span><?= $subheader ?></span>
                        <?php endif ?>
                    </div>
                </div>
                <div class="col-auto d-flex align-items-center justify-content-center px-0">
                    <div>
                        <button data-pwa-close type="button" class="close ml-2" data-dismiss="alert" <?= $use_emoji_icons ? '' : 'data-toggle="tooltip"' ?> title="<?= l('global.close') ?>" data-tooltip-hide-on-click>
                            <?= $icon_close ?>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <?php ob_start() ?>
    <script>

        /* Handle the close button */
        document.querySelector('[data-pwa-close]').addEventListener('click', event => {
            document.querySelector(`.pwa-wrapper`).classList.add('d-none');
            set_cookie(`<?= 'dismiss_pwa_' . $data->id ?>`, 1, 90, <?= json_encode(COOKIE_PATH) ?>);
        })

        /* Set the dismiss cookie if pwa was installed */
        document.addEventListener('appinstalled', event => {
            document.querySelector(`.pwa-wrapper`).classList.add('d-none');
            set_cookie(`<?= 'dismiss_pwa_' . $data->id ?>`, 1, 90, <?= json_encode(COOKIE_PATH) ?>);
        })

        /* Do not display on PWA opens */
        if(window.matchMedia('(display-mode: standalone)').matches) {
            document.querySelector(`.pwa-wrapper`).classList.add('d-none');
        }

        else {
            setTimeout(() => {
                document.querySelector(`.pwa-wrapper`).classList.remove('d-none');
            }, <?= (int) ($data->display_delay ?? 3) ?> * 1000)
        }

        /* Observe display-mode changes */
        window.matchMedia('(display-mode: standalone)').addEventListener('change', event => {
            if(event.matches) {
                document.querySelector('.pwa-wrapper')?.classList.add('d-none');
            }
        });
    </script>
    <?php \Altum\Event::add_content(ob_get_clean(), 'javascript') ?>
<?php endif ?>
