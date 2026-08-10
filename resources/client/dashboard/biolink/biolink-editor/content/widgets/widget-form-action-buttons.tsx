import {LinkFormActionButtons} from '@app/dashboard/links/forms/link-form-action-buttons';
import {useEffect} from 'react';
import type {UseFormReturn} from 'react-hook-form';

const advancedFieldNames = [
  'password',
  'activates_at',
  'expires_at',
  'utm',
  'utm_custom',
  'pixels',
  'rules',
] as const;

export type WidgetAdvancedFormFields = {
  password?: string | null;
  activates_at?: string | null;
  expires_at?: string | null;
  utm?: Record<string, string | null | undefined>;
  utm_custom?: {key: string; value: string}[];
  pixels?: ({id: number; name?: string} | number)[];
  rules?: {type: string; key?: string | null; value?: string | null}[];
};

type WidgetAdvancedDefaultsSource = {
  password?: string | null;
  activates_at?: string | null;
  expires_at?: string | null;
  utm?: string | null;
  pixels?: ({id: number; name?: string} | number)[];
  rules?: {type: string; key?: string | null; value?: string | null}[];
};

export function WidgetFormActionButtons({
  form,
  widget,
}: {
  form: UseFormReturn<any>;
  widget?: WidgetAdvancedDefaultsSource;
}) {
  useWidgetAdvancedDefaults(form, widget);

  return <LinkFormActionButtons form={form as never} />;
}

export function widgetAdvancedDefaultValues(
  widget?: WidgetAdvancedDefaultsSource,
): WidgetAdvancedFormFields {
  return {
    password: widget?.password ?? '',
    activates_at: widget?.activates_at ?? '',
    expires_at: widget?.expires_at ?? '',
    utm: parseUtm(widget?.utm),
    utm_custom: [],
    pixels: widget?.pixels ?? [],
    rules:
      widget?.rules?.map(rule => ({
        type: rule.type,
        key: rule.key ?? null,
        value: rule.value ?? null,
      })) ?? [],
  };
}

export function widgetAdvancedPayload(
  values: unknown,
): WidgetAdvancedFormFields {
  if (!isRecord(values)) {
    return {};
  }

  const payload: WidgetAdvancedFormFields = {};

  if ('password' in values) {
    payload.password =
      typeof values.password === 'string' && values.password
        ? values.password
        : null;
  }
  if ('activates_at' in values) {
    payload.activates_at =
      typeof values.activates_at === 'string' && values.activates_at
        ? values.activates_at
        : null;
  }
  if ('expires_at' in values) {
    payload.expires_at =
      typeof values.expires_at === 'string' && values.expires_at
        ? values.expires_at
        : null;
  }
  if ('utm' in values) {
    payload.utm = isRecord(values.utm) ? values.utm : {};
  }
  if ('utm_custom' in values) {
    payload.utm_custom = Array.isArray(values.utm_custom)
      ? values.utm_custom
      : [];
  }
  if ('pixels' in values) {
    payload.pixels = Array.isArray(values.pixels) ? values.pixels : [];
  }
  if ('rules' in values) {
    payload.rules = Array.isArray(values.rules) ? values.rules : [];
  }

  return payload;
}

export function withoutWidgetAdvancedFields(
  config: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(config).filter(
      ([key]) =>
        !advancedFieldNames.includes(
          key as (typeof advancedFieldNames)[number],
        ),
    ),
  );
}

function useWidgetAdvancedDefaults(
  form: UseFormReturn<any>,
  widget?: WidgetAdvancedDefaultsSource,
) {
  useEffect(() => {
    const current = form.getValues() as Record<string, unknown>;
    const defaults = widgetAdvancedDefaultValues(widget);

    advancedFieldNames.forEach(field => {
      if (!(field in current)) {
        form.setValue(field, defaults[field], {shouldDirty: false});
      }
    });
  }, [form, widget]);
}

function parseUtm(value?: string | null): Record<string, string> {
  return value ? Object.fromEntries(new URLSearchParams(value)) : {};
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
