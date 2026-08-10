<?php defined('ALTUMCODE') || die() ?>
<style>
    .altum a {
        text-decoration: none !important;
        color: {{LINK_COLOR}} !important;
    }
</style>

<div dir="{{DIRECTION}}" class="altum" style="box-sizing: border-box !important; margin: 0 !important; padding: 0 !important; width: {{WIDTH}}px !important; max-width: 480px !important; background: {{BACKGROUND_COLOR}}; border: 1px solid {{BORDER_COLOR}}; border-radius: {{BORDER_RADIUS}}px; overflow: hidden !important;">
    <div style="font-family: {{FONT_FAMILY}}; font-size: {{FONT_SIZE}}px; color: {{TEXT_COLOR}};">
        <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width: 100%; border-collapse: separate !important; border-spacing: 0; font-family: {{FONT_FAMILY}}; font-size: {{FONT_SIZE}}px; color: {{TEXT_COLOR}}; background: {{BACKGROUND_COLOR}}; border-radius: {{BORDER_RADIUS}}px; overflow: hidden !important;">
            <tr>
                <td width="6" style="width: 6px; min-width: 6px; padding: 0; background: {{THEME_COLOR}}; font-size: 0; line-height: 0;">&nbsp;</td>
                <td style="padding: 18px; background: {{BACKGROUND_COLOR}}; vertical-align: top;">
                    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width: 100%; border-collapse: collapse !important; font-family: {{FONT_FAMILY}}; font-size: {{FONT_SIZE}}px; color: {{TEXT_COLOR}};">
                        <tr>
                            <td id="signature_image_url" style="width: {{IMAGE_WIDTH}}px; padding: 0 18px 0 0; line-height: 0; vertical-align: top;">
                                <img src="{{IMAGE_URL}}" alt="{{FULL_NAME}}" style="width: {{IMAGE_WIDTH}}px; height: auto; border-radius: {{IMAGE_BORDER_RADIUS}}px; border: 3px solid {{BORDER_COLOR}};" />
                            </td>
                            <td style="vertical-align: top;">
                                <div id="signature_sign_off" style="margin-bottom: 4px; font-size: 12px; color: #808080;">{{SIGN_OFF}}</div>
                                <div id="signature_full_name" style="font-weight: bold; font-size: 18px; line-height: 22px; color: {{FULL_NAME_COLOR}};">{{FULL_NAME}}</div>

                                <div id="signature_company_wrapper" style="margin-top: 4px; line-height: 20px;">
                                    <span id="signature_job_title">{{JOB_TITLE}}</span>
                                    <span id="signature_department">{{DEPARTMENT}}</span>
                                    <span id="signature_company" style="font-weight: bold;">{{COMPANY}}</span>
                                </div>

                                <div style="height: {{SEPARATOR_SIZE}}px; background: {{BORDER_COLOR}}; margin: 12px 0;"></div>

                                <div id="signature_contact_wrapper" style="line-height: 21px;">
                                    <div>
                                        <span id="signature_email" style="padding-right: 10px;"><small>✉️ <a href="mailto:{{EMAIL}}" target="_blank">{{EMAIL}}</a></small></span>
                                        <span id="signature_phone_number"><small>📞 <a href="tel:{{PHONE_NUMBER}}" target="_blank">{{PHONE_NUMBER}}</a></small></span>
                                    </div>
                                    <div>
                                        <span id="signature_website_url" style="padding-right: 10px;"><small>🔗 <a href="{{WEBSITE_URL}}" target="_blank">{{WEBSITE_NAME}}</a></small></span>
                                        <span id="signature_whatsapp"><small>📱 <a href="https://wa.me/{{WHATSAPP}}" target="_blank">{{WHATSAPP}}</a></small></span>
                                    </div>
                                    <div id="signature_address"><small>📍 <a href="{{ADDRESS_URL}}" target="_blank">{{ADDRESS}}</a></small></div>
                                    <div>
                                        <span id="signature_facebook_messenger" style="padding-right: 10px;"><small>💬 <a href="https://m.me/{{FACEBOOK_MESSENGER}}" target="_blank">{{FACEBOOK_MESSENGER}}</a></small></span>
                                        <span id="signature_telegram"><small>⚡️ <a href="https://t.me/{{TELEGRAM}}" target="_blank">{{TELEGRAM}}</a></small></span>
                                    </div>
                                </div>

                                <div id="signature_socials_wrapper" style="padding-top: 12px;">
                                    <?php foreach(require \Altum\Plugin::get('email-signatures')->path . 'includes/signature_socials.php' as $key => $social): ?>
                                        <span id="<?= 'signature_' . $key ?>" style="padding-right: {{SOCIALS_PADDING}}px; line-height: 30px;">
                                            <a href="<?= sprintf($social['format'], '{{' . mb_strtoupper($key) . '}}') ?>" target="_blank">
                                                <img src="<?= ASSETS_FULL_URL . 'images/signatures/socials/' . $key . '.png' ?>" style="width: {{SOCIALS_WIDTH}}px; height: auto; vertical-align: middle;" alt="<?= $social['name'] ?>" title="<?= $social['name'] ?>" />
                                            </a>
                                        </span>
                                    <?php endforeach ?>
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
</div>

<small id="signature_disclaimer" style="color: #808080;"><br />{{DISCLAIMER}}</small>

<div id="signature_branding"><br />{{BRANDING}}</div>
