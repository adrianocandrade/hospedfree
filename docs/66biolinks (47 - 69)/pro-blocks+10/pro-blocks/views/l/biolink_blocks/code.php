<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?>">
    <div class="<?= 'link-btn-' . $data->link->settings->border_radius . ' large' ?>" style="text-align: initial !important;<?= 'border-width: ' . ($data->link->settings->border_width ?? '1') . 'px;' . 'border-color: ' . (empty($data->link->settings->border_color) ? 'transparent' : $data->link->settings->border_color) . ';' . 'border-style: ' . ($data->link->settings->border_style ?? 'solid') . ';' . \Altum\Link::get_processed_box_shadow_style($data->link->settings) ?>" data-border-width data-border-radius data-border-style data-border-color data-border-shadow>

        <pre id="<?= 'code_' . $data->link->biolink_block_id ?>" data-shiki data-lang="<?= $data->link->settings->code_language ?>" data-theme="<?= $data->link->settings->theme ?>"><?= e($data->link->settings->code) ?></pre>

    </div>
</div>

<?php if(!\Altum\Event::exists_content_type_key('javascript', 'shiki')): ?>
    <?php ob_start() ?>
    <script type="module">
        'use strict';

        const { codeToHtml } = await import('https://cdn.jsdelivr.net/npm/shiki@3.21.0/+esm');

        for (const element of document.querySelectorAll('[data-shiki]')) {
            const lang = element.dataset.lang || 'text';
            const theme = element.dataset.theme || 'github-dark';
            const raw = element.innerText;
            element.innerHTML = await codeToHtml(raw, { lang, theme: theme });
        }
    </script>
    <?php \Altum\Event::add_content(ob_get_clean(), 'javascript', 'shiki') ?>

    <?php ob_start() ?>
    <style media="screen,print">
        [data-biolink-block-type="code"] pre {
            margin: 0 !important;
        }
    </style>
    <?php \Altum\Event::add_content(ob_get_clean(), 'head') ?>
<?php endif ?>
