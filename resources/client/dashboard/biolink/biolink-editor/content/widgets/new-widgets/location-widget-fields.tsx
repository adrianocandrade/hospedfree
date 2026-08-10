import {LeafletMap} from '@app/dashboard/biolink/biolink-editor/content/widgets/new-widgets/leaflet-map';
import {
  parseCoordinates,
  type MapDestinationProvider,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/new-widgets/location-map-utils';
import type {SimpleConfigWidgetFormValue} from '@app/dashboard/biolink/biolink-editor/content/widgets/new-widgets/new-widgets';
import {Button} from '@shadcn/button/button';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {Select} from '@shadcn/forms/select/select';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {
  LoaderCircleIcon,
  LocateFixedIcon,
  MapPinIcon,
  SearchIcon,
} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import {type UseFormReturn} from 'react-hook-form';

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

interface LocationWidgetFieldsProps {
  form: UseFormReturn<SimpleConfigWidgetFormValue>;
}

export function LocationWidgetFields({form}: LocationWidgetFieldsProps) {
  const {trans} = useTrans();
  const cepAbortRef = useRef<AbortController | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [positionLoading, setPositionLoading] = useState(false);
  const [positionStatus, setPositionStatus] = useState('');

  useEffect(() => {
    return () => cepAbortRef.current?.abort();
  }, []);

  const handleCepSearch = async () => {
    const cep = form.getValues('cep') ?? '';
    const cleanCep = cep.replace(/\D/g, '');
    setCepError('');

    if (cleanCep.length !== 8) {
      setCepError(trans(message('Enter a valid 8-digit postal code.')));
      return;
    }

    cepAbortRef.current?.abort();
    const controller = new AbortController();
    cepAbortRef.current = controller;
    setCepLoading(true);
    const data = await fetchViaCep(cleanCep, controller.signal);

    if (controller.signal.aborted) {
      return;
    }

    setCepLoading(false);

    if (!data) {
      setCepError(
        trans(message('Postal code not found. Enter the address manually.')),
      );
      return;
    }

    const nextValues = {
      street: data.logradouro ?? '',
      neighborhood: data.bairro ?? '',
      city: data.localidade ?? '',
      state: data.uf ?? '',
      cep: data.cep ?? cep,
    };

    Object.entries(nextValues).forEach(([field, value]) => {
      form.setValue(
        field as 'street' | 'neighborhood' | 'city' | 'state' | 'cep',
        value,
        {shouldDirty: true},
      );
    });
    form.setValue('latitude', '', {shouldDirty: true});
    form.setValue('longitude', '', {shouldDirty: true});
    form.setValue(
      'address',
      formatAddress({...form.getValues(), ...nextValues}),
      {shouldDirty: true},
    );
    setPositionStatus(
      trans(message('Address found. Choose the exact point on the map.')),
    );
  };

  const setPosition = (latitude: number, longitude: number) => {
    form.setValue('latitude', latitude.toFixed(6), {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue('longitude', longitude.toFixed(6), {
      shouldDirty: true,
      shouldValidate: true,
    });
    setPositionStatus(trans(message('Position selected on the map.')));
  };

  const handleCurrentPosition = () => {
    if (!navigator.geolocation) {
      setPositionStatus(
        trans(message('Your browser does not support location access.')),
      );
      return;
    }

    setPositionLoading(true);
    setPositionStatus(trans(message('Getting your current position...')));
    navigator.geolocation.getCurrentPosition(
      position => {
        setPositionLoading(false);
        setPosition(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setPositionLoading(false);
        setPositionStatus(
          trans(
            message(
              'Location access was not allowed. Select the point on the map or enter coordinates.',
            ),
          ),
        );
      },
      {enableHighAccuracy: true, timeout: 10000, maximumAge: 60000},
    );
  };

  const coordinates = parseCoordinates(
    form.watch('latitude'),
    form.watch('longitude'),
  );
  const mapProvider =
    (form.watch('mapProvider') as MapDestinationProvider | undefined) ??
    'openstreetmap';

  return (
    <>
      <div className="flex items-end gap-2">
        <HookForm.Field name="cep" className="min-w-0 flex-1">
          <Field.Label>
            <Trans message="Postal code (CEP)" />
          </Field.Label>
          <Input
            placeholder="00000-000"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={9}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleCepSearch();
              }
            }}
          />
          <Field.Error />
        </HookForm.Field>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 shrink-0"
          disabled={cepLoading}
          onClick={handleCepSearch}
        >
          {cepLoading ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            <SearchIcon className="size-4" />
          )}
          <Trans message="Search address" />
        </Button>
      </div>

      {cepError ? (
        <div className="-mt-2 text-sm text-destructive" role="alert">
          {cepError}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
        <HookForm.Field name="street">
          <Field.Label>
            <Trans message="Street" />
          </Field.Label>
          <Input autoComplete="address-line1" />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="number">
          <Field.Label>
            <Trans message="Number" />
          </Field.Label>
          <Input />
          <Field.Error />
        </HookForm.Field>
      </div>

      <HookForm.Field name="complement">
        <Field.Label>
          <Trans message="Complement (optional)" />
        </Field.Label>
        <Input autoComplete="address-line2" />
        <Field.Error />
      </HookForm.Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <HookForm.Field name="neighborhood">
          <Field.Label>
            <Trans message="Neighborhood" />
          </Field.Label>
          <Input />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="city">
          <Field.Label>
            <Trans message="City" />
          </Field.Label>
          <Input autoComplete="address-level2" />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="state">
          <Field.Label>
            <Trans message="State (UF)" />
          </Field.Label>
          <Input autoComplete="address-level1" maxLength={2} />
          <Field.Error />
        </HookForm.Field>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-sm font-medium">
            <Trans message="Exact position" />
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            <Trans message="Click the map to place the pin. The preview uses OpenStreetMap and does not require a paid API key." />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={positionLoading}
          onClick={handleCurrentPosition}
        >
          {positionLoading ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            <LocateFixedIcon className="size-4" />
          )}
          <Trans message="Use my current position" />
        </Button>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-card border">
        <LeafletMap
          latitude={coordinates ? Number(coordinates.latitude) : undefined}
          longitude={coordinates ? Number(coordinates.longitude) : undefined}
          address={formatAddress(form.getValues())}
          className="h-full w-full [&_.leaflet-container]:cursor-crosshair"
          onPositionChange={setPosition}
        />
      </div>

      {positionStatus ? (
        <div
          className="-mt-2 flex items-start gap-2 text-sm text-muted-foreground"
          aria-live="polite"
        >
          <MapPinIcon className="mt-0.5 size-4 shrink-0" />
          {positionStatus}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <HookForm.Field name="latitude">
          <Field.Label>
            <Trans message="Latitude" />
          </Field.Label>
          <Input
            type="number"
            inputMode="decimal"
            min={-90}
            max={90}
            step="0.000001"
            placeholder="-23.550520"
          />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="longitude">
          <Field.Label>
            <Trans message="Longitude" />
          </Field.Label>
          <Input
            type="number"
            inputMode="decimal"
            min={-180}
            max={180}
            step="0.000001"
            placeholder="-46.633308"
          />
          <Field.Error />
        </HookForm.Field>
      </div>

      <HookForm.Field name="mapProvider">
        <Field.Label>
          <Trans message="Open directions with" />
        </Field.Label>
        <Select.Root
          items={[
            {
              value: 'openstreetmap',
              label: <Trans message="OpenStreetMap" />,
            },
            {value: 'google', label: <Trans message="Google Maps" />},
            {value: 'waze', label: <Trans message="Waze" />},
            {value: 'custom', label: <Trans message="Custom map link" />},
          ]}
        >
          <Select.Trigger className="w-full">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="openstreetmap">
              <Trans message="OpenStreetMap" />
            </Select.Item>
            <Select.Item value="google">
              <Trans message="Google Maps" />
            </Select.Item>
            <Select.Item value="waze">
              <Trans message="Waze" />
            </Select.Item>
            <Select.Item value="custom">
              <Trans message="Custom map link" />
            </Select.Item>
          </Select.Content>
        </Select.Root>
        <Field.Description>
          <Trans message="This only changes where visitors open directions. The map preview remains free with OpenStreetMap." />
        </Field.Description>
        <Field.Error />
      </HookForm.Field>

      {mapProvider === 'custom' ? (
        <HookForm.Field name="url">
          <Field.Label>
            <Trans message="Custom map URL" />
          </Field.Label>
          <Input
            type="url"
            inputMode="url"
            placeholder="https://maps.example.com/location"
          />
          <Field.Description>
            <Trans message="Paste a public HTTPS link from another maps or navigation service." />
          </Field.Description>
          <Field.Error />
        </HookForm.Field>
      ) : null}

      <input type="hidden" {...form.register('address')} />
    </>
  );
}

async function fetchViaCep(
  cep: string,
  signal: AbortSignal,
): Promise<ViaCepResponse | null> {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as ViaCepResponse;
    return data.erro ? null : data;
  } catch {
    return null;
  }
}

function formatAddress(
  values: Pick<
    SimpleConfigWidgetFormValue,
    | 'street'
    | 'number'
    | 'complement'
    | 'neighborhood'
    | 'city'
    | 'state'
    | 'cep'
  >,
): string {
  const parts: string[] = [];

  if (values.street) {
    let firstLine = values.street;
    if (values.number) firstLine += `, ${values.number}`;
    if (values.complement) firstLine += ` - ${values.complement}`;
    parts.push(firstLine);
  }
  if (values.neighborhood) parts.push(values.neighborhood);
  if (values.city || values.state) {
    parts.push([values.city, values.state].filter(Boolean).join(' - '));
  }
  if (values.cep) parts.push(values.cep);

  return parts.join(', ');
}
