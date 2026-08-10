<?php defined('ALTUMCODE') || die() ?>
<style>
    .altum a {
        text-decoration: none !important;
        color: {{LINK_COLOR}} !important;
    }
</style>

<div dir="{{DIRECTION}}" class="altum" style="box-sizing: border-box !important; margin: 0 !important; padding: 15px !important; width: {{WIDTH}}px !important; max-width: 450px !important; background: {{BACKGROUND_COLOR}}; border: 1px solid {{BORDER_COLOR}}; border-radius: {{BORDER_RADIUS}}px;">
    <div style="font-family: {{FONT_FAMILY}}; font-size: {{FONT_SIZE}}px; color: {{TEXT_COLOR}};">
        <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width: 100%; border-collapse: collapse; font-family: {{FONT_FAMILY}}; font-size: {{FONT_SIZE}}px; color: {{TEXT_COLOR}};">
            <tr>
                <td id="signature_image_url" align="center" style="padding-bottom: 15px;">
                    <img src="{{IMAGE_URL}}" alt="{{FULL_NAME}}" style="width: {{IMAGE_WIDTH}}px; height: auto; border-radius: {{IMAGE_BORDER_RADIUS}}px;" />
                </td>
            </tr>
            <tr>
                <td align="center">
                    <div id="signature_full_name" style="font-weight: bold; font-size: 18px; color: {{FULL_NAME_COLOR}};">{{FULL_NAME}}</div>
                    <div id="signature_job_title" style="margin: 4px 0;">{{JOB_TITLE}}</div>
                    <div style="margin-bottom: 10px;">
                        <span id="signature_department">{{DEPARTMENT}}</span>
                        <span id="signature_company">{{COMPANY}}</span>
                    </div>
                </td>
            </tr>
            <tr>
                <td style="padding-bottom: 10px;">
                    <div style="text-align: center;">
                        <span id="signature_phone_number" style="padding-right: 5px"><small>📞 <a href="tel:{{PHONE_NUMBER}}" target="_blank">{{PHONE_NUMBER}}</a></small></span>
                        <span id="signature_whatsapp"><small>📱 <a href="https://wa.me/{{WHATSAPP}}" target="_blank">{{WHATSAPP}}</a></small></span>
                    </div>
                </td>
            </tr>
            <tr>
                <td style="padding-bottom: 10px;">
                    <div style="text-align: center;">
                        <span id="signature_facebook_messenger" style="padding-right: 5px"><small>💬 <a href="https://m.me/{{FACEBOOK_MESSENGER}}" target="_blank">{{FACEBOOK_MESSENGER}}</a></small></span>
                        <div id="signature_address" style="text-align: center;"><small>📍 <a href="{{ADDRESS_URL}}" target="_blank">{{ADDRESS}}</a></small></div>
                    </div>
                </td>
            </tr>
            <tr>
                <td>
                    <div id="signature_website_url" style="text-align: center;"><small>🔗 <a href="{{WEBSITE_URL}}" target="_blank">{{WEBSITE_NAME}}</a></small></div>
                    <div id="signature_email" style="text-align: center;"><small>✉️ <a href="mailto:{{EMAIL}}" target="_blank">{{EMAIL}}</a></small></div>

                </td>
            </tr>
            <tr>
                <td style="padding-top: 15px;">
                    <div style="text-align: center;">
                        <?php foreach(require \Altum\Plugin::get('email-signatures')->path . 'includes/signature_socials.php' as $key => $social): ?>
                            <span id="<?= 'signature_' . $key ?>" style="padding: 0 5px;">
                                <a href="<?= sprintf($social['format'], '{{' . mb_strtoupper($key) . '}}') ?>" target="_blank">
                                    <img src="<?= ASSETS_FULL_URL . 'images/signatures/socials/' . $key . '.png' ?>" style="width: {{SOCIALS_WIDTH}}px; height: auto;" alt="<?= $social['name'] ?>" />
                                </a>
                            </span>
                        <?php endforeach ?>
                    </div>
                </td>
            </tr>
        </table>

        <div id="signature_sign_off" style="text-align: center; margin-top: 15px;">{{SIGN_OFF}}</div>
    </div>
</div>

<small id="signature_disclaimer" style="color: #808080;"><br />{{DISCLAIMER}}</small>
<div id="signature_branding"><br />{{BRANDING}}</div>
