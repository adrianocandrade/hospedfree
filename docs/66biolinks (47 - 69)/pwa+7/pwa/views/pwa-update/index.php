<?php defined('ALTUMCODE') || die() ?>

<div class="container">
    <?= \Altum\Alerts::output_alerts() ?>

    <?php if(settings()->main->breadcrumbs_is_enabled): ?>
        <nav aria-label="breadcrumb">
            <ol class="custom-breadcrumbs small">
                <li>
                    <a href="<?= url('pwas') ?>"><?= l('pwas.breadcrumb') ?></a><i class="fas fa-fw fa-angle-right"></i>
                </li>
                <li class="active" aria-current="page"><?= l('pwa_update.breadcrumb') ?></li>
            </ol>
        </nav>
    <?php endif ?>

    <div class="d-flex justify-content-between align-items-end mb-4">
        <h1 class="h4 text-truncate mb-0"><i class="fas fa-fw fa-xs fa-mobile mr-1"></i> <?= l('pwa_update.header') ?></h1>

        <?= include_view(\Altum\Plugin::get('pwa')->path . 'views/pwas/pwa_dropdown_button.php', ['id' => $data->pwa->pwa_id, 'resource_name' => $data->pwa->name]) ?>
    </div>

    <div class="row">
        <div class="col-xl-6">
            <div class="card">
                <div class="card-body">

                    <form id="pwa_create" action="" method="post" role="form">
                        <input type="hidden" name="token" value="<?= \Altum\Csrf::get() ?>" />

                        <div class="form-group">
                            <label for="name"><i class="fas fa-fw fa-sm fa-signature text-muted mr-1"></i> <?= l('pwas.name') ?></label>
                            <input type="text" id="name" name="name" class="form-control <?= \Altum\Alerts::has_field_errors('name') ? 'is-invalid' : null ?>" value="<?= $data->pwa->name ?>" maxlength="30" required="required" />
                            <?= \Altum\Alerts::output_field_error('name') ?>
                            <small class="form-text text-muted"><?= l('pwas.name_help') ?></small>
                        </div>

                        <div class="form-group">
                            <label for="short_name"><i class="fas fa-fw fa-sm fa-i-cursor text-muted mr-1"></i> <?= l('pwas.short_name') ?></label>
                            <input type="text" id="short_name" name="short_name" class="form-control <?= \Altum\Alerts::has_field_errors('short_name') ? 'is-invalid' : null ?>" maxlength="12" value="<?= $data->pwa->settings->short_name ?>" />
                            <?= \Altum\Alerts::output_field_error('short_name') ?>
                            <small class="form-text text-muted"><?= l('pwas.short_name_help') ?></small>
                        </div>

                        <div class="form-group">
                            <label for="description"><i class="fas fa-fw fa-sm fa-pen text-muted mr-1"></i> <?= l('pwas.description') ?></label>
                            <input type="text" id="description" name="description" class="form-control <?= \Altum\Alerts::has_field_errors('description') ? 'is-invalid' : null ?>" maxlength="300" value="<?= $data->pwa->settings->description ?>" />
                            <?= \Altum\Alerts::output_field_error('description') ?>
                            <small class="form-text text-muted"><?= l('pwas.description_help') ?></small>
                        </div>

                        <div class="form-group">
                            <label for="start_url"><i class="fas fa-fw fa-sm fa-link text-muted mr-1"></i> <?= l('pwas.start_url') ?></label>
                            <input type="url" id="start_url" name="start_url" class="form-control" value="<?= $data->pwa->settings->start_url ?>" maxlength="2048" placeholder="<?= l('global.url_placeholder') ?>" />
                            <small class="form-text text-muted"><?= l('pwas.start_url_help') ?></small>
                        </div>

                        <div class="form-group">
                            <label for="background_color"><i class="fas fa-fw fa-sm fa-fill-drip text-muted mr-1"></i> <?= l('pwas.background_color') ?></label>
                            <input type="hidden" id="background_color" name="background_color" class="form-control" value="<?= $data->pwa->settings->background_color ?>" data-color-picker />
                            <small class="form-text text-muted"><?= l('pwas.background_color_help') ?></small>
                        </div>

                        <div class="form-group">
                            <label for="theme_color"><i class="fas fa-fw fa-sm fa-palette text-muted mr-1"></i> <?= l('pwas.theme_color') ?></label>
                            <input type="hidden" id="theme_color" name="theme_color" class="form-control" value="<?= $data->pwa->settings->theme_color ?>" data-color-picker />
                            <small class="form-text text-muted"><?= l('pwas.theme_color_help') ?></small>
                        </div>

                        <div class="form-group">
                            <label for="app_icon_url"><i class="fas fa-fw fa-sm fa-image text-muted mr-1"></i> <?= l('pwas.app_icon_url') ?></label>
                            <input type="url" id="app_icon_url" name="app_icon_url" class="form-control" value="<?= $data->pwa->settings->app_icon_url ?? '' ?>" maxlength="2048" required="required" placeholder="<?= l('pwas.icon_url_placeholder') ?>" />
                            <small class="form-text text-muted"><?= l('pwas.app_icon_url_help') ?></small>
                        </div>

                        <div class="form-group">
                            <label for="app_icon_maskable_url"><i class="fas fa-fw fa-sm fa-mask text-muted mr-1"></i> <?= l('pwas.app_icon_maskable_url') ?></label>
                            <input type="url" id="app_icon_maskable_url" name="app_icon_maskable_url" class="form-control" value="<?= $data->pwa->settings->app_icon_maskable_url ?? '' ?>" maxlength="2048" placeholder="<?= l('pwas.icon_url_placeholder') ?>" />
                            <small class="form-text text-muted"><?= l('pwas.app_icon_maskable_url_help') ?></small>
                        </div>

                        <button class="btn btn-block btn-gray-200 font-size-little-small font-weight-450 mb-4" type="button" data-toggle="collapse" data-target="#mobile_screenshots_container" aria-expanded="false" aria-controls="mobile_screenshots_container">
                            <i class="fas fa-fw fa-mobile fa-sm mr-1"></i> <?= l('pwas.mobile_screenshots') ?>
                        </button>

                        <div class="collapse" data-parent="#pwa_create" id="mobile_screenshots_container">
                            <div class="alert alert-info">
                                <i class="fas fa-fw fa-sm fa-info-circle mr-2"></i> <?= l('pwas.mobile_screenshots_info') ?>
                            </div>

                            <?php for($i = 1; $i <= 6; $i++): ?>
                                <div class="form-group">
                                    <label for="mobile_screenshot_url_<?= $i ?>"><i class="fas fa-fw fa-sm fa-image text-muted mr-1"></i> <?= sprintf(l('pwas.mobile_screenshot_url_x'), $i) ?></label>
                                    <input type="url" id="mobile_screenshot_url_<?= $i ?>" name="mobile_screenshot_url_<?= $i ?>" class="form-control" value="<?= $data->pwa->settings->{'mobile_screenshot_url_' . $i} ?? '' ?>" placeholder="<?= l('pwas.mobile_screenshot_url_placeholder') ?>" maxlength="2048" />
                                </div>
                            <?php endfor ?>
                        </div>

                        <button class="btn btn-block btn-gray-200 font-size-little-small font-weight-450 mb-4" type="button" data-toggle="collapse" data-target="#desktop_screenshots_container" aria-expanded="false" aria-controls="desktop_screenshots_container">
                            <i class="fas fa-fw fa-desktop fa-sm mr-1"></i> <?= l('pwas.desktop_screenshots') ?>
                        </button>

                        <div class="collapse" data-parent="#pwa_create" id="desktop_screenshots_container">
                            <div class="alert alert-info">
                                <i class="fas fa-fw fa-sm fa-info-circle mr-2"></i> <?= l('pwas.desktop_screenshots_info') ?>
                            </div>

                            <?php for($i = 1; $i <= 6; $i++): ?>
                                <div class="form-group">
                                    <label for="desktop_screenshot_url_<?= $i ?>"><i class="fas fa-fw fa-sm fa-image text-muted mr-1"></i> <?= sprintf(l('pwas.desktop_screenshot_url_x'), $i) ?></label>
                                    <input type="url" id="desktop_screenshot_url_<?= $i ?>" name="desktop_screenshot_url_<?= $i ?>" class="form-control" value="<?= $data->pwa->settings->{'desktop_screenshot_url_' . $i} ?? '' ?>" placeholder="<?= l('pwas.desktop_screenshot_url_placeholder') ?>" maxlength="2048" />
                                </div>
                            <?php endfor ?>
                        </div>

                        <button class="btn btn-block btn-gray-200 font-size-little-small font-weight-450 mb-4" type="button" data-toggle="collapse" data-target="#shortcuts_container" aria-expanded="false" aria-controls="shortcuts_container">
                            <i class="fas fa-fw fa-wand-sparkles fa-sm mr-1"></i> <?= l('pwas.shortcuts') ?>
                        </button>

                        <div class="collapse" data-parent="#pwa_create" id="shortcuts_container">
                            <?php for($i = 1; $i <= 3; $i++): ?>
                                <div class="form-group">
                                    <label for="shortcut_name_<?= $i ?>"><?= sprintf(l('pwas.shortcut_name_x'), $i) ?></label>
                                    <input type="text" id="shortcut_name_<?= $i ?>" name="shortcut_name_<?= $i ?>" class="form-control" value="<?= $data->pwa->settings->{'shortcut_name_' . $i} ?? '' ?>" maxlength="20" />
                                    <small class="form-text text-muted"><?= l('pwas.shortcut_name_help') ?></small>
                                </div>

                                <div class="form-group">
                                    <label for="shortcut_description_<?= $i ?>"><?= sprintf(l('pwas.shortcut_description_x'), $i) ?></label>
                                    <input type="text" id="shortcut_description_<?= $i ?>" name="shortcut_description_<?= $i ?>" class="form-control" value="<?= $data->pwa->settings->{'shortcut_description_' . $i} ?? '' ?>" maxlength="60" />
                                    <small class="form-text text-muted"><?= l('pwas.shortcut_description_help') ?></small>
                                </div>

                                <div class="form-group">
                                    <label for="shortcut_url_<?= $i ?>"><?= sprintf(l('pwas.shortcut_url_x'), $i) ?></label>
                                    <input type="url" id="shortcut_url_<?= $i ?>" name="shortcut_url_<?= $i ?>" class="form-control" value="<?= $data->pwa->settings->{'shortcut_url_' . $i} ?? '' ?>" placeholder="<?= l('global.url_placeholder') ?>" maxlength="2048" />
                                    <small class="form-text text-muted"><?= l('pwas.shortcut_url_help') ?></small>
                                </div>

                                <div class="form-group">
                                    <label for="shortcut_icon_url_<?= $i ?>"><?= sprintf(l('pwas.shortcut_icon_url_x'), $i) ?></label>
                                    <input type="url" id="shortcut_icon_url_<?= $i ?>" name="shortcut_icon_url_<?= $i ?>" class="form-control" value="<?= $data->pwa->settings->{'shortcut_icon_url_' . $i} ?? '' ?>" placeholder="<?= l('global.url_placeholder') ?>" maxlength="2048" placeholder="<?= l('global.url_placeholder') ?>" />
                                    <small class="form-text text-muted"><?= l('pwas.shortcut_icon_url_help') ?></small>
                                </div>
                            <?php endfor ?>
                        </div>

                        <button class="btn btn-block btn-gray-200 font-size-little-small font-weight-450 mb-4" type="button" data-toggle="collapse" data-target="#advanced_container" aria-expanded="false" aria-controls="advanced_container">
                            <i class="fas fa-fw fa-user-tie fa-sm mr-1"></i> <?= l('pwas.advanced') ?>
                        </button>

                        <div class="collapse" data-parent="#pwa_create" id="advanced_container">
                            <div class="form-group">
                                <label for="id"><i class="fas fa-fw fa-sm fa-fingerprint text-muted mr-1"></i> <?= l('pwas.id') ?></label>
                                <input type="text" id="id" name="id" class="form-control <?= \Altum\Alerts::has_field_errors('id') ? 'is-invalid' : null ?>" maxlength="200" value="<?= $data->pwa->settings->id ?>" />
                                <?= \Altum\Alerts::output_field_error('id') ?>
                                <small class="form-text text-muted"><?= l('pwas.id_help') ?></small>
                            </div>

                            <div class="form-group">
                                <label for="display"><i class="fas fa-fw fa-sm fa-desktop text-muted mr-1"></i> <?= l('pwas.display') ?></label>
                                <select id="display" name="display" class="form-control">
                                    <option value="fullscreen" <?= $data->pwa->settings->display == 'fullscreen' ? 'selected' : '' ?>>fullscreen</option>
                                    <option value="standalone" <?= $data->pwa->settings->display == 'standalone' ? 'selected' : '' ?>>standalone</option>
                                    <option value="minimal-ui" <?= $data->pwa->settings->display == 'minimal-ui' ? 'selected' : '' ?>>minimal-ui</option>
                                    <option value="browser" <?= $data->pwa->settings->display == 'browser' ? 'selected' : '' ?>>browser</option>
                                </select>
                                <small class="form-text text-muted"><?= l('pwas.display_help') ?></small>
                            </div>

                            <div class="form-group">
                                <label for="orientation"><i class="fas fa-fw fa-sm fa-mobile-alt text-muted mr-1"></i> <?= l('pwas.orientation') ?></label>
                                <select id="orientation" name="orientation" class="form-control">
                                    <option value="any" <?= $data->pwa->settings->orientation == 'any' ? 'selected' : '' ?>>any</option>
                                    <option value="portrait" <?= $data->pwa->settings->orientation == 'portrait' ? 'selected' : '' ?>>portrait</option>
                                    <option value="landscape" <?= $data->pwa->settings->orientation == 'landscape' ? 'selected' : '' ?>>landscape</option>
                                </select>
                                <small class="form-text text-muted"><?= l('pwas.orientation_help') ?></small>
                            </div>

                            <div class="form-group">
                                <label for="dir"><i class="fas fa-fw fa-sm fa-arrows-alt-h text-muted mr-1"></i> <?= l('pwas.dir') ?></label>
                                <select id="dir" name="dir" class="form-control">
                                    <option value="auto" <?= $data->pwa->settings->dir == 'auto' ? 'selected' : '' ?>>auto</option>
                                    <option value="rtl" <?= $data->pwa->settings->dir == 'rtl' ? 'selected' : '' ?>>rtl</option>
                                    <option value="ltr" <?= $data->pwa->settings->dir == 'ltr' ? 'selected' : '' ?>>ltr</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="lang"><i class="fas fa-fw fa-sm fa-language text-muted mr-1"></i> <?= l('pwas.lang') ?></label>
                                <input type="text" id="lang" name="lang" class="form-control <?= \Altum\Alerts::has_field_errors('lang') ? 'is-invalid' : null ?>" maxlength="8" value="<?= $data->pwa->settings->lang ?>" />
                                <?= \Altum\Alerts::output_field_error('lang') ?>
                                <small class="form-text text-muted"><?= l('pwas.lang_help') ?></small>
                            </div>

                            <div class="form-group">
                                <label for="scope_url"><i class="fas fa-fw fa-sm fa-globe text-muted mr-1"></i> <?= l('pwas.scope_url') ?></label>
                                <input type="text" id="scope_url" name="scope_url" class="form-control <?= \Altum\Alerts::has_field_errors('scope_url') ? 'is-invalid' : null ?>" maxlength="2048" value="<?= $data->pwa->settings->scope_url ?>" />
                                <?= \Altum\Alerts::output_field_error('scope_url') ?>
                                <small class="form-text text-muted"><?= l('pwas.scope_url_help') ?></small>
                            </div>
                        </div>

                        <button type="submit" name="submit" class="btn btn-block btn-primary"><?= l('global.update') ?></button>
                    </form>

                </div>
            </div>
        </div>

        <div class="mt-5 mt-xl-0 col-xl-6">
            <div class="sticky">
                <div class="card">
                    <div class="card-body">
                        <div class="h6"><?= l('pwas.manifest.json') ?></div>

                        <pre class="mt-4 mb-0" id="manifest_json" data-placeholder="<?= l('pwas.manifest.json_placeholder') ?>"><?= l('pwas.manifest.json_placeholder') ?></pre>
                    </div>
                </div>

                <button id="download" type="button" class="mt-4 btn btn-block btn-outline-primary d-print-none" disabled="disabled">
                    <i class="fas fa-fw fa-sm fa-download mr-1"></i> <?= l('global.download') ?>
                </button>

                <div class="card mt-5">
                    <div class="card-body">
                        <div class="h6"><?= l('pwas.tutorial.header') ?></div>

                        <ol class="list-style-none font-size-little-small mt-4">
                            <li class="mb-3">
                                <span class="font-weight-600 text-muted">1.</span>
                                <?= l('pwas.tutorial.one') ?>
                            </li>

                            <li>
                                <span class="font-weight-600 text-muted">2.</span>
                                <?= l('pwas.tutorial.two') ?>
                            </li>
                        </ol>

                        <div class="mt-3">
                            <code data-copy>&lt;link rel="manifest" href="/manifest.json"&gt;</code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</div>


<?php include_view(\Altum\Plugin::get('pwa')->path . 'views/pwas/js_pwa_generator.php') ?>
<?php include_view(THEME_PATH . 'views/partials/color_picker_js.php') ?>
<?php include_view(THEME_PATH . 'views/partials/clipboard_js.php') ?>
