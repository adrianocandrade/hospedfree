import {
  publicBookingAvailability,
  publicBookingServices,
  publicBookingStore,
} from '@app/gen/public-booking';
import {BookingServiceResource} from '@app/gen/schemas/booking-service-resource';
import type {PublicBookingStore201} from '@app/gen/schemas/public-booking-store201';
import {
  itemStyleCss,
  resolveCollectionItemStyle,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/collection-layout';
import {shouldShowBiolinkSectionHeading} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-section-frame';
import {BiolinkWidgetSurface} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-widget-surface';
import {WidgetRendererProps} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-renderer-props';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Input} from '@shadcn/forms/input/input';
import {Trans} from '@ui/i18n/trans';
import {cn} from '@ui/utils/cn';
import {useQuery} from '@tanstack/react-query';
import {
  ArrowRightIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
} from 'lucide-react';
import {type FormEvent, useState} from 'react';

type Props = WidgetRendererProps & {
  widget: WidgetRendererProps['widget'] & {
    config?: {
      title?: string;
      description?: string;
      serviceIds?: number[];
      showServiceDetails?: boolean;
      layout?: string;
      itemStyle?: Parameters<typeof itemStyleCss>[0];
      section?: {
        presentation?: 'contained' | 'open';
        showTitle?: boolean;
      };
    };
  };
};

type AvailabilitySlot = {
  date?: string;
  time: string;
  startAt?: string;
  endAt?: string;
  availableSpots: number;
};

type BookingConfirmation = PublicBookingStore201['data'];

function ServiceTypeLabel({type}: {type?: string}) {
  switch (type) {
    case 'meeting':
      return <Trans message="Meeting" />;
    case 'class':
      return <Trans message="Class or group" />;
    case 'consultation':
      return <Trans message="Consultation" />;
    case 'salon':
      return <Trans message="Salon" />;
    case 'barbershop':
      return <Trans message="Barbershop" />;
    case 'online':
      return <Trans message="Online service" />;
    case 'other':
      return <Trans message="Other" />;
    default:
      return <Trans message="Individual appointment" />;
  }
}

export function BookingWidgetRenderer({
  widget,
  biolink,
  variant,
  appearance,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedService, setSelectedService] =
    useState<BookingServiceResource | null>(null);
  const [date, setDate] = useState(todayString);
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(
    null,
  );
  const [submitError, setSubmitError] = useState(false);

  const servicesQuery = useQuery({
    queryKey: ['public-booking-services', biolink?.id],
    queryFn: () => publicBookingServices(Number(biolink!.id)),
    enabled: !!biolink?.id && variant !== 'editor',
  });
  const ids = widget.config?.serviceIds ?? [];
  const allServices = servicesQuery.data?.data ?? [];
  const services = ids.length
    ? allServices.filter(service => ids.includes(Number(service.id)))
    : allServices;
  const availabilityQuery = useQuery({
    queryKey: [
      'public-booking-availability',
      biolink?.id,
      selectedService?.id,
      date,
    ],
    queryFn: () =>
      publicBookingAvailability(Number(biolink!.id), {
        service_id: Number(selectedService!.id),
        from: date,
        to: date,
      }),
    enabled:
      !!biolink?.id &&
      !!selectedService &&
      dialogOpen &&
      !submitted &&
      variant !== 'editor',
  });

  if (variant === 'editor') {
    return (
      <div className="w-full rounded-card border p-4">
        <CalendarClockIcon className="mb-2" />
        <strong>{widget.config?.title || <Trans message="Booking" />}</strong>
        <p className="text-sm text-muted-foreground">
          <Trans message="Visitors can book your configured services here." />
        </p>
      </div>
    );
  }

  const slots = (availabilityQuery.data?.data ??
    []) as unknown as AvailabilitySlot[];
  const showHeading = shouldShowBiolinkSectionHeading(widget.config?.section);

  const openService = (service: BookingServiceResource) => {
    setSelectedService(service);
    setDate(todayString());
    setTime('');
    setName('');
    setEmail('');
    setPhone('');
    setSubmitted(false);
    setConfirmation(null);
    setSubmitError(false);
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    setDialogOpen(nextOpen);

    if (!nextOpen) {
      setSelectedService(null);
      setTime('');
      setSubmitted(false);
      setSubmitting(false);
      setConfirmation(null);
      setSubmitError(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!biolink?.id || !selectedService || !time || !name || !email) return;

    setSubmitting(true);
    setSubmitError(false);
    try {
      const result = await publicBookingStore(Number(biolink.id), {
        service_id: Number(selectedService.id),
        date,
        time,
        name,
        email,
        phone: phone || undefined,
      });
      setConfirmation(result.data);
      setSubmitted(true);
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <BiolinkWidgetSurface
        appearance={appearance}
        config={widget.config}
        className="p-4 @2xl:p-5"
      >
        {showHeading ? (
          <header className="mb-3 flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-current/10">
              <CalendarClockIcon className="size-4.5" />
            </span>
            <div className="min-w-0">
              <h2 className="leading-5 font-semibold">
                {widget.config?.title || (
                  <Trans message="Book an appointment" />
                )}
              </h2>
              {widget.config?.description ? (
                <p className="mt-1 text-sm leading-5 opacity-80">
                  {widget.config.description}
                </p>
              ) : null}
            </div>
          </header>
        ) : null}

        {servicesQuery.isLoading ? (
          <p className="text-sm opacity-80">
            <Trans message="Loading booking services..." />
          </p>
        ) : servicesQuery.isError ? (
          <p className="text-sm opacity-80">
            <Trans message="Could not load booking services." />
          </p>
        ) : services.length ? (
          <div className="flex flex-col gap-2.5">
            {services.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                showDetails={widget.config?.showServiceDetails !== false}
                style={itemStyleCss(
                  resolveCollectionItemStyle(
                    appearance,
                    widget.config?.itemStyle,
                  ),
                )}
                onClick={() => openService(service)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm opacity-80">
            <Trans message="No booking services are available right now." />
          </p>
        )}
      </BiolinkWidgetSurface>

      <Dialog.Root open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        {selectedService ? (
          <Dialog.Portal>
            <Dialog.Backdrop className="bg-black/75" />
            <Dialog.Content className="w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl bg-background p-0 text-foreground shadow-2xl @2xl:max-w-lg">
              <Dialog.Header className="border-b px-6 py-5 pe-14 text-center">
                <Dialog.Title className="justify-center text-base">
                  <CalendarClockIcon className="size-4" />
                  {selectedService.name}
                </Dialog.Title>
                <Dialog.Description className="text-center">
                  <Trans message="Choose a time and complete your contact details." />
                </Dialog.Description>
              </Dialog.Header>

              {submitted && confirmation ? (
                <BookingConfirmationPanel confirmation={confirmation} />
              ) : (
                <form onSubmit={submit}>
                  <Dialog.Body className="mx-0 max-h-[min(68vh,560px)] space-y-4 px-6 py-5">
                    <ServiceSummary service={selectedService} />

                    <label className="block text-sm">
                      <span className="mb-1 block font-medium">
                        <Trans message="Date" />
                      </span>
                      <Input
                        type="date"
                        min={todayString()}
                        value={date}
                        onChange={event => {
                          setDate(event.target.value);
                          setTime('');
                          setSubmitError(false);
                        }}
                      />
                    </label>

                    <div>
                      <div className="mb-2 text-sm font-medium">
                        <Trans message="Available times" />
                      </div>
                      {availabilityQuery.isFetching ? (
                        <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                          <Trans message="Loading available times..." />
                        </p>
                      ) : slots.length ? (
                        <div className="flex flex-wrap gap-2" role="radiogroup">
                          {slots.map(slot => (
                            <Button
                              key={`${slot.date ?? date}-${slot.time}`}
                              type="button"
                              size="sm"
                              variant="outline"
                              aria-pressed={time === slot.time}
                              className={cn(
                                'min-w-16',
                                time === slot.time &&
                                  'border-primary bg-primary/10 text-primary',
                              )}
                              onClick={() => {
                                setTime(slot.time);
                                setSubmitError(false);
                              }}
                            >
                              {slot.time}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                          <Trans message="No available times for this date." />
                        </p>
                      )}
                    </div>

                    <div className="grid gap-3 @2xl:grid-cols-2">
                      <label className="block text-sm">
                        <span className="mb-1 block font-medium">
                          <Trans message="Name" />
                        </span>
                        <Input
                          required
                          value={name}
                          onChange={event => setName(event.target.value)}
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="mb-1 block font-medium">
                          <Trans message="Email" />
                        </span>
                        <Input
                          required
                          type="email"
                          value={email}
                          onChange={event => setEmail(event.target.value)}
                        />
                      </label>
                      <label className="block text-sm @2xl:col-span-2">
                        <span className="mb-1 block font-medium">
                          <Trans message="Phone (optional)" />
                        </span>
                        <Input
                          type="tel"
                          value={phone}
                          onChange={event => setPhone(event.target.value)}
                        />
                      </label>
                    </div>

                    {submitError ? (
                      <p className="text-sm text-destructive">
                        <Trans message="This time is no longer available. Please choose another one." />
                      </p>
                    ) : null}
                  </Dialog.Body>
                  <div className="border-t bg-muted/40 px-6 py-4">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!time || !name || !email || submitting}
                    >
                      {submitting ? (
                        <Trans message="Confirming..." />
                      ) : (
                        <Trans message="Confirm booking" />
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </Dialog.Root>
    </>
  );
}

function ServiceCard({
  service,
  showDetails,
  style,
  onClick,
}: {
  service: BookingServiceResource;
  showDetails: boolean;
  style?: ReturnType<typeof itemStyleCss>;
  onClick: () => void;
}) {
  const price = formatServicePrice(service);

  return (
    <button
      type="button"
      className={cn(
        'biolink-product-card biolink-surface-item grid min-h-20 w-full min-w-0 grid-cols-[2.25rem_minmax(0,1fr)_1.25rem] items-center gap-3 rounded-lg border p-3.5 text-left text-inherit outline-none focus-visible:ring',
      )}
      style={style}
      onClick={onClick}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-current/10">
        <CalendarClockIcon className="size-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block leading-5 wrap-break-word">
          {service.name}
        </strong>
        {showDetails && service.description ? (
          <span className="mt-1 line-clamp-2 block text-sm leading-5 opacity-80">
            {service.description}
          </span>
        ) : null}
        {showDetails ? (
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium opacity-80">
            <span>
              <ServiceTypeLabel type={service.service_type} />
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarClockIcon className="size-3.5" />
              {service.duration_minutes} <Trans message="minutes" />
            </span>
            {price ? <span>{price}</span> : null}
          </span>
        ) : null}
      </span>
      <ArrowRightIcon className="size-4 shrink-0 justify-self-end opacity-65" />
    </button>
  );
}

function ServiceSummary({service}: {service: BookingServiceResource}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
      <div className="font-medium">{service.name}</div>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>
          <ServiceTypeLabel type={service.service_type} />
        </span>
        <span>
          {service.duration_minutes} <Trans message="minutes" />
        </span>
        {formatServicePrice(service) ? (
          <span>{formatServicePrice(service)}</span>
        ) : null}
      </div>
    </div>
  );
}

function BookingConfirmationPanel({
  confirmation,
}: {
  confirmation: BookingConfirmation;
}) {
  return (
    <div className="space-y-4 px-6 py-6">
      <div className="rounded-lg bg-positive/10 p-4 text-sm text-positive">
        <div className="flex items-center gap-2 font-medium">
          <CheckCircle2Icon className="size-5" />
          <Trans message="Booking confirmed. Check your email for the management link." />
        </div>
      </div>
      <div className="space-y-3 text-sm">
        {confirmation.meeting_url ? (
          <a
            className="block underline underline-offset-2"
            href={confirmation.meeting_url}
            target="_blank"
            rel="noreferrer"
          >
            <Trans message="Open meeting link" />
          </a>
        ) : null}
        {confirmation.payment_url ? (
          <a
            className="block underline underline-offset-2"
            href={confirmation.payment_url}
            target="_blank"
            rel="noreferrer"
          >
            <Trans message="Open payment link" />
          </a>
        ) : null}
        {confirmation.pix_key ? (
          <div>
            <strong className="block">
              <Trans message="PIX details" />
            </strong>
            <span className="break-all">{confirmation.pix_key}</span>
          </div>
        ) : null}
        {confirmation.payment_confirmation_url ? (
          <a
            className="block underline underline-offset-2"
            href={confirmation.payment_confirmation_url}
            target="_blank"
            rel="noreferrer"
          >
            <Trans message="Send payment receipt" />
          </a>
        ) : null}
        {confirmation.payment_confirmation_instructions ? (
          <p>{confirmation.payment_confirmation_instructions}</p>
        ) : null}
      </div>
      <Dialog.CloseButton className="w-full" color="primary">
        <Trans message="Done" />
      </Dialog.CloseButton>
    </div>
  );
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatServicePrice(service: BookingServiceResource): string | null {
  if (!service.price) {
    return null;
  }

  const amount = Number(service.price);
  if (Number.isNaN(amount)) {
    return null;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: service.currency || 'USD',
    }).format(amount);
  } catch {
    return `${service.currency || ''} ${amount.toFixed(2)}`.trim();
  }
}
