<?php

namespace App\QrCodes;

enum QrCodeType: string
{
    case Url = 'url';
    case Pix = 'pix';
    case Wifi = 'wifi';
    case Whatsapp = 'whatsapp';
    case Phone = 'phone';
    case Email = 'email';
    case Sms = 'sms';
    case Text = 'text';
    case Vcard = 'vcard';
    case Location = 'location';

    public function supportsRedirectCapabilities(): bool
    {
        return in_array($this, [self::Url, self::Whatsapp], true);
    }

    /** @return array{tracking: bool, retargeting: bool, password: bool, scheduling: bool} */
    public function capabilities(): array
    {
        $supported = $this->supportsRedirectCapabilities();

        return [
            'tracking' => $supported,
            'retargeting' => $supported,
            'password' => $supported,
            'scheduling' => $supported,
        ];
    }
}
