import {
  createSupportTicketOptions,
  hostingAccountsOptions,
  replySupportTicketOptions,
  supportTicketOptions,
  supportTicketsKey,
  supportTicketsOptions,
} from '@app/hosting/hosting-queries';
import {SupportTicket, SupportTicketAttachment} from '@app/hosting/hosting-types';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {DashboardLayout} from '@common/ui/dashboard/dashboard-layout';
import {Button} from '@shadcn/button/button';
import {Select} from '@shadcn/forms/select/select';
import {toast} from '@shadcn/toast/toast';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {
  AlignLeftIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileIcon,
  ImageIcon,
  LifeBuoyIcon,
  LoaderCircleIcon,
  PaperclipIcon,
  PenSquareIcon,
  SearchIcon,
  SendIcon,
  SmileIcon,
  TypeIcon,
  XIcon,
} from 'lucide-react';
import {FormEvent, useEffect, useMemo, useRef, useState} from 'react';

const SelectContent = Select.Content;
const SelectItem = Select.Item;
const SelectTrigger = Select.Trigger;
const SelectValue = Select.Value;

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export function Component() {
  const tickets = useQuery(supportTicketsOptions());
  const accounts = useQuery(hostingAccountsOptions());
  const queryClient = useQueryClient();
  const {trans} = useTrans();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = useQuery(supportTicketOptions(selectedId));
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const filteredTickets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return (tickets.data ?? []).filter(ticket => {
      if (!normalizedSearch) {
        return true;
      }
      return (
        ticket.subject.toLowerCase().includes(normalizedSearch) ||
        ticket.status.toLowerCase().includes(normalizedSearch) ||
        ticket.hosting_account_id?.toString().includes(normalizedSearch)
      );
    });
  }, [search, tickets.data]);

  const rememberTicket = (ticket: SupportTicket) => {
    queryClient.setQueryData([...supportTicketsKey, ticket.id], ticket);
    queryClient.setQueryData<SupportTicket[]>(supportTicketsKey, current => {
      const withoutCurrent = (current ?? []).filter(item => item.id !== ticket.id);
      return [ticket, ...withoutCurrent].sort(
        (a, b) =>
          new Date(b.last_message_at ?? b.created_at).getTime() -
          new Date(a.last_message_at ?? a.created_at).getTime(),
      );
    });
    void queryClient.invalidateQueries({queryKey: supportTicketsKey});
  };

  const openTicket = (ticketId: number) => {
    setSelectedId(ticketId);
    setShowForm(false);
  };

  const openForm = () => {
    setSelectedId(null);
    setShowForm(true);
  };

  const showConversation = selectedId !== null || showForm;

  return (
    <DashboardLayout.MainSection className="flex min-h-0 flex-col overflow-hidden border-0 bg-transparent p-0 shadow-none">
      <StaticPageTitle>
        <Trans message="Suporte" />
      </StaticPageTitle>

      <div className="flex min-h-[calc(100dvh-92px)] flex-1 overflow-hidden rounded-card border border-border/60 bg-background/60 shadow-sm md:min-h-[calc(100dvh-116px)]">
        <aside
          className={`min-w-0 flex-col border-border bg-card/40 md:flex md:w-[340px] md:flex-shrink-0 md:border-r ${
            showConversation ? 'hidden' : 'flex w-full'
          }`}
        >
          <div className="border-b border-border/70 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight">
                <LifeBuoyIcon className="size-4 text-primary" />
                <Trans message="Meus chamados" />
              </h2>
              <Button
                size="icon"
                variant="ghost"
                className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={openForm}
                title={trans({message: 'Novo chamado'})}
                aria-label={trans({message: 'Novo chamado'})}
              >
                <PenSquareIcon className="size-4" />
              </Button>
            </div>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder={trans({message: 'Pesquisar chamados...'})}
                aria-label={trans({message: 'Pesquisar chamados'})}
                className="h-10 w-full rounded-input border border-border bg-background pl-9 pr-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 md:text-sm"
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {tickets.isLoading ? (
              <div className="space-y-3 p-4">
                <div className="h-20 rounded-card bg-muted/50" />
                <div className="h-20 rounded-card bg-muted/40" />
                <div className="h-20 rounded-card bg-muted/30" />
              </div>
            ) : filteredTickets.length ? (
              filteredTickets.map(ticket => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => openTicket(ticket.id)}
                  className={`group flex w-full items-start gap-3 border-b border-border/60 p-4 text-left transition-colors ${
                    selectedId === ticket.id && !showForm
                      ? 'bg-primary/10'
                      : 'hover:bg-muted/60'
                  }`}
                >
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {ticketInitials(ticket)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {ticket.subject}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatTime(ticket.last_message_at ?? ticket.created_at)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusColor(ticket.status)}`}
                      >
                        <Trans message={statusLabelMessage(ticket.status)} />
                      </span>
                      {ticket.hosting_account_id ? (
                        <span className="text-[11px] text-muted-foreground">
                          <Trans
                            message="Hospedagem #:id"
                            values={{id: ticket.hosting_account_id}}
                          />
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <EmptyTicketList hasSearch={search.trim().length > 0} />
            )}
          </div>
        </aside>

        <main
          className={`min-w-0 flex-1 flex-col bg-background/30 md:flex ${
            showConversation ? 'flex' : 'hidden'
          }`}
        >
          {showForm ? (
            <NewTicketForm
              accountId={
                accounts.data?.find(account => account.status !== 'deleted')?.id
              }
              onBack={() => setShowForm(false)}
              onCreated={ticket => {
                rememberTicket(ticket);
                setShowForm(false);
                setSelectedId(ticket.id);
              }}
            />
          ) : selected.data ? (
            <TicketConversation
              ticket={selected.data}
              onBack={() => setSelectedId(null)}
              onUpdated={rememberTicket}
            />
          ) : (
            <WelcomeState onCreate={openForm} />
          )}
        </main>
      </div>
    </DashboardLayout.MainSection>
  );
}

function NewTicketForm({
  accountId,
  onBack,
  onCreated,
}: {
  accountId?: number;
  onBack: () => void;
  onCreated: (ticket: SupportTicket) => void;
}) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [priority, setPriority] = useState('normal');
  const [department, setDepartment] = useState('technical');
  const [type, setType] = useState('ticket');
  const {trans} = useTrans();

  const createTicket = useMutation({
    ...createSupportTicketOptions(),
    onSuccess: ticket => {
      toast.success(<Trans message="Chamado aberto com sucesso." />);
      setSubject('');
      setMessage('');
      setAttachments([]);
      onCreated(ticket);
    },
    onError: error => showHttpErrorToast(error),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    createTicket.mutate({
      subject,
      message,
      hosting_account_id: accountId,
      type: type as 'ticket' | 'bug' | 'feature',
      department: department as 'technical' | 'general' | 'billing',
      priority: priority as 'low' | 'normal' | 'high' | 'urgent',
      attachments,
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-9 md:hidden"
              onClick={onBack}
              aria-label={trans({message: 'Voltar para chamados'})}
            >
              <ArrowLeftIcon className="size-4" />
            </Button>
            <h2 className="truncate text-sm font-semibold tracking-tight">
              <Trans message="Novo chamado" />
            </h2>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            <Trans message="Descreva o problema sem enviar senhas ou dados sensíveis." />
          </span>
        </header>

        <form
          id="new-ticket-form"
          onSubmit={submit}
          className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 md:p-6"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field label={<Trans message="Tipo" />}>
              <Select value={type} onValueChange={value => setType(value ?? 'ticket')}>
                <SelectTrigger className="h-10 w-full bg-background text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ticket">
                    <Trans message="Suporte técnico" />
                  </SelectItem>
                  <SelectItem value="bug">
                    <Trans message="Relatar problema" />
                  </SelectItem>
                  <SelectItem value="feature">
                    <Trans message="Sugestão" />
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label={<Trans message="Status" />}>
              <div className="flex h-10 items-center gap-2 rounded-input border border-border bg-muted/30 px-3 text-sm text-muted-foreground">
                <span className="size-2 rounded-full bg-emerald-500" />
                <Trans message="Aberto" />
              </div>
            </Field>
          </div>

          <Field label={<Trans message="Assunto" />}>
            <input
              className="h-11 w-full rounded-input border border-border bg-background px-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 md:text-sm"
              placeholder={trans({message: 'Ex: Não consigo acessar meu painel'})}
              value={subject}
              onChange={event => setSubject(event.target.value)}
              minLength={4}
              maxLength={180}
              required
            />
          </Field>

          <Field label={<Trans message="Mensagem" />} className="min-h-[320px] flex-1">
            <MessageComposer
              textareaId="new-ticket-message"
              message={message}
              setMessage={setMessage}
              attachments={attachments}
              setAttachments={setAttachments}
              minLength={10}
              isPending={createTicket.isPending}
              submitLabel={<Trans message="Criar chamado" />}
              placeholder={trans({
                message:
                  'Explique o que aconteceu, qual domínio foi afetado e quais passos você tentou.',
              })}
            />
          </Field>
        </form>
      </div>

      <aside className="border-t border-border/60 bg-card/30 p-4 lg:w-[280px] lg:border-l lg:border-t-0 lg:p-5">
        <h3 className="text-sm font-semibold">
          <Trans message="Detalhes" />
        </h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <Field label={<Trans message="Departamento" />}>
            <Select
              value={department}
              onValueChange={value => setDepartment(value ?? 'technical')}
            >
              <SelectTrigger className="h-10 w-full bg-background text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">
                  <Trans message="Suporte técnico" />
                </SelectItem>
                <SelectItem value="general">
                  <Trans message="Atendimento geral" />
                </SelectItem>
                <SelectItem value="billing">
                  <Trans message="Financeiro" />
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label={<Trans message="Prioridade" />}>
            <Select
              value={priority}
              onValueChange={value => setPriority(value ?? 'normal')}
            >
              <SelectTrigger className="h-10 w-full bg-background text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <Trans message="Baixa" />
                </SelectItem>
                <SelectItem value="normal">
                  <Trans message="Normal" />
                </SelectItem>
                <SelectItem value="high">
                  <Trans message="Alta" />
                </SelectItem>
                <SelectItem value="urgent">
                  <Trans message="Urgente" />
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label={<Trans message="Hospedagem vinculada" />}>
            <div className="flex h-10 items-center rounded-input border bg-background px-3 text-sm text-muted-foreground">
              {accountId ? (
                <Trans message="Hospedagem #:id" values={{id: accountId}} />
              ) : (
                <Trans message="Nenhuma hospedagem ativa" />
              )}
            </div>
          </Field>
        </div>
      </aside>
    </div>
  );
}

function TicketConversation({
  ticket,
  onBack,
  onUpdated,
}: {
  ticket: SupportTicket;
  onBack: () => void;
  onUpdated: (ticket: SupportTicket) => void;
}) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const {trans} = useTrans();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({block: 'end'});
  }, [ticket.id, ticket.messages?.length]);

  const reply = useMutation({
    ...replySupportTicketOptions(ticket.id),
    onSuccess: updatedTicket => {
      setMessage('');
      setAttachments([]);
      onUpdated(updatedTicket);
      toast.success(<Trans message="Resposta enviada com sucesso." />);
    },
    onError: error => showHttpErrorToast(error),
  });

  const submitReply = (event?: FormEvent) => {
    event?.preventDefault();
    if (message.trim().length < 2 || reply.isPending) {
      return;
    }
    reply.mutate({message, attachments});
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-9 md:hidden"
              onClick={onBack}
              aria-label={trans({message: 'Voltar para chamados'})}
            >
              <ArrowLeftIcon className="size-4" />
            </Button>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold tracking-tight">
                {ticket.subject}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusColor(ticket.status)}`}
                >
                  <Trans message={statusLabelMessage(ticket.status)} />
                </span>
                <span className="text-[11px] text-muted-foreground">
                  <Trans message="Chamado #:id" values={{id: ticket.id}} />
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-background/30 p-4 md:p-6">
          <div className="space-y-5">
            {ticket.messages?.map(item => (
              <TicketMessageBubble key={item.id} message={item} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {ticket.status !== 'closed' ? (
          <form
            onSubmit={submitReply}
            className="border-t border-border/60 bg-card/30 p-3 md:p-4"
          >
            <MessageComposer
              textareaId="ticket-reply"
              message={message}
              setMessage={setMessage}
              attachments={attachments}
              setAttachments={setAttachments}
              minLength={2}
              isPending={reply.isPending}
              submitLabel={<Trans message="Enviar resposta" />}
              placeholder={trans({message: 'Digite sua resposta...'})}
              onSubmit={submitReply}
              submitOnEnter
            />
          </form>
        ) : (
          <div className="border-t border-border/60 bg-card/30 p-6 text-center">
            <CheckCircle2Icon className="mx-auto mb-2 size-6 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              <Trans message="Este chamado está fechado." />
            </p>
          </div>
        )}
      </div>

      <aside className="hidden w-[280px] shrink-0 border-l border-border/60 bg-card/30 p-5 lg:block">
        <h3 className="text-sm font-semibold">
          <Trans message="Detalhes" />
        </h3>
        <dl className="mt-5 space-y-4 text-sm">
          <DetailItem label={<Trans message="Status" />}>
            <Trans message={statusLabelMessage(ticket.status)} />
          </DetailItem>
          <DetailItem label={<Trans message="Prioridade" />}>
            <Trans message={priorityLabelMessage(ticket.priority)} />
          </DetailItem>
          <DetailItem label={<Trans message="Tipo" />}>
            <Trans message={typeLabelMessage(ticket.type)} />
          </DetailItem>
          <DetailItem label={<Trans message="Departamento" />}>
            <Trans message={departmentLabelMessage(ticket.department)} />
          </DetailItem>
          <DetailItem label={<Trans message="Criado em" />}>
            {formatDate(ticket.created_at)}
          </DetailItem>
          <DetailItem label={<Trans message="Hospedagem" />}>
            {ticket.hosting_account_id ? (
              <Trans
                message="Hospedagem #:id"
                values={{id: ticket.hosting_account_id}}
              />
            ) : (
              <Trans message="Não vinculada" />
            )}
          </DetailItem>
        </dl>
      </aside>
    </div>
  );
}

function MessageComposer({
  textareaId,
  message,
  setMessage,
  attachments,
  setAttachments,
  minLength,
  isPending,
  submitLabel,
  placeholder,
  onSubmit,
  submitOnEnter = false,
}: {
  textareaId: string;
  message: string;
  setMessage: (value: string) => void;
  attachments: File[];
  setAttachments: (files: File[]) => void;
  minLength: number;
  isPending: boolean;
  submitLabel: React.ReactNode;
  placeholder: string;
  onSubmit?: () => void;
  submitOnEnter?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const {trans} = useTrans();

  const insertText = (value: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessage(`${message}${value}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setMessage(`${message.slice(0, start)}${value}${message.slice(end)}`);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + value.length, start + value.length);
    });
  };

  const appendFiles = (files: FileList | null) => {
    if (!files?.length) {
      return;
    }
    const next = [...attachments];
    for (const file of Array.from(files)) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.error(
          trans({
            message: 'Cada anexo pode ter no máximo 5 MB.',
          }),
        );
        continue;
      }
      if (next.length >= MAX_ATTACHMENTS) {
        toast.error(
          trans({
            message: 'Você pode anexar até 5 arquivos por mensagem.',
          }),
        );
        break;
      }
      if (
        next.some(
          item =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified,
        )
      ) {
        continue;
      }
      next.push(file);
    }
    setAttachments(next);
  };

  return (
    <div className="flex min-h-[220px] flex-1 flex-col overflow-hidden rounded-card border border-border bg-background shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
      <textarea
        id={textareaId}
        ref={textareaRef}
        className="min-h-[160px] flex-1 resize-none bg-transparent px-4 py-3 text-base outline-none md:text-sm"
        placeholder={placeholder}
        value={message}
        onChange={event => setMessage(event.target.value)}
        onKeyDown={event => {
          if (submitOnEnter && event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSubmit?.();
          }
        }}
        minLength={minLength}
        maxLength={10000}
        required
      />

      {attachments.length ? (
        <div className="border-t border-border/60 px-3 py-2">
          <div className="flex flex-wrap gap-2">
            {attachments.map(file => (
              <span
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="inline-flex max-w-full items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs"
              >
                <PaperclipIcon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {file.name} · {formatBytes(file.size)}
                </span>
                <button
                  type="button"
                  className="rounded-full text-muted-foreground hover:text-destructive focus-visible:outline-2 focus-visible:outline-primary"
                  onClick={() =>
                    setAttachments(attachments.filter(item => item !== file))
                  }
                  aria-label={trans({message: 'Remover anexo'})}
                  title={trans({message: 'Remover anexo'})}
                >
                  <XIcon className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-border/60 p-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1">
          <ToolbarButton
            label={trans({message: 'Inserir modelo de mensagem'})}
            onClick={() =>
              insertText(
                'Resumo:\n\nPassos que tentei:\n1. \n\nMensagem de erro:\n',
              )
            }
          >
            <TypeIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label={trans({message: 'Inserir lista'})}
            onClick={() => insertText(message.endsWith('\n') ? '- ' : '\n- ')}
          >
            <AlignLeftIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label={trans({message: 'Inserir emoji'})}
            onClick={() => insertText('🙂')}
          >
            <SmileIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label={trans({message: 'Anexar arquivo'})}
            onClick={() => fileInputRef.current?.click()}
          >
            <PaperclipIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label={trans({message: 'Anexar imagem'})}
            onClick={() => imageInputRef.current?.click()}
          >
            <ImageIcon className="size-4" />
          </ToolbarButton>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.csv,.zip"
            onChange={event => {
              appendFiles(event.target.files);
              event.currentTarget.value = '';
            }}
          />
          <input
            ref={imageInputRef}
            type="file"
            multiple
            className="hidden"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={event => {
              appendFiles(event.target.files);
              event.currentTarget.value = '';
            }}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            <Trans message="Enter envia, Shift+Enter quebra linha" />
          </span>
          <Button
            type="submit"
            className="h-9 min-w-32"
            disabled={isPending || message.trim().length < minLength}
          >
            {isPending ? (
              <LoaderCircleIcon className="mr-2 size-4 animate-spin" />
            ) : (
              <SendIcon className="mr-2 size-4" />
            )}
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-9 text-muted-foreground hover:text-foreground"
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function TicketMessageBubble({
  message,
}: {
  message: NonNullable<SupportTicket['messages']>[number];
}) {
  const isCustomer = message.author_type === 'customer';
  return (
    <div className={`flex w-full ${isCustomer ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`flex max-w-[92%] gap-3 sm:max-w-[78%] ${
          isCustomer ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        <div
          className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
            isCustomer
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {isCustomer ? 'VC' : 'HF'}
        </div>
        <div className={`min-w-0 ${isCustomer ? 'items-end' : 'items-start'}`}>
          <div
            className={`mb-1 flex items-center gap-2 text-xs text-muted-foreground ${
              isCustomer ? 'justify-end' : 'justify-start'
            }`}
          >
            <span className="font-medium text-foreground/80">
              {isCustomer ? (
                <Trans message="Você" />
              ) : (
                <Trans message="Suporte HospedFree" />
              )}
            </span>
            <span>{formatTime(message.created_at)}</span>
          </div>
          <div
            className={`overflow-hidden rounded-2xl border px-4 py-3 text-sm leading-6 shadow-sm ${
              isCustomer
                ? 'rounded-tr-sm bg-primary/10'
                : 'rounded-tl-sm bg-card'
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
            {message.attachments?.length ? (
              <AttachmentList attachments={message.attachments} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function AttachmentList({
  attachments,
}: {
  attachments: SupportTicketAttachment[];
}) {
  return (
    <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
      {attachments.map(attachment => (
        <a
          key={attachment.id}
          href={attachment.download_url}
          target="_blank"
          rel="noreferrer"
          className="flex min-w-0 items-center gap-3 rounded-input bg-background/70 px-3 py-2 text-xs transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-primary"
        >
          {attachment.mime_type?.startsWith('image/') ? (
            <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <FileIcon className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="min-w-0 flex-1 truncate">{attachment.file_name}</span>
          <span className="shrink-0 text-muted-foreground">
            {formatBytes(attachment.size)}
          </span>
          <DownloadIcon className="size-4 shrink-0 text-muted-foreground" />
        </a>
      ))}
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block min-w-0 ${className ?? ''}`}>
      <span className="mb-2 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function DetailItem({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words font-medium">{children}</dd>
    </div>
  );
}

function WelcomeState({onCreate}: {onCreate: () => void}) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 rounded-full bg-primary/10 p-5">
        <LifeBuoyIcon className="size-10 text-primary" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight">
        <Trans message="Bem-vindo ao suporte" />
      </h2>
      <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
        <Trans message="Selecione um chamado para continuar a conversa ou abra um novo atendimento." />
      </p>
      <Button onClick={onCreate} className="mt-8">
        <PenSquareIcon className="mr-2 size-4" />
        <Trans message="Novo chamado" />
      </Button>
    </div>
  );
}

function EmptyTicketList({hasSearch}: {hasSearch: boolean}) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center text-sm text-muted-foreground">
      <CheckCircle2Icon className="mb-3 size-8 text-muted-foreground/40" />
      {hasSearch ? (
        <Trans message="Nenhum chamado encontrado." />
      ) : (
        <Trans message="Sua caixa de entrada está vazia." />
      )}
    </div>
  );
}

function ticketInitials(ticket: SupportTicket): string {
  return ticket.status === 'pending_customer' ? 'HF' : 'VC';
}

function statusLabelMessage(status: string): string {
  return (
    (
      {
        open: 'Aberto',
        pending_customer: 'Aguardando cliente',
        pending_support: 'Aguardando suporte',
        resolved: 'Resolvido',
        closed: 'Fechado',
      } as Record<string, string>
    )[status] ?? 'Status desconhecido'
  );
}

function priorityLabelMessage(priority: string): string {
  return (
    (
      {
        low: 'Baixa',
        normal: 'Normal',
        high: 'Alta',
        urgent: 'Urgente',
        critical: 'Crítica',
      } as Record<string, string>
    )[priority] ?? 'Normal'
  );
}

function typeLabelMessage(type: string): string {
  return (
    (
      {
        ticket: 'Suporte técnico',
        bug: 'Relatar problema',
        feature: 'Sugestão',
      } as Record<string, string>
    )[type] ?? 'Suporte técnico'
  );
}

function departmentLabelMessage(department: string): string {
  return (
    (
      {
        technical: 'Suporte técnico',
        general: 'Atendimento geral',
        billing: 'Financeiro',
      } as Record<string, string>
    )[department] ?? 'Suporte técnico'
  );
}

function statusColor(status: string): string {
  return (
    (
      {
        open: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300',
        pending_customer:
          'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300',
        pending_support:
          'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300',
        resolved:
          'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:text-indigo-300',
        closed:
          'bg-slate-500/10 text-slate-700 border-slate-500/20 dark:text-slate-300',
      } as Record<string, string>
    )[status] ?? 'bg-muted text-muted-foreground border-border'
  );
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
