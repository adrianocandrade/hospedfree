<?php

namespace Common\Settings\Mail;

use Illuminate\Mail\Events\MessageSending;
use Symfony\Component\Mime\Part\DataPart;
use Symfony\Component\Mime\Part\File;

final class EmbedBrandingLogoInOutgoingEmail
{
    public function __construct(private MailBranding $branding) {}

    public function handle(MessageSending $event): void
    {
        $html = $event->message->getHtmlBody();
        $logo = $this->branding->logo();
        if (
            !$html ||
            !$logo ||
            !$logo['path'] ||
            !str_contains($html, 'data-mail-brand-logo="true"')
        ) {
            return;
        }

        $logoPart = (new DataPart(
            new File($logo['path']),
            basename($logo['path']),
        ))->asInline();
        $event->message->addPart($logoPart);

        $html = preg_replace_callback(
            '/(<img\b(?=[^>]*\bdata-mail-brand-logo="true")[^>]*\bsrc=")[^"]*(")/i',
            fn(array $matches) =>
                $matches[1] . 'cid:' . $logoPart->getContentId() . $matches[2],
            $html,
            1,
        );

        if ($html) {
            $event->message->html(
                str_replace(' data-mail-brand-logo="true"', '', $html),
            );
        }
    }
}
