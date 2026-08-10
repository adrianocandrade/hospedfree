<?php defined('ALTUMCODE') || die() ?>

<?php ob_start() ?>
    <script>
        'use strict';

        let field_names = [
            'name', 'short_name', 'description', 'start_url', 'display', 'orientation',
            'background_color', 'theme_color', 'app_icon_url', 'app_icon_maskable_url',
            'id', 'dir', 'lang', 'scope'
        ];

        let get_image_type_from_url = url => {
            let extension = url.split('.').pop().split('?')[0].toLowerCase();
            let mime_types = {
                'png': 'image/png',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'webp': 'image/webp',
                'gif': 'image/gif',
                'svg': 'image/svg+xml'
            };
            return mime_types[extension] || 'image/png';
        };

        let generate_manifest_json = event => {
            let manifest_json = {};

            let name = document.querySelector('#name').value.trim();

            if(name == '') {
                document.querySelector('#manifest_json').value = '';
            }

            field_names.forEach(field_name => {
                let field_value = document.querySelector(`#${field_name}`)?.value.trim();
                if (field_name === 'start_url' && !field_value) {
                    manifest_json[field_name] = '/';
                } else if (field_value && !['app_icon_url', 'app_icon_maskable_url'].includes(field_name)) {
                    manifest_json[field_name] = field_value;
                }
            });

            /* Icons */
            let icons = [];
            let app_icon_url = document.querySelector('#app_icon_url')?.value.trim();
            if (app_icon_url) {
                icons.push({
                    src: app_icon_url,
                    type: get_image_type_from_url(app_icon_url),
                    purpose: 'any',
                    sizes: '512x512'
                });
            }
            let app_icon_maskable_url = document.querySelector('#app_icon_maskable_url')?.value.trim();
            if (app_icon_maskable_url) {
                icons.push({
                    src: app_icon_maskable_url,
                    type: get_image_type_from_url(app_icon_maskable_url),
                    purpose: 'maskable',
                    sizes: '512x512'
                });
            }
            if (icons.length > 0) {
                manifest_json.icons = icons;
            }

            /* Screenshots */
            let screenshots = [];
            for (let i = 1; i <= 6; i++) {
                let value = document.querySelector(`#mobile_screenshot_url_${i}`)?.value.trim();
                if (value) {
                    screenshots.push({
                        src: value,
                        type: get_image_type_from_url(value),
                        platform: 'mobile'
                    });
                }
            }
            for (let i = 1; i <= 6; i++) {
                let value = document.querySelector(`#desktop_screenshot_url_${i}`)?.value.trim();
                if (value) {
                    screenshots.push({
                        src: value,
                        type: get_image_type_from_url(value),
                        platform: 'wide'
                    });
                }
            }
            if (screenshots.length > 0) {
                manifest_json.screenshots = screenshots;
            }

            /* Shortcuts */
            let shortcuts = [];
            for (let i = 1; i <= 3; i++) {
                let name = document.querySelector(`#shortcut_name_${i}`)?.value.trim();
                let description = document.querySelector(`#shortcut_description_${i}`)?.value.trim();
                let url = document.querySelector(`#shortcut_url_${i}`)?.value.trim();
                let icon = document.querySelector(`#shortcut_icon_url_${i}`)?.value.trim();

                if (name && url && icon) {
                    shortcuts.push({
                        name: name,
                        description: description,
                        url: url,
                        icons: [{
                            src: icon,
                            type: get_image_type_from_url(icon)
                        }]
                    });
                }
            }
            if (shortcuts.length > 0) {
                manifest_json.shortcuts = shortcuts;
            }

            /* Output formatted JSON to textarea */
            let json_output_element = document.querySelector('#manifest_json');
            let download_button = document.querySelector('#download');

            try {
                let json_string = JSON.stringify(manifest_json, null, 4);
                json_output_element.textContent = json_string;

                /* Enable button only if JSON is valid */
                download_button.removeAttribute('disabled');
            } catch (error) {
                /* Invalid JSON (should never happen, but safety first) */
                json_output_element.textContent = null;
                download_button.setAttribute('disabled', 'disabled');
            }

            document.querySelector('#manifest_json').innerHTML = JSON.stringify(manifest_json, null, 4);
        };

        field_names.forEach(field_name => {
            document.querySelector(`#${field_name}`)?.addEventListener('change', generate_manifest_json);
        });

        generate_manifest_json();

        let download_manifest_json = () => {
            let json_text = document.querySelector('#manifest_json')?.textContent;
            if (!json_text) return;

            let blob = new Blob([json_text], { type: 'application/json' });
            let link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'manifest.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        document.querySelector('#download')?.addEventListener('click', download_manifest_json);
    </script>
<?php \Altum\Event::add_content(ob_get_clean(), 'javascript') ?>
