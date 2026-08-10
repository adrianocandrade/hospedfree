import {CrupdateQrCodeBody} from '@app/gen/schemas/crupdate-qr-code-body';
import {Trans} from '@ui/i18n/trans';
import {
  BadgeDollarSignIcon,
  ContactRoundIcon,
  LinkIcon,
  MailIcon,
  MapPinnedIcon,
  MessageCircleIcon,
  MessageSquareTextIcon,
  PhoneIcon,
  TypeIcon,
  WifiIcon,
  type LucideIcon,
} from 'lucide-react';
import {ReactNode} from 'react';

export type QrCodeType =
  | 'url'
  | 'pix'
  | 'wifi'
  | 'whatsapp'
  | 'phone'
  | 'email'
  | 'sms'
  | 'text'
  | 'vcard'
  | 'location';

export interface QrCodeTypeData {
  [key: string]: unknown;
  key_type?: 'cpf' | 'cnpj' | 'phone' | 'email' | 'random';
  key?: string;
  receiver_name?: string;
  receiver_city?: string;
  amount?: string;
  description?: string;
  txid?: string;
  ssid?: string;
  security?: 'WPA' | 'WEP' | 'nopass';
  password?: string;
  hidden?: boolean;
  phone?: string;
  message?: string;
  email?: string;
  subject?: string;
  content?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  job_title?: string;
  website?: string;
  address?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
}

export type QrCodeFormValues = Omit<CrupdateQrCodeBody, 'type' | 'data'> & {
  type: QrCodeType;
  data: QrCodeTypeData;
};

export interface QrCodeTypeOption {
  value: QrCodeType;
  label: ReactNode;
  labelText: string;
  icon: LucideIcon;
  primary: boolean;
}

export interface QrCodeCapabilities {
  tracking: boolean;
  retargeting: boolean;
  password: boolean;
  scheduling: boolean;
}

export const qrCodeTypeOptions: QrCodeTypeOption[] = [
  {
    value: 'url',
    label: <Trans message="Link / URL" />,
    labelText: 'Link / URL',
    icon: LinkIcon,
    primary: true,
  },
  {
    value: 'pix',
    label: <Trans message="Pix" />,
    labelText: 'Pix',
    icon: BadgeDollarSignIcon,
    primary: true,
  },
  {
    value: 'wifi',
    label: <Trans message="Wi-Fi" />,
    labelText: 'Wi-Fi',
    icon: WifiIcon,
    primary: true,
  },
  {
    value: 'whatsapp',
    label: <Trans message="WhatsApp" />,
    labelText: 'WhatsApp',
    icon: MessageCircleIcon,
    primary: true,
  },
  {
    value: 'phone',
    label: <Trans message="Phone" />,
    labelText: 'Telefone',
    icon: PhoneIcon,
    primary: true,
  },
  {
    value: 'email',
    label: <Trans message="Email" />,
    labelText: 'E-mail',
    icon: MailIcon,
    primary: true,
  },
  {
    value: 'text',
    label: <Trans message="Text" />,
    labelText: 'Texto',
    icon: TypeIcon,
    primary: true,
  },
  {
    value: 'sms',
    label: <Trans message="SMS" />,
    labelText: 'SMS',
    icon: MessageSquareTextIcon,
    primary: false,
  },
  {
    value: 'vcard',
    label: <Trans message="Contact / vCard" />,
    labelText: 'Contato / vCard',
    icon: ContactRoundIcon,
    primary: false,
  },
  {
    value: 'location',
    label: <Trans message="Location" />,
    labelText: 'Localização',
    icon: MapPinnedIcon,
    primary: false,
  },
];

export const qrCodeCapabilities: Record<QrCodeType, QrCodeCapabilities> =
  Object.fromEntries(
    qrCodeTypeOptions.map(option => {
      const supported = option.value === 'url' || option.value === 'whatsapp';
      return [
        option.value,
        {
          tracking: supported,
          retargeting: supported,
          password: supported,
          scheduling: supported,
        },
      ];
    }),
  ) as Record<QrCodeType, QrCodeCapabilities>;

const allowedDataFields: Record<QrCodeType, (keyof QrCodeTypeData)[]> = {
  url: [],
  pix: [
    'key_type',
    'key',
    'receiver_name',
    'receiver_city',
    'amount',
    'description',
    'txid',
  ],
  wifi: ['ssid', 'security', 'password', 'hidden'],
  whatsapp: ['phone', 'message'],
  phone: ['phone'],
  email: ['email', 'subject', 'message'],
  sms: ['phone', 'message'],
  text: ['content'],
  vcard: [
    'first_name',
    'last_name',
    'company',
    'job_title',
    'phone',
    'email',
    'website',
    'address',
    'notes',
  ],
  location: ['latitude', 'longitude', 'location_name'],
};

export function getDefaultQrCodeData(type: QrCodeType): QrCodeTypeData {
  if (type === 'pix') return {key_type: 'cpf'};
  if (type === 'wifi') return {security: 'WPA', hidden: false};
  return {};
}

export function sanitizeQrCodeFormValues(
  values: QrCodeFormValues,
): QrCodeFormValues {
  const data = Object.fromEntries(
    allowedDataFields[values.type]
      .filter(key => values.data?.[key] !== undefined)
      .map(key => [key, values.data[key]]),
  ) as QrCodeTypeData;

  if (values.type === 'wifi' && data.security === 'nopass') {
    delete data.password;
  }

  const sanitized: QrCodeFormValues = {...values, data};
  if (values.type !== 'url') delete sanitized.long_url;

  if (!qrCodeCapabilities[values.type].tracking) {
    delete sanitized.utm;
    delete sanitized.utm_custom;
    delete sanitized.pixels;
    delete sanitized.rules;
    delete sanitized.password;
    delete sanitized.expires_at;
    delete sanitized.activates_at;
    delete sanitized.short_link;
  }

  return sanitized;
}

export function getQrCodeTypeOption(type: QrCodeType): QrCodeTypeOption {
  return qrCodeTypeOptions.find(option => option.value === type)!;
}
