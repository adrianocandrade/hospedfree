import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {bookingAppointmentsIndex} from '@app/gen/booking-appointments';
import {
  bookingMailConnectionsIndex,
  bookingMailConnectionsDestroy,
  bookingMailConnectionsStore,
  bookingMailConnectionsTest,
} from '@app/gen/booking-mail-connections';
import {
  bookingServicesDestroy,
  bookingServicesIndex,
  bookingServicesStore,
  bookingServicesUpdate,
} from '@app/gen/booking-services';
import {bookingAppointmentsUpdate} from '@app/gen/booking-appointments';
import {
  bookingAvailabilityShow,
  bookingAvailabilityUpdate,
} from '@app/gen/booking-availability';
import type {CrupdateBookingServiceRequest} from '@app/gen/schemas/crupdate-booking-service-request';
import type {CrupdateBookingServiceRequestServiceType} from '@app/gen/schemas/crupdate-booking-service-request-service-type';
import {VisualOptionGrid} from '@app/dashboard/biolink/biolink-editor/visual-option-card';
import {Button} from '@shadcn/button/button';
import {Input} from '@shadcn/forms/input/input';
import {Textarea} from '@shadcn/forms/textarea/textarea';
import {Tabs} from '@shadcn/tabs/tabs';
import {toast} from '@shadcn/toast/toast';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  BriefcaseBusinessIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  GraduationCapIcon,
  LaptopIcon,
  LinkIcon,
  MailIcon,
  PlusIcon,
  QrCodeIcon,
  ScissorsIcon,
  Settings2Icon,
  StethoscopeIcon,
  Trash2Icon,
  UsersIcon,
  VideoIcon,
} from 'lucide-react';
import {useEffect, useState} from 'react';

const emptyServiceForm = (): CrupdateBookingServiceRequest => ({
  name: '',
  service_type: 'appointment',
  duration_minutes: 30,
  slot_interval_minutes: null,
  capacity: null,
  active: true,
});

const meetingServiceTypes = new Set(['meeting', 'class', 'online']);

const serviceTypeOptions = [
  {
    value: 'appointment' as const,
    label: <Trans message="Individual appointment" />,
    description: <Trans message="One person per scheduled service." />,
    preview: <CalendarClockIcon className="size-6" />,
  },
  {
    value: 'meeting' as const,
    label: <Trans message="Meeting" />,
    description: <Trans message="A presentation or scheduled meeting." />,
    preview: <VideoIcon className="size-6" />,
  },
  {
    value: 'class' as const,
    label: <Trans message="Class or group" />,
    description: <Trans message="A session with multiple participants." />,
    preview: <GraduationCapIcon className="size-6" />,
  },
  {
    value: 'consultation' as const,
    label: <Trans message="Consultation" />,
    description: <Trans message="Guidance, evaluation or consulting." />,
    preview: <StethoscopeIcon className="size-6" />,
  },
  {
    value: 'salon' as const,
    label: <Trans message="Salon" />,
    description: <Trans message="Hair, beauty or personal care." />,
    preview: <ScissorsIcon className="size-6" />,
  },
  {
    value: 'barbershop' as const,
    label: <Trans message="Barbershop" />,
    description: <Trans message="Barber services and appointments." />,
    preview: <BriefcaseBusinessIcon className="size-6" />,
  },
  {
    value: 'online' as const,
    label: <Trans message="Online service" />,
    description: <Trans message="A service delivered online." />,
    preview: <LaptopIcon className="size-6" />,
  },
  {
    value: 'other' as const,
    label: <Trans message="Other" />,
    description: <Trans message="Another type of service." />,
    preview: <CalendarDaysIcon className="size-6" />,
  },
];

export function Component() {
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const id = Number(biolinkId);
  const client = useQueryClient();
  const {trans} = useTrans();
  const [section, setSection] = useState('services');
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [serviceForm, setServiceForm] =
    useState<CrupdateBookingServiceRequest>(emptyServiceForm);
  const [serviceUsesPageDefaults, setServiceUsesPageDefaults] = useState(true);
  const [availabilityRules, setAvailabilityRules] = useState<any[]>([]);
  const [availabilityExceptions, setAvailabilityExceptions] = useState<any[]>(
    [],
  );
  const [mailForm, setMailForm] = useState({
    name: '',
    provider: 'smtp',
    from_address: '',
    from_name: '',
    reply_to: '',
    credentials: {
      host: '',
      port: '587',
      username: '',
      password: '',
      encryption: 'tls',
    },
  });
  const services = useQuery({
    queryKey: ['booking-services', id],
    queryFn: () => bookingServicesIndex(id),
  });
  const availability = useQuery({
    queryKey: ['booking-availability', id],
    queryFn: () => bookingAvailabilityShow(id),
  });
  const appointments = useQuery({
    queryKey: ['booking-appointments', id],
    queryFn: () => bookingAppointmentsIndex(id),
  });
  const mailConnections = useQuery({
    queryKey: ['booking-mail-connections', id],
    queryFn: () => bookingMailConnectionsIndex(id),
  });
  const invalidate = () =>
    client.invalidateQueries({queryKey: ['booking-services', id]});
  const createService = useMutation({
    mutationFn: () => bookingServicesStore(id, serviceForm),
    onSuccess: () => {
      setServiceForm(emptyServiceForm());
      setServiceUsesPageDefaults(true);
      setServiceFormOpen(false);
      invalidate();
      toast.success(<Trans message="Service created" />);
    },
    onError: () =>
      toast.error(
        <Trans message="Could not save service. Check the fields and try again." />,
      ),
  });
  const updateService = useMutation({
    mutationFn: () =>
      bookingServicesUpdate(id, editingServiceId as number, serviceForm),
    onSuccess: () => {
      setEditingServiceId(null);
      setServiceForm(emptyServiceForm());
      setServiceUsesPageDefaults(true);
      setServiceFormOpen(false);
      invalidate();
      toast.success(<Trans message="Service updated" />);
    },
    onError: () =>
      toast.error(
        <Trans message="Could not save service. Check the fields and try again." />,
      ),
  });
  const deleteService = useMutation({
    mutationFn: (serviceId: number) => bookingServicesDestroy(id, serviceId),
    onSuccess: invalidate,
  });
  const updateAppointment = useMutation({
    mutationFn: ({
      appointmentId,
      status,
    }: {
      appointmentId: number;
      status: string;
    }) => bookingAppointmentsUpdate(id, appointmentId, {status: status as any}),
    onSuccess: () => {
      client.invalidateQueries({queryKey: ['booking-appointments', id]});
      toast.success(<Trans message="Appointment updated" />);
    },
  });
  const saveAvailability = useMutation({
    mutationFn: (body: Parameters<typeof bookingAvailabilityUpdate>[1]) =>
      bookingAvailabilityUpdate(id, body),
    onSuccess: () => {
      client.invalidateQueries({queryKey: ['booking-availability', id]});
      toast.success(<Trans message="Availability saved" />);
    },
  });
  const createMailConnection = useMutation({
    mutationFn: () => bookingMailConnectionsStore(id, mailForm as any),
    onSuccess: () => {
      client.invalidateQueries({queryKey: ['booking-mail-connections', id]});
      setMailForm({
        name: '',
        provider: 'smtp',
        from_address: '',
        from_name: '',
        reply_to: '',
        credentials: {
          host: '',
          port: '587',
          username: '',
          password: '',
          encryption: 'tls',
        },
      });
      toast.success(<Trans message="Email connection saved" />);
    },
  });
  const deleteMailConnection = useMutation({
    mutationFn: (connectionId: number) =>
      bookingMailConnectionsDestroy(id, connectionId),
    onSuccess: () =>
      client.invalidateQueries({queryKey: ['booking-mail-connections', id]}),
  });
  const testMailConnection = useMutation({
    mutationFn: (connectionId: number) =>
      bookingMailConnectionsTest(id, connectionId),
    onSuccess: () => toast.success(<Trans message="Email connection tested" />),
  });

  const settings = (availability.data as any)?.settings ?? {};
  const selectedServiceType = serviceForm.service_type ?? 'appointment';
  const supportsMeeting = meetingServiceTypes.has(selectedServiceType);
  const hasPaymentDetails = Boolean(
    serviceForm.payment_url?.trim() || serviceForm.pix_key?.trim(),
  );
  useEffect(() => {
    const serverRules = (availability.data as any)?.rules;
    if (Array.isArray(serverRules)) setAvailabilityRules(serverRules);
    const serverExceptions = (availability.data as any)?.exceptions;
    if (Array.isArray(serverExceptions))
      setAvailabilityExceptions(serverExceptions);
  }, [availability.data]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          <Trans message="Bookings" />
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <Trans message="Manage services, availability, appointments and booking notifications for this page." />
        </p>
      </div>
      <Tabs.Root value={section} onValueChange={setSection}>
        <Tabs.List variant="default">
          <Tabs.Tab value="services">
            <CalendarClockIcon />
            <Trans message="Services" />
          </Tabs.Tab>
          <Tabs.Tab value="availability">
            <CalendarDaysIcon />
            <Trans message="Availability" />
          </Tabs.Tab>
          <Tabs.Tab value="appointments">
            <CalendarClockIcon />
            <Trans message="Appointments" />
          </Tabs.Tab>
          <Tabs.Tab value="communication">
            <MailIcon />
            <Trans message="Communication" />
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="services" className="mt-6 flex flex-col gap-6">
          <div className="order-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold">
                <Trans message="Your services" />
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                <Trans message="Create services visitors can book on this page." />
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingServiceId(null);
                setServiceForm(emptyServiceForm());
                setServiceUsesPageDefaults(true);
                setServiceFormOpen(true);
              }}
            >
              <PlusIcon />
              <Trans message="Add service" />
            </Button>
          </div>
          {serviceFormOpen ? (
            <section className="order-3 rounded-card border bg-card p-5">
              <h2 className="font-semibold">
                <Trans
                  message={editingServiceId ? 'Edit service' : 'New service'}
                />
              </h2>
              <div className="mt-4 space-y-6">
                <div>
                  <label className="text-sm font-medium">
                    <Trans message="Service type" />
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <Trans message="Choose the context so visitors understand what they are booking." />
                  </p>
                  <VisualOptionGrid
                    ariaLabel={trans({message: 'Service type'})}
                    className="mt-3 grid-cols-2 sm:grid-cols-4"
                    items={serviceTypeOptions}
                    value={serviceForm.service_type ?? 'appointment'}
                    onChange={value => {
                      setServiceForm({
                        ...serviceForm,
                        service_type: value,
                        ...(meetingServiceTypes.has(value)
                          ? {}
                          : {meeting_url: undefined}),
                      });
                    }}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <CalendarClockIcon className="size-4" />
                      <Trans message="Service duration" />
                    </label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <Trans message="How long one appointment occupies the schedule." />
                    </p>
                    <Input
                      className="mt-2"
                      aria-label={trans({
                        message: 'Service duration in minutes',
                      })}
                      type="number"
                      min={5}
                      max={1440}
                      value={serviceForm.duration_minutes ?? ''}
                      onChange={event =>
                        setServiceForm({
                          ...serviceForm,
                          duration_minutes: Number(event.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <UsersIcon className="size-4" />
                      <Trans message="People per time slot" />
                    </label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <Trans message="The maximum number of bookings at the same time." />
                    </p>
                    <p className="mt-2 rounded border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                      {serviceUsesPageDefaults ? (
                        <Trans message="Uses the page default capacity" />
                      ) : (
                        <Trans message="Custom capacity for this service" />
                      )}
                    </p>
                  </div>
                </div>

                <div className="rounded-card border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-medium">
                        <Settings2Icon className="size-4" />
                        <Trans message="Service schedule" />
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <Trans message="This service uses the page defaults. Customize the interval and capacity only for this service." />
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-expanded={!serviceUsesPageDefaults}
                      onClick={() => {
                        const next = !serviceUsesPageDefaults;
                        setServiceUsesPageDefaults(next);
                        if (next) {
                          setServiceForm({
                            ...serviceForm,
                            slot_interval_minutes: null,
                            capacity: null,
                          });
                        } else {
                          setServiceForm({
                            ...serviceForm,
                            slot_interval_minutes: 30,
                            capacity: 1,
                          });
                        }
                      }}
                    >
                      <Settings2Icon />
                      <Trans
                        message={
                          serviceUsesPageDefaults
                            ? 'Customize this service'
                            : 'Use page defaults'
                        }
                      />
                    </Button>
                  </div>
                  {!serviceUsesPageDefaults ? (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">
                          <Trans message="Time between start times" />
                        </label>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <Trans message="How often a new booking can start for this service." />
                        </p>
                        <Input
                          className="mt-2"
                          aria-label={trans({
                            message: 'Custom slot interval in minutes',
                          })}
                          type="number"
                          min={5}
                          max={1440}
                          value={serviceForm.slot_interval_minutes ?? ''}
                          onChange={event =>
                            setServiceForm({
                              ...serviceForm,
                              slot_interval_minutes: Number(event.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          <Trans message="Custom people per time slot" />
                        </label>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <Trans message="Overrides the default capacity for this service." />
                        </p>
                        <Input
                          className="mt-2"
                          aria-label={trans({message: 'Custom capacity'})}
                          type="number"
                          min={1}
                          max={1000}
                          value={serviceForm.capacity ?? ''}
                          onChange={event =>
                            setServiceForm({
                              ...serviceForm,
                              capacity: Number(event.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">
                      <Trans message="Service name" />
                    </label>
                    <Input
                      className="mt-2"
                      aria-label={trans({message: 'Service name'})}
                      placeholder={trans({message: 'Example: Haircut'})}
                      value={serviceForm.name}
                      onChange={event =>
                        setServiceForm({
                          ...serviceForm,
                          name: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      <Trans message="Optional price" />
                    </label>
                    <Input
                      className="mt-2"
                      aria-label={trans({message: 'Optional price'})}
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder={trans({message: 'Leave empty for free'})}
                      value={serviceForm.price ?? ''}
                      onChange={event =>
                        setServiceForm({
                          ...serviceForm,
                          price:
                            event.target.value === ''
                              ? undefined
                              : Number(event.target.value),
                        })
                      }
                    />
                  </div>
                  <Textarea
                    aria-label={trans({message: 'Description'})}
                    className="sm:col-span-2"
                    placeholder={trans({message: 'Describe this service'})}
                    value={serviceForm.description ?? ''}
                    onChange={event =>
                      setServiceForm({
                        ...serviceForm,
                        description: event.target.value,
                      })
                    }
                  />
                </div>

                {supportsMeeting ? (
                  <div className="rounded-card border p-4">
                    <h3 className="flex items-center gap-2 text-sm font-medium">
                      <VideoIcon className="size-4" />
                      <Trans message="Meeting details" />
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <Trans message="Optional. This information can be released after the booking is confirmed." />
                    </p>
                    <Input
                      className="mt-3"
                      aria-label={trans({message: 'Meeting link'})}
                      placeholder={trans({
                        message: 'Google Meet or other meeting link',
                      })}
                      value={serviceForm.meeting_url ?? ''}
                      onChange={event =>
                        setServiceForm({
                          ...serviceForm,
                          meeting_url: event.target.value,
                        })
                      }
                    />
                  </div>
                ) : null}

                <div>
                  <label className="text-sm font-medium">
                    <Trans message="Payment details (optional)" />
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <Trans message="Fill in only the payment options you use. The visitor will see the available options after confirmation." />
                  </p>
                </div>

                <div className="grid gap-4 rounded-card border p-4 sm:grid-cols-2">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <LinkIcon className="size-4" />
                      <Trans message="Payment link" />
                    </label>
                    <Input
                      className="mt-2"
                      aria-label={trans({message: 'Payment link'})}
                      placeholder={trans({message: 'https://...'})}
                      value={serviceForm.payment_url ?? ''}
                      onChange={event =>
                        setServiceForm({
                          ...serviceForm,
                          payment_url: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <QrCodeIcon className="size-4" />
                      <Trans message="PIX key" />
                    </label>
                    <Input
                      className="mt-2"
                      aria-label={trans({message: 'PIX key'})}
                      placeholder={trans({
                        message: 'PIX key or copy and paste code',
                      })}
                      value={serviceForm.pix_key ?? ''}
                      onChange={event =>
                        setServiceForm({
                          ...serviceForm,
                          pix_key: event.target.value,
                        })
                      }
                    />
                  </div>
                  {hasPaymentDetails ? (
                    <>
                      <Textarea
                        aria-label={trans({message: 'Payment instructions'})}
                        className="sm:col-span-2"
                        placeholder={trans({
                          message: 'Optional payment instructions',
                        })}
                        value={serviceForm.payment_instructions ?? ''}
                        onChange={event =>
                          setServiceForm({
                            ...serviceForm,
                            payment_instructions: event.target.value,
                          })
                        }
                      />
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <LinkIcon className="size-4" />
                          <Trans message="Payment proof link" />
                        </label>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <Trans message="For example, a WhatsApp link where the visitor can send the receipt." />
                        </p>
                        <Input
                          className="mt-2"
                          aria-label={trans({message: 'Payment proof link'})}
                          placeholder={trans({message: 'https://wa.me/...'})}
                          value={serviceForm.payment_confirmation_url ?? ''}
                          onChange={event =>
                            setServiceForm({
                              ...serviceForm,
                              payment_confirmation_url: event.target.value,
                            })
                          }
                        />
                      </div>
                      <Textarea
                        aria-label={trans({
                          message: 'Payment confirmation instructions',
                        })}
                        className="sm:col-span-2"
                        placeholder={trans({
                          message:
                            'Example: Send the receipt with your name and booking time.',
                        })}
                        value={
                          serviceForm.payment_confirmation_instructions ?? ''
                        }
                        onChange={event =>
                          setServiceForm({
                            ...serviceForm,
                            payment_confirmation_instructions:
                              event.target.value,
                          })
                        }
                      />
                    </>
                  ) : null}
                </div>
              </div>
              <Button
                className="mt-4"
                onClick={() =>
                  editingServiceId
                    ? updateService.mutate()
                    : createService.mutate()
                }
                disabled={
                  !serviceForm.name ||
                  createService.isPending ||
                  updateService.isPending
                }
              >
                <PlusIcon />
                <Trans
                  message={editingServiceId ? 'Save service' : 'Add service'}
                />
              </Button>
              <Button
                className="mt-4 ml-2"
                variant="ghost"
                onClick={() => {
                  setEditingServiceId(null);
                  setServiceForm(emptyServiceForm());
                  setServiceUsesPageDefaults(true);
                  setServiceFormOpen(false);
                }}
              >
                <Trans message="Cancel" />
              </Button>
            </section>
          ) : null}
          <div className="order-2 grid gap-3">
            {(services.data?.data ?? []).length === 0 ? (
              <div className="rounded-card border border-dashed p-8 text-center text-sm text-muted-foreground">
                <Trans message="No services created yet. Add your first service to start receiving bookings." />
              </div>
            ) : null}
            {(services.data?.data ?? []).map(service => (
              <article
                key={service.id}
                className="flex items-center gap-4 rounded-card border bg-card p-4"
              >
                <div className="min-w-0 flex-auto">
                  <h3 className="font-medium">{service.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarClockIcon className="size-3.5" />
                      {service.duration_minutes} <Trans message="minutes" />
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <UsersIcon className="size-3.5" />
                      {service.capacity ?? settings.default_capacity ?? 1}{' '}
                      <Trans message="people per slot" />
                    </span>
                    <span>
                      {serviceTypeOptions.find(
                        option => option.value === service.service_type,
                      )?.label ?? <Trans message="Service" />}
                    </span>
                    {service.payment_url || service.pix_key ? (
                      <span className="inline-flex items-center gap-1">
                        <CreditCardIcon className="size-3.5" />
                        <Trans message="Payment configured" />
                      </span>
                    ) : null}
                  </div>
                  {service.description ? (
                    <p className="mt-1 text-sm">{service.description}</p>
                  ) : null}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingServiceId(Number(service.id));
                    setServiceFormOpen(true);
                    setServiceForm({
                      name: service.name,
                      description: service.description || undefined,
                      image: service.image || undefined,
                      service_type:
                        service.service_type as CrupdateBookingServiceRequestServiceType,
                      duration_minutes: Number(service.duration_minutes),
                      slot_interval_minutes: service.slot_interval_minutes
                        ? Number(service.slot_interval_minutes)
                        : null,
                      capacity:
                        service.capacity === null ||
                        service.capacity === undefined
                          ? null
                          : Number(service.capacity),
                      price: service.price ? Number(service.price) : undefined,
                      currency: service.currency || undefined,
                      meeting_url: service.meeting_url,
                      payment_url: service.payment_url,
                      pix_key: service.pix_key,
                      payment_instructions: service.payment_instructions,
                      payment_confirmation_url:
                        service.payment_confirmation_url,
                      payment_confirmation_instructions:
                        service.payment_confirmation_instructions,
                      release_info_after_booking: ['true', '1'].includes(
                        String(service.release_info_after_booking),
                      ),
                      active: ['true', '1'].includes(String(service.active)),
                      position: Number(service.position || 0),
                    });
                    setServiceUsesPageDefaults(
                      service.capacity === null &&
                        service.slot_interval_minutes === null,
                    );
                  }}
                >
                  <Trans message="Edit" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={trans({message: 'Delete service'})}
                  onClick={() => deleteService.mutate(Number(service.id))}
                >
                  <Trash2Icon />
                </Button>
              </article>
            ))}
          </div>
        </Tabs.Panel>
        <Tabs.Panel value="availability" className="mt-6 space-y-6">
          <section className="space-y-4 rounded-card border bg-card p-5">
            <h2 className="font-semibold">
              <Trans message="Page availability defaults" />
            </h2>
            <p className="text-sm text-muted-foreground">
              <Trans message="These settings apply to every service unless you customize a service." />
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="text-sm font-medium">
                  <Trans message="Time zone" />
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  <Trans message="All opening hours are interpreted in this time zone." />
                </p>
                <Input
                  className="mt-2"
                  aria-label={trans({message: 'Time zone'})}
                  placeholder={trans({message: 'Example: America/Sao_Paulo'})}
                  defaultValue={settings.timezone ?? 'America/Sao_Paulo'}
                  id="booking-timezone"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  <Trans message="Default time between start times" />
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  <Trans message="Used by every service unless it has a custom override." />
                </p>
                <Input
                  className="mt-2"
                  aria-label={trans({
                    message: 'Default time between start times',
                  })}
                  type="number"
                  min={5}
                  placeholder={trans({message: 'Minutes between bookings'})}
                  defaultValue={settings.default_slot_interval_minutes ?? 30}
                  id="booking-interval"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  <Trans message="Default people per time slot" />
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  <Trans message="Used by every service unless it has a custom override." />
                </p>
                <Input
                  className="mt-2"
                  aria-label={trans({message: 'Default people per time slot'})}
                  type="number"
                  min={1}
                  placeholder={trans({
                    message: 'Maximum simultaneous bookings',
                  })}
                  defaultValue={settings.default_capacity ?? 1}
                  id="booking-capacity"
                />
              </div>
            </div>
            <p className="rounded border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <Trans message="These are the page defaults. Open a service and choose Customize this service only when its interval or capacity should be different." />
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  <Trans message="Opening periods" />
                </h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setAvailabilityRules([
                      ...availabilityRules,
                      {
                        weekday: 1,
                        start_time: '09:00',
                        end_time: '17:00',
                        active: true,
                      },
                    ])
                  }
                >
                  <PlusIcon />
                  <Trans message="Add period" />
                </Button>
              </div>
              {availabilityRules.map((rule, index) => (
                <div
                  key={index}
                  className="grid gap-2 sm:grid-cols-[80px_1fr_1fr_auto]"
                >
                  <Input
                    aria-label={trans({message: 'Weekday'})}
                    type="number"
                    min={1}
                    max={7}
                    value={rule.weekday}
                    onChange={event =>
                      setAvailabilityRules(
                        availabilityRules.map((item, itemIndex) =>
                          itemIndex === index
                            ? {...item, weekday: Number(event.target.value)}
                            : item,
                        ),
                      )
                    }
                  />
                  <Input
                    aria-label={trans({message: 'Start'})}
                    type="time"
                    value={rule.start_time}
                    onChange={event =>
                      setAvailabilityRules(
                        availabilityRules.map((item, itemIndex) =>
                          itemIndex === index
                            ? {...item, start_time: event.target.value}
                            : item,
                        ),
                      )
                    }
                  />
                  <Input
                    aria-label={trans({message: 'End'})}
                    type="time"
                    value={rule.end_time}
                    onChange={event =>
                      setAvailabilityRules(
                        availabilityRules.map((item, itemIndex) =>
                          itemIndex === index
                            ? {...item, end_time: event.target.value}
                            : item,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={trans({message: 'Remove period'})}
                    onClick={() =>
                      setAvailabilityRules(
                        availabilityRules.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      )
                    }
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  <Trans message="Exceptions and breaks" />
                </h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setAvailabilityExceptions([
                      ...availabilityExceptions,
                      {
                        exception_date: new Date().toISOString().slice(0, 10),
                        type: 'closed',
                        start_time: '',
                        end_time: '',
                        reason: '',
                        active: true,
                      },
                    ])
                  }
                >
                  <PlusIcon />
                  <Trans message="Add exception" />
                </Button>
              </div>
              {availabilityExceptions.map((exception, index) => (
                <div
                  key={index}
                  className="grid gap-2 rounded border p-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]"
                >
                  <Input
                    type="date"
                    aria-label={trans({message: 'Exception date'})}
                    value={exception.exception_date}
                    onChange={event =>
                      setAvailabilityExceptions(
                        availabilityExceptions.map((item, itemIndex) =>
                          itemIndex === index
                            ? {...item, exception_date: event.target.value}
                            : item,
                        ),
                      )
                    }
                  />
                  <select
                    className="h-10 rounded border bg-transparent px-3 text-sm"
                    aria-label={trans({message: 'Exception type'})}
                    value={exception.type}
                    onChange={event =>
                      setAvailabilityExceptions(
                        availabilityExceptions.map((item, itemIndex) =>
                          itemIndex === index
                            ? {...item, type: event.target.value}
                            : item,
                        ),
                      )
                    }
                  >
                    <option value="closed">
                      <Trans message="Closed" />
                    </option>
                    <option value="open">
                      <Trans message="Additional hours" />
                    </option>
                    <option value="break">
                      <Trans message="Break" />
                    </option>
                  </select>
                  <Input
                    type="time"
                    aria-label={trans({message: 'Exception start time'})}
                    value={exception.start_time || ''}
                    disabled={exception.type === 'closed'}
                    onChange={event =>
                      setAvailabilityExceptions(
                        availabilityExceptions.map((item, itemIndex) =>
                          itemIndex === index
                            ? {...item, start_time: event.target.value}
                            : item,
                        ),
                      )
                    }
                  />
                  <Input
                    type="time"
                    aria-label={trans({message: 'Exception end time'})}
                    value={exception.end_time || ''}
                    disabled={exception.type === 'closed'}
                    onChange={event =>
                      setAvailabilityExceptions(
                        availabilityExceptions.map((item, itemIndex) =>
                          itemIndex === index
                            ? {...item, end_time: event.target.value}
                            : item,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={trans({message: 'Remove exception'})}
                    onClick={() =>
                      setAvailabilityExceptions(
                        availabilityExceptions.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      )
                    }
                  >
                    <Trash2Icon />
                  </Button>
                  <Input
                    className="sm:col-span-2 lg:col-span-5"
                    aria-label={trans({message: 'Exception reason'})}
                    placeholder={trans({message: 'Reason (optional)'})}
                    value={exception.reason || ''}
                    onChange={event =>
                      setAvailabilityExceptions(
                        availabilityExceptions.map((item, itemIndex) =>
                          itemIndex === index
                            ? {...item, reason: event.target.value}
                            : item,
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </div>
            <Button
              onClick={() =>
                saveAvailability.mutate({
                  settings: {
                    timezone: (
                      document.getElementById(
                        'booking-timezone',
                      ) as HTMLInputElement
                    )?.value as any,
                    default_slot_interval_minutes: Number(
                      (
                        document.getElementById(
                          'booking-interval',
                        ) as HTMLInputElement
                      )?.value,
                    ),
                    default_capacity: Number(
                      (
                        document.getElementById(
                          'booking-capacity',
                        ) as HTMLInputElement
                      )?.value,
                    ),
                  },
                  rules: availabilityRules,
                  exceptions: availabilityExceptions,
                } as any)
              }
              disabled={saveAvailability.isPending}
            >
              <Trans message="Save availability" />
            </Button>
          </section>
          <section className="rounded-card border bg-card p-5">
            <h2 className="font-semibold">
              <Trans message="Configured periods" />
            </h2>
            <div className="mt-3 grid gap-2">
              {availabilityRules.length ? (
                availabilityRules.map((rule: any, index: number) => (
                  <div key={index} className="text-sm">
                    {rule.weekday}: {rule.start_time} - {rule.end_time}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  <Trans message="No weekly periods configured yet." />
                </p>
              )}
            </div>
          </section>
        </Tabs.Panel>
        <Tabs.Panel value="appointments" className="mt-6 space-y-3">
          {(appointments.data?.data ?? []).map((appointment: any) => (
            <article
              key={appointment.id}
              className="flex flex-wrap items-center gap-4 rounded-card border bg-card p-4"
            >
              <div className="min-w-0 flex-auto">
                <div className="font-medium">
                  {appointment.customer_name || <Trans message="Customer" />}
                </div>
                <div className="text-xs text-muted-foreground">
                  {appointment.customer_email}
                  {appointment.customer_phone
                    ? ` · ${appointment.customer_phone}`
                    : null}
                </div>
                <div className="text-sm text-muted-foreground">
                  {appointment.service?.name} · {appointment.starts_at} ·{' '}
                  {appointment.status}
                </div>
              </div>
              {appointment.status === 'confirmed' ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateAppointment.mutate({
                        appointmentId: Number(appointment.id),
                        status: 'completed',
                      })
                    }
                  >
                    <Trans message="Complete" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateAppointment.mutate({
                        appointmentId: Number(appointment.id),
                        status: 'cancelled_by_provider',
                      })
                    }
                  >
                    <Trans message="Cancel appointment" />
                  </Button>
                </div>
              ) : null}
            </article>
          ))}
          {!(appointments.data?.data ?? []).length ? (
            <p className="text-sm text-muted-foreground">
              <Trans message="No appointments yet." />
            </p>
          ) : null}
        </Tabs.Panel>
        <Tabs.Panel value="communication" className="mt-6">
          <section className="rounded-card border bg-card p-5">
            <h2 className="font-semibold">
              <Trans message="Email connections" />
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <Trans message="The platform sender is used by default. Custom workspace connections can be selected for booking notifications." />
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Input
                aria-label={trans({message: 'Connection name'})}
                placeholder={trans({message: 'Connection name'})}
                value={mailForm.name}
                onChange={event =>
                  setMailForm({...mailForm, name: event.target.value})
                }
              />
              <Input
                aria-label={trans({message: 'Provider'})}
                placeholder={trans({
                  message: 'Provider (smtp, mailgun, ses or gmail)',
                })}
                value={mailForm.provider}
                onChange={event =>
                  setMailForm({...mailForm, provider: event.target.value})
                }
              />
              <Input
                aria-label={trans({message: 'Sender email'})}
                placeholder={trans({message: 'Sender email'})}
                value={mailForm.from_address}
                onChange={event =>
                  setMailForm({...mailForm, from_address: event.target.value})
                }
              />
              <Input
                aria-label={trans({message: 'Sender name'})}
                placeholder={trans({message: 'Sender name'})}
                value={mailForm.from_name}
                onChange={event =>
                  setMailForm({...mailForm, from_name: event.target.value})
                }
              />
              <Input
                aria-label={trans({message: 'Reply-to email'})}
                placeholder={trans({message: 'Reply-to email'})}
                value={mailForm.reply_to}
                onChange={event =>
                  setMailForm({...mailForm, reply_to: event.target.value})
                }
              />
              {mailForm.provider !== 'platform' ? (
                <>
                  <Input
                    aria-label="SMTP host"
                    placeholder={trans({message: 'SMTP host'})}
                    value={mailForm.credentials.host}
                    onChange={event =>
                      setMailForm({
                        ...mailForm,
                        credentials: {
                          ...mailForm.credentials,
                          host: event.target.value,
                        },
                      })
                    }
                  />
                  <Input
                    aria-label="SMTP port"
                    placeholder={trans({message: 'SMTP port'})}
                    value={mailForm.credentials.port}
                    onChange={event =>
                      setMailForm({
                        ...mailForm,
                        credentials: {
                          ...mailForm.credentials,
                          port: event.target.value,
                        },
                      })
                    }
                  />
                  <Input
                    aria-label="Username"
                    placeholder={trans({message: 'Username'})}
                    value={mailForm.credentials.username}
                    onChange={event =>
                      setMailForm({
                        ...mailForm,
                        credentials: {
                          ...mailForm.credentials,
                          username: event.target.value,
                        },
                      })
                    }
                  />
                  <Input
                    aria-label="Password"
                    type="password"
                    placeholder={trans({message: 'Password'})}
                    value={mailForm.credentials.password}
                    onChange={event =>
                      setMailForm({
                        ...mailForm,
                        credentials: {
                          ...mailForm.credentials,
                          password: event.target.value,
                        },
                      })
                    }
                  />
                  <Input
                    aria-label="Encryption"
                    placeholder={trans({message: 'Encryption'})}
                    value={mailForm.credentials.encryption}
                    onChange={event =>
                      setMailForm({
                        ...mailForm,
                        credentials: {
                          ...mailForm.credentials,
                          encryption: event.target.value,
                        },
                      })
                    }
                  />
                </>
              ) : null}
            </div>
            <Button
              className="mt-4"
              onClick={() => createMailConnection.mutate()}
              disabled={!mailForm.name || createMailConnection.isPending}
            >
              <PlusIcon />
              <Trans message="Add email connection" />
            </Button>
            <div className="mt-4 grid gap-2">
              {(mailConnections.data?.data ?? []).map((connection: any) => (
                <div
                  key={connection.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded border p-3 text-sm"
                >
                  <div>
                    <div>{connection.name}</div>
                    <span className="text-muted-foreground">
                      {connection.provider}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        testMailConnection.mutate(Number(connection.id))
                      }
                    >
                      <Trans message="Test connection" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={trans({message: 'Delete email connection'})}
                      onClick={() =>
                        deleteMailConnection.mutate(Number(connection.id))
                      }
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Tabs.Panel>
      </Tabs.Root>
    </div>
  );
}
