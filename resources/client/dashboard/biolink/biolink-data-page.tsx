import {
  deleteBiolinkWidgetSubmission,
  exportBiolinkWidgetSubmissionsCsv,
  listBiolinkWidgetSubmissions,
  updateBiolinkWidgetSubmission,
} from '@app/gen/biolinks';
import type {BiolinkWidgetSubmission} from '@app/gen/schemas/biolink-widget-submission';
import type {BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import type {UpdateBiolinkWidgetSubmissionBodyStatus} from '@app/gen/schemas/update-biolink-widget-submission-body-status';
import {useBiolinkEditorStore} from '@app/dashboard/biolink/biolink-editor/biolink-editor-store';
import {WidgetList} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-list';
import {CsvExportInfoDialog} from '@common/datatable/csv-export/csv-export-info-dialog';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {queryClient} from '@common/http/query-client';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {Badge} from '@shadcn/badge/badge';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Input} from '@shadcn/forms/input/input';
import {useMutation, useQuery} from '@tanstack/react-query';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {cn} from '@ui/utils/cn';
import {downloadFileFromUrl} from '@ui/utils/files/download-file-from-url';
import {
  ArchiveIcon,
  BarChart3Icon,
  DownloadIcon,
  EyeIcon,
  InboxIcon,
  MailIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react';
import {ReactNode, useMemo, useState} from 'react';
import {useSearchParams} from 'react-router';

type DataTypeFilter =
  | 'all'
  | 'contactForm'
  | 'emailSignup'
  | 'eventRsvp'
  | 'smsSignup'
  | 'poll';
type StatusFilter = 'all' | 'new' | 'read' | 'archived';

type Filters = {
  type: DataTypeFilter;
  widget_id: string;
  status: StatusFilter;
  query: string;
  start_date: string;
  end_date: string;
};

const defaultFilters: Filters = {
  type: 'all',
  widget_id: 'all',
  status: 'all',
  query: '',
  start_date: '',
  end_date: '',
};

type PollResult = {
  widget_id: number;
  title: string;
  total_votes: number;
  options: Array<{
    label: string;
    votes: number;
    percentage: number;
  }>;
};

const queryKey = (biolinkId: number, filters: Filters) => [
  'biolink-widget-submissions',
  biolinkId,
  filters,
];

export function Component() {
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const numericBiolinkId = Number(biolinkId);
  const content = useBiolinkEditorStore(s => s.content);
  const {trans} = useTrans();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => ({
    ...defaultFilters,
    type: searchParams.get('type') === 'poll' ? 'poll' : 'all',
    widget_id: searchParams.get('widget_id') || 'all',
  }));
  const [selectedSubmission, setSelectedSubmission] =
    useState<BiolinkWidgetSubmission | null>(null);
  const [csvExportInfoDialogOpen, setCsvExportInfoDialogOpen] = useState(false);
  const params = useMemo(() => buildRequestParams(filters), [filters]);

  const widgets = useMemo(
    () =>
      content
        .filter(
          item =>
            item.model_type === 'biolinkWidget' &&
            [
              'contactForm',
              'emailSignup',
              'eventRsvp',
              'smsSignup',
              'poll',
            ].includes(item.type),
        )
        .map(item => item as BiolinkWidget),
    [content],
  );

  const submissionsQuery = useQuery({
    queryKey: queryKey(numericBiolinkId, filters),
    queryFn: () => listBiolinkWidgetSubmissions(numericBiolinkId, {params}),
  });

  const updateStatus = useMutation({
    mutationFn: ({
      submission,
      status,
    }: {
      submission: BiolinkWidgetSubmission;
      status: UpdateBiolinkWidgetSubmissionBodyStatus;
    }) =>
      updateBiolinkWidgetSubmission(numericBiolinkId, Number(submission.id), {
        status,
      }),
    onSuccess: response => {
      setSelectedSubmission(response.data);
      queryClient.invalidateQueries({
        queryKey: ['biolink-widget-submissions', numericBiolinkId],
      });
    },
    onError: err =>
      showHttpErrorToast(err, <Trans message="Could not update data status" />),
  });

  const deleteSubmission = useMutation({
    mutationFn: (submission: BiolinkWidgetSubmission) =>
      deleteBiolinkWidgetSubmission(numericBiolinkId, Number(submission.id)),
    onSuccess: () => {
      setSelectedSubmission(null);
      queryClient.invalidateQueries({
        queryKey: ['biolink-widget-submissions', numericBiolinkId],
      });
    },
    onError: err =>
      showHttpErrorToast(err, <Trans message="Could not delete this data" />),
  });

  const exportCsv = useMutation({
    mutationFn: () =>
      exportBiolinkWidgetSubmissionsCsv(numericBiolinkId, {data: params}),
    onSuccess: response => {
      if (response.downloadPath) {
        downloadFileFromUrl(response.downloadPath);
      } else {
        setCsvExportInfoDialogOpen(true);
      }
    },
    onError: err =>
      showHttpErrorToast(err, <Trans message="Could not export data" />),
  });

  const data = submissionsQuery.data?.data ?? [];
  const newCount = Number(submissionsQuery.data?.summary?.new_count ?? 0);
  const pollResults =
    (
      submissionsQuery.data?.summary as
        | ({poll_results?: PollResult[]} & Record<string, unknown>)
        | undefined
    )?.poll_results ?? [];

  const viewPollResponses = (widgetId: number) => {
    const widget_id = String(widgetId);
    setFilters(prev => ({...prev, type: 'poll', widget_id}));
    setSearchParams({type: 'poll', widget_id}, {replace: true});
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <CsvExportInfoDialog
        open={csvExportInfoDialogOpen}
        onOpenChange={setCsvExportInfoDialogOpen}
      />
      <SubmissionDetailsDialog
        submission={selectedSubmission}
        onOpenChange={open => {
          if (!open) {
            setSelectedSubmission(null);
          }
        }}
        onSetStatus={status => {
          if (selectedSubmission) {
            updateStatus.mutate({submission: selectedSubmission, status});
          }
        }}
        onDelete={() => {
          if (selectedSubmission) {
            deleteSubmission.mutate(selectedSubmission);
          }
        }}
        isMutating={updateStatus.isPending || deleteSubmission.isPending}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            <Trans message="Data" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <Trans message="Captured contacts, signups, SMS subscribers, polls and RSVP responses for this biolink." />
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {newCount ? (
            <Badge variant="positive">
              {newCount} <Trans message="new" />
            </Badge>
          ) : null}
          <Button
            variant="outline"
            onClick={() => submissionsQuery.refetch()}
            disabled={submissionsQuery.isFetching}
          >
            <RefreshCwIcon />
            <Trans message="Refresh" />
          </Button>
          <Button
            variant="outline"
            onClick={() => exportCsv.mutate()}
            disabled={exportCsv.isPending}
          >
            <DownloadIcon />
            <Trans message="Export CSV" />
          </Button>
        </div>
      </div>

      <div className="rounded-card border bg-card p-4">
        <div className="grid gap-3 lg:grid-cols-[1.1fr_0.8fr_0.8fr_0.9fr_0.9fr_0.9fr]">
          <label className="relative block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              <Trans message="Search" />
            </span>
            <SearchIcon className="pointer-events-none absolute bottom-3 left-3 size-4 text-muted-foreground" />
            <Input
              bindToHookForm={false}
              value={filters.query}
              placeholder={trans(message('Name, email, phone or message'))}
              className="pl-9"
              onChange={event =>
                setFilters(prev => ({...prev, query: event.target.value}))
              }
            />
          </label>
          <FilterSelect
            label={<Trans message="Data type" />}
            value={filters.type}
            onChange={value =>
              setFilters(prev => ({...prev, type: value as DataTypeFilter}))
            }
            options={[
              {value: 'all', label: trans(message('All data'))},
              {value: 'contactForm', label: trans(message('Contact'))},
              {value: 'emailSignup', label: trans(message('Signup'))},
              {value: 'eventRsvp', label: trans(message('RSVP / waitlist'))},
              {value: 'smsSignup', label: trans(message('SMS signup'))},
              {value: 'poll', label: trans(message('Poll'))},
            ]}
          />
          <FilterSelect
            label={<Trans message="Widget" />}
            value={filters.widget_id}
            onChange={value =>
              setFilters(prev => ({...prev, widget_id: value}))
            }
            options={[
              {value: 'all', label: trans(message('All widgets'))},
              ...widgets.map(widget => ({
                value: `${widget.id}`,
                label:
                  typeof widget.config?.title === 'string' &&
                  widget.config.title.trim()
                    ? widget.config.title
                    : (WidgetList[widget.type]?.label ?? widget.type),
              })),
            ]}
          />
          <FilterSelect
            label={<Trans message="Status" />}
            value={filters.status}
            onChange={value =>
              setFilters(prev => ({...prev, status: value as StatusFilter}))
            }
            options={[
              {value: 'all', label: trans(message('All statuses'))},
              {value: 'new', label: trans(message('New'))},
              {value: 'read', label: trans(message('Read'))},
              {value: 'archived', label: trans(message('Archived'))},
            ]}
          />
          <DateFilter
            label={<Trans message="Start date" />}
            value={filters.start_date}
            onChange={value =>
              setFilters(prev => ({...prev, start_date: value}))
            }
          />
          <DateFilter
            label={<Trans message="End date" />}
            value={filters.end_date}
            onChange={value => setFilters(prev => ({...prev, end_date: value}))}
          />
        </div>
      </div>

      {pollResults.length ? (
        <PollResultsPanel
          results={pollResults}
          onViewResponses={viewPollResponses}
        />
      ) : null}

      <div
        id="captured-responses"
        className="overflow-hidden rounded-card border bg-card"
      >
        {submissionsQuery.isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <Trans message="Loading data..." />
          </div>
        ) : data.length ? (
          <div className="divide-y">
            {data.map(submission => (
              <button
                key={submission.id}
                type="button"
                className="grid w-full gap-3 p-4 text-left transition-colors hover:bg-accent md:grid-cols-[1fr_1fr_0.8fr_0.8fr_auto] md:items-center"
                onClick={() => setSelectedSubmission(submission)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <MailIcon className="size-4 text-muted-foreground" />
                    <span className="truncate font-medium">
                      {getSubmissionPrimary(submission)}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-sm text-muted-foreground">
                    {submission.email || submission.phone || '-'}
                  </div>
                </div>
                <div className="min-w-0 text-sm text-muted-foreground">
                  <div className="truncate">
                    {submission.message ||
                      getSubmissionPayloadLabel(submission)}
                  </div>
                </div>
                <div>
                  <TypeBadge type={submission.widget_type} />
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={submission.status} />
                  {submission.created_at ? (
                    <span className="text-xs text-muted-foreground">
                      <FormattedDate date={submission.created_at} />
                    </span>
                  ) : null}
                </div>
                <div className="flex justify-end">
                  <EyeIcon className="size-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <InboxIcon className="mb-3 size-9 text-muted-foreground" />
            <div className="font-semibold">
              <Trans message="No data found" />
            </div>
            <div className="mt-1 max-w-md text-sm text-muted-foreground">
              <Trans message="Captured form responses will appear here after visitors submit contact, signup, SMS, poll or RSVP widgets." />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PollResultsPanel({
  results,
  onViewResponses,
}: {
  results: PollResult[];
  onViewResponses: (widgetId: number) => void;
}) {
  return (
    <section className="overflow-hidden rounded-card border bg-card">
      <div className="flex items-start gap-3 border-b p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <BarChart3Icon className="size-5" />
        </span>
        <div>
          <h2 className="font-semibold">
            <Trans message="Poll results" />
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <Trans message="Compare options by total and percentage. Poll responses are anonymous." />
          </p>
        </div>
      </div>
      <div className="divide-y">
        {results.map(result => (
          <div
            key={result.widget_id}
            className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{result.title}</h3>
                <Badge variant="secondary">
                  {result.total_votes} <Trans message="votes" />
                </Badge>
              </div>
              <div className="space-y-3">
                {result.options.map(option => (
                  <div key={option.label}>
                    <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                      <span className="truncate">{option.label}</span>
                      <span className="shrink-0 text-muted-foreground tabular-nums">
                        {option.votes} · {option.percentage}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        role="progressbar"
                        aria-label={option.label}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={option.percentage}
                        className="h-full rounded-full bg-primary transition-[width] duration-300"
                        style={{width: `${option.percentage}%`}}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Button
              variant="outline"
              className="self-start"
              onClick={() => onViewResponses(result.widget_id)}
            >
              <EyeIcon />
              <Trans message="View votes" />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: ReactNode;
  value: string;
  options: {value: string; label: string}[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <select
        className="h-10 w-full rounded-input border bg-background px-3 text-sm"
        value={value}
        onChange={event => onChange(event.target.value)}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <Input
        bindToHookForm={false}
        type="date"
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </label>
  );
}

function SubmissionDetailsDialog({
  submission,
  onOpenChange,
  onSetStatus,
  onDelete,
  isMutating,
}: {
  submission: BiolinkWidgetSubmission | null;
  onOpenChange: (open: boolean) => void;
  onSetStatus: (status: UpdateBiolinkWidgetSubmissionBodyStatus) => void;
  onDelete: () => void;
  isMutating: boolean;
}) {
  return (
    <Dialog.Root open={!!submission} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content className="sm:max-w-2xl">
          <Dialog.Header>
            <Dialog.Title>
              <Trans message="Data details" />
            </Dialog.Title>
          </Dialog.Header>
          {submission ? (
            <Dialog.Body>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <StatusBadge status={submission.status} />
                <TypeBadge type={submission.widget_type} />
                {submission.widget?.label ? (
                  <Badge variant="secondary">{submission.widget.label}</Badge>
                ) : null}
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                <DetailItem label={<Trans message="Name" />}>
                  {submission.name || '-'}
                </DetailItem>
                <DetailItem label={<Trans message="Email" />}>
                  {submission.email || '-'}
                </DetailItem>
                <DetailItem label={<Trans message="Phone" />}>
                  {submission.phone || '-'}
                </DetailItem>
                <DetailItem label={<Trans message="Submitted at" />}>
                  {submission.created_at ? (
                    <FormattedDate date={submission.created_at} />
                  ) : (
                    '-'
                  )}
                </DetailItem>
                <DetailItem
                  label={<Trans message="Message" />}
                  className="sm:col-span-2"
                >
                  {submission.message || '-'}
                </DetailItem>
                <DetailItem
                  label={<Trans message="Payload" />}
                  className="sm:col-span-2"
                >
                  <pre className="max-h-52 overflow-auto rounded-input bg-muted p-3 text-xs">
                    {JSON.stringify(submission.payload ?? {}, null, 2)}
                  </pre>
                </DetailItem>
              </dl>
            </Dialog.Body>
          ) : null}
          <Dialog.Footer>
            <Button
              variant="outline"
              disabled={isMutating || !submission}
              onClick={() => onSetStatus('new')}
            >
              <Trans message="Mark unread" />
            </Button>
            <Button
              variant="outline"
              disabled={isMutating || !submission}
              onClick={() => onSetStatus('read')}
            >
              <Trans message="Mark read" />
            </Button>
            <Button
              variant="outline"
              disabled={isMutating || !submission}
              onClick={() =>
                onSetStatus(
                  submission?.status === 'archived' ? 'read' : 'archived',
                )
              }
            >
              <ArchiveIcon />
              {submission?.status === 'archived' ? (
                <Trans message="Unarchive" />
              ) : (
                <Trans message="Archive" />
              )}
            </Button>
            <Button
              color="danger"
              variant="outline"
              disabled={isMutating || !submission}
              onClick={onDelete}
            >
              <Trash2Icon />
              <Trans message="Delete" />
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DetailItem({
  label,
  children,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-input border bg-background p-3', className)}>
      <dt className="mb-1 text-xs font-medium text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm break-words">{children}</dd>
    </div>
  );
}

function TypeBadge({type}: {type: string}) {
  return <Badge variant="secondary">{getTypeLabel(type)}</Badge>;
}

function StatusBadge({status}: {status: string}) {
  const variant =
    status === 'new'
      ? 'positive'
      : status === 'archived'
        ? 'outline'
        : 'secondary';
  return <Badge variant={variant}>{getStatusLabel(status)}</Badge>;
}

function getTypeLabel(type: string): ReactNode {
  switch (type) {
    case 'contactForm':
      return <Trans message="Contact" />;
    case 'emailSignup':
      return <Trans message="Signup" />;
    case 'eventRsvp':
      return <Trans message="RSVP / waitlist" />;
    case 'smsSignup':
      return <Trans message="SMS signup" />;
    case 'poll':
      return <Trans message="Poll" />;
    default:
      return type;
  }
}

function getSubmissionPrimary(submission: BiolinkWidgetSubmission): ReactNode {
  return (
    submission.name ||
    submission.email ||
    submission.phone ||
    getSubmissionPayloadLabel(submission) || (
      <Trans message="Anonymous submission" />
    )
  );
}

function getSubmissionPayloadLabel(
  submission: BiolinkWidgetSubmission,
): string {
  const payload = submission.payload as Record<string, unknown> | null;
  if (!payload) {
    return '';
  }

  if (typeof payload.option === 'string') {
    return payload.option;
  }

  if (typeof payload.response === 'string') {
    return payload.response;
  }

  return '';
}

function getStatusLabel(status: string): ReactNode {
  switch (status) {
    case 'new':
      return <Trans message="New" />;
    case 'read':
      return <Trans message="Read" />;
    case 'archived':
      return <Trans message="Archived" />;
    default:
      return status;
  }
}

function buildRequestParams(filters: Filters) {
  const params: Record<string, string> = {include_poll_results: '1'};
  if (filters.type !== 'all') {
    params.widget_type = filters.type;
  }
  if (filters.widget_id !== 'all') {
    params.widget_id = filters.widget_id;
  }
  if (filters.status !== 'all') {
    params.status = filters.status;
  }
  if (filters.query) {
    params.query = filters.query;
  }
  if (filters.start_date) {
    params.created_from = filters.start_date;
  }
  if (filters.end_date) {
    params.created_to = filters.end_date;
  }
  return params;
}
