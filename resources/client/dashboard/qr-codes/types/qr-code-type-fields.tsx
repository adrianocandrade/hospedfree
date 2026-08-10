import {LocationQrCodeFields} from '@app/dashboard/qr-codes/types/fields/location-qr-code-fields';
import {MessagingQrCodeFields} from '@app/dashboard/qr-codes/types/fields/messaging-qr-code-fields';
import {PixQrCodeFields} from '@app/dashboard/qr-codes/types/fields/pix-qr-code-fields';
import {TextQrCodeFields} from '@app/dashboard/qr-codes/types/fields/text-qr-code-fields';
import {UrlQrCodeFields} from '@app/dashboard/qr-codes/types/fields/url-qr-code-fields';
import {VCardQrCodeFields} from '@app/dashboard/qr-codes/types/fields/vcard-qr-code-fields';
import {WifiQrCodeFields} from '@app/dashboard/qr-codes/types/fields/wifi-qr-code-fields';
import {QrCodeType} from '@app/dashboard/qr-codes/types/qr-code-types';

export function QrCodeTypeFields({type}: {type: QrCodeType}) {
  switch (type) {
    case 'url':
      return <UrlQrCodeFields />;
    case 'pix':
      return <PixQrCodeFields />;
    case 'wifi':
      return <WifiQrCodeFields />;
    case 'whatsapp':
    case 'phone':
    case 'email':
    case 'sms':
      return <MessagingQrCodeFields type={type} />;
    case 'text':
      return <TextQrCodeFields />;
    case 'vcard':
      return <VCardQrCodeFields />;
    case 'location':
      return <LocationQrCodeFields />;
  }
}
