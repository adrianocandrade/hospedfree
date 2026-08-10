import type {
  QrCodeType,
  QrCodeTypeData,
} from '@app/dashboard/qr-codes/types/qr-code-types';

export function buildQrCodePayload(
  type: QrCodeType,
  data: QrCodeTypeData,
  longUrl?: string | null,
): string {
  switch (type) {
    case 'url':
      return normalizeUrl(longUrl ?? '');
    case 'pix':
      return buildPixPayload(data);
    case 'wifi':
      return buildWifiPayload(data);
    case 'whatsapp': {
      const phone = normalizePhone(required(data.phone), false);
      const message = data.message?.trim();
      return `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
    }
    case 'phone':
      return `tel:${normalizePhone(required(data.phone))}`;
    case 'email': {
      const email = required(data.email).toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('email');
      const params = new URLSearchParams();
      if (data.subject?.trim()) params.set('subject', data.subject.trim());
      if (data.message?.trim()) params.set('body', data.message.trim());
      return `mailto:${email}${params.size ? `?${params.toString()}` : ''}`;
    }
    case 'sms':
      return `SMSTO:${normalizePhone(required(data.phone))}:${data.message?.trim() ?? ''}`;
    case 'text':
      return required(data.content);
    case 'vcard':
      return buildVCardPayload(data);
    case 'location': {
      const latitude = Number(data.latitude);
      const longitude = Number(data.longitude);
      if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        throw new Error('location');
      }
      return `geo:${latitude},${longitude}`;
    }
  }
}

export function tryBuildQrCodePayload(
  type: QrCodeType,
  data: QrCodeTypeData,
  longUrl?: string | null,
): string | null {
  try {
    return buildQrCodePayload(type, data, longUrl);
  } catch {
    return null;
  }
}

function normalizeUrl(value: string): string {
  const trimmed = required(value);
  if (/^(javascript|data|vbscript):/i.test(trimmed)) throw new Error('url');
  const normalized = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const parsed = new URL(normalized);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('url');
  return parsed.toString();
}

function normalizePhone(value: string, withPlus = true): string {
  const trimmed = value.trim();
  let digits = trimmed.replace(/\D/g, '');
  if (!trimmed.startsWith('+') && digits.length >= 10 && digits.length <= 11) {
    digits = `55${digits}`;
  }
  if (!/^\d{10,15}$/.test(digits)) throw new Error('phone');
  return `${withPlus ? '+' : ''}${digits}`;
}

function buildWifiPayload(data: QrCodeTypeData): string {
  const ssid = escapeWifi(required(data.ssid));
  const security = data.security ?? 'WPA';
  if (!['WPA', 'WEP', 'nopass'].includes(security)) throw new Error('wifi');
  const password =
    security === 'nopass' ? '' : escapeWifi(required(data.password));
  return `WIFI:T:${security};S:${ssid};${password ? `P:${password};` : ''}H:${data.hidden ? 'true' : 'false'};;`;
}

function escapeWifi(value: string): string {
  return value.replace(/[\\;,:"']/g, character => `\\${character}`);
}

function buildVCardPayload(data: QrCodeTypeData): string {
  const firstName = required(data.first_name);
  const lastName = data.last_name?.trim() ?? '';
  const phone = data.phone?.trim()
    ? normalizePhone(data.phone.trim())
    : undefined;
  const email = data.email?.trim().toLowerCase();
  if (email && !/^\S+@\S+\.\S+$/.test(email)) throw new Error('email');
  const website = data.website?.trim()
    ? normalizeUrl(data.website.trim())
    : undefined;
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`,
    `FN:${escapeVCard(`${firstName} ${lastName}`.trim())}`,
  ];
  const fields: [string, string | undefined][] = [
    ['ORG', data.company],
    ['TITLE', data.job_title],
    ['TEL;TYPE=CELL', phone],
    ['EMAIL', email],
    ['URL', website],
    ['ADR;TYPE=WORK', data.address],
    ['NOTE', data.notes],
  ];
  fields.forEach(([field, value]) => {
    if (value?.trim()) lines.push(`${field}:${escapeVCard(value.trim())}`);
  });
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function buildPixPayload(data: QrCodeTypeData): string {
  const key = normalizePixKey(required(data.key_type), required(data.key));
  const name = normalizePixText(required(data.receiver_name), 25);
  const city = normalizePixText(required(data.receiver_city), 15);
  let merchant = tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', key);
  if (data.description?.trim()) {
    const available = Math.max(0, 99 - merchant.length - 4);
    const description = data.description
      .trim()
      .slice(0, Math.min(30, available));
    if (description) merchant += tlv('02', description);
  }
  let payload =
    tlv('00', '01') +
    tlv('26', merchant) +
    tlv('52', '0000') +
    tlv('53', '986');
  if (data.amount?.trim()) {
    const rawAmount = data.amount.trim();
    const normalizedAmount = rawAmount.includes(',')
      ? rawAmount.replace(/\./g, '').replace(',', '.')
      : rawAmount;
    const amount = Number(normalizedAmount);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('amount');
    payload += tlv('54', amount.toFixed(2));
  }
  const txid = data.txid?.trim() || '***';
  if (!/^[A-Za-z0-9*]{1,25}$/.test(txid)) throw new Error('txid');
  payload +=
    tlv('58', 'BR') +
    tlv('59', name) +
    tlv('60', city) +
    tlv('62', tlv('05', txid)) +
    '6304';
  return payload + crc16(payload);
}

function normalizePixKey(type: string, value: string): string {
  if (type === 'cpf' || type === 'cnpj') {
    const digits = value.replace(/\D/g, '');
    const expectedLength = type === 'cpf' ? 11 : 14;
    const valid = type === 'cpf' ? cpfIsValid(digits) : cnpjIsValid(digits);
    if (digits.length !== expectedLength || !valid) {
      throw new Error('pix-key');
    }
    return digits;
  }
  if (type === 'phone') return normalizePhone(value);
  if (type === 'email') {
    const email = value.toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('pix-key');
    return email;
  }
  if (type === 'random') {
    const uuid = value.toLowerCase();
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        uuid,
      )
    ) {
      throw new Error('pix-key');
    }
    return uuid;
  }
  throw new Error('pix-key');
}

export function pixKeyIsValid(type: string, value: string): boolean {
  try {
    normalizePixKey(type, value);
    return true;
  } catch {
    return false;
  }
}

function normalizePixText(value: string, maxLength: number): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function cpfIsValid(value: string): boolean {
  if (value.length !== 11 || /^(\d)\1+$/.test(value)) return false;
  for (let digit = 9; digit < 11; digit++) {
    let sum = 0;
    for (let index = 0; index < digit; index++) {
      sum += Number(value[index]) * (digit + 1 - index);
    }
    const check = (sum * 10) % 11;
    if ((check === 10 ? 0 : check) !== Number(value[digit])) return false;
  }
  return true;
}

function cnpjIsValid(value: string): boolean {
  if (value.length !== 14 || /^(\d)\1+$/.test(value)) return false;
  const calculate = (length: number): number => {
    let sum = 0;
    let weight = length - 7;
    for (let index = 0; index < length; index++) {
      sum += Number(value[index]) * weight--;
      if (weight < 2) weight = 9;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return (
    calculate(12) === Number(value[12]) && calculate(13) === Number(value[13])
  );
}

function tlv(id: string, value: string): string {
  const length = new TextEncoder().encode(value).length;
  if (length > 99) throw new Error('pix-length');
  return `${id}${String(length).padStart(2, '0')}${value}`;
}

function crc16(value: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(value)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function required(value: unknown): string {
  const stringValue = String(value ?? '').trim();
  if (!stringValue) throw new Error('required');
  return stringValue;
}
