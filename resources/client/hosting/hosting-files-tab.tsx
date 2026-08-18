import {
  createHostingFileOptions,
  deleteHostingFileOptions,
  downloadHostingFile,
  hostingFileContentOptions,
  hostingFilesOptions,
  openHostingToolOptions,
  updateHostingFileOptions,
  uploadHostingFileOptions,
} from '@app/hosting/hosting-queries';
import {
  HostingAccount,
  HostingFileEntry,
  HostingFileManagerSettings,
} from '@app/hosting/hosting-types';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {AlertDialog} from '@shadcn/alert-dialog/alert-dialog';
import {Button} from '@shadcn/button/button';
import {Card} from '@shadcn/card/card';
import {Dialog} from '@shadcn/dialog/dialog';
import {Dropdown} from '@shadcn/dropdown/dropdown';
import {Input} from '@shadcn/forms/input/input';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {toast} from '@shadcn/toast/toast';
import {useMutation, useQuery} from '@tanstack/react-query';
import {FormattedBytes} from '@ui/i18n/formatted-bytes';
import {Trans} from '@ui/i18n/trans';
import {
  ChevronRightIcon,
  ArchiveIcon,
  CircleAlertIcon,
  CopyIcon,
  DownloadIcon,
  EllipsisIcon,
  FileCode2Icon,
  FileIcon,
  FolderInputIcon,
  FolderIcon,
  FolderPlusIcon,
  HomeIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  PackageOpenIcon,
  RefreshCwIcon,
  Trash2Icon,
  UploadIcon,
} from 'lucide-react';
import {FormEvent, lazy, Suspense, useEffect, useRef, useState} from 'react';
import {useOutletContext} from 'react-router';

const AceEditor = lazy(() => import('@common/ace-editor/ace-editor'));

export function Component() {
  const {account} = useOutletContext<{account: HostingAccount}>();
  const [path, setPath] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const files = useQuery(hostingFilesOptions(account.id, path));
  const upload = useMutation({
    ...uploadHostingFileOptions(account.id),
    onSuccess: () =>
      toast.success(<Trans message="Arquivo enviado com sucesso." />),
    onError: error => showHttpErrorToast(error),
  });
  const openFallback = useMutation({
    ...openHostingToolOptions(account.id),
    onSuccess: data => window.open(data.url, '_blank', 'noopener,noreferrer'),
    onError: error => showHttpErrorToast(error),
  });
  const parts = path ? path.split('/') : [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">
            <Trans message="Arquivos" />
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            <Trans message="Gerencie os arquivos desta hospedagem sem expor as credenciais FTP no navegador." />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => files.refetch()}
            disabled={files.isFetching}
          >
            <RefreshCwIcon
              className={files.isFetching ? 'animate-spin' : undefined}
            />
            <Trans message="Atualizar" />
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInput.current?.click()}
            disabled={
              upload.isPending || files.data?.availability !== 'available'
            }
          >
            {upload.isPending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <UploadIcon />
            )}
            <Trans message="Enviar arquivo" />
          </Button>
          <input
            ref={fileInput}
            type="file"
            className="sr-only"
            aria-label="Selecionar arquivo para enviar"
            onChange={event => {
              const file = event.target.files?.[0];
              if (file) upload.mutate({directory: path, file});
              event.target.value = '';
            }}
          />
          <Button
            onClick={() => setCreateOpen(true)}
            disabled={files.data?.availability !== 'available'}
          >
            <PlusIcon />
            <Trans message="Novo" />
          </Button>
        </div>
      </div>

      <Card.Root>
        <Card.Header>
          <nav
            aria-label="Caminho dos arquivos"
            className="flex min-w-0 flex-wrap items-center gap-1 text-sm"
          >
            <button
              type="button"
              onClick={() => setPath('')}
              className="rounded-button p-1.5 text-muted-foreground hover:bg-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              aria-label="Diretório inicial"
            >
              <HomeIcon className="size-4" />
            </button>
            {parts.map((part, index) => {
              const target = parts.slice(0, index + 1).join('/');
              return (
                <span key={target} className="flex min-w-0 items-center gap-1">
                  <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => setPath(target)}
                    className="max-w-48 truncate rounded-button px-1.5 py-1 hover:bg-hover"
                  >
                    {part}
                  </button>
                </span>
              );
            })}
          </nav>
        </Card.Header>
        <Card.Content className="px-0 pb-0">
          {files.isLoading ? (
            <div className="space-y-2 px-6 pb-6">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : files.isError || files.data?.availability !== 'available' ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 pb-6 text-center">
              <CircleAlertIcon className="size-8 text-warning" />
              <h2 className="mt-3 font-medium">
                <Trans message="Gerenciador de arquivos indisponível" />
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                <Trans message="Verifique a configuração segura do servidor de arquivos ou tente novamente em alguns minutos." />
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => files.refetch()}
              >
                <RefreshCwIcon />
                <Trans message="Tentar novamente" />
              </Button>
              {files.data?.settings.external_fallback &&
              (account.tools.file_manager || account.tools.webftp) ? (
                <Button
                  className="mt-2"
                  disabled={openFallback.isPending}
                  onClick={() =>
                    openFallback.mutate(
                      account.tools.file_manager ? 'file-manager' : 'webftp',
                    )
                  }
                >
                  {openFallback.isPending ? (
                    <LoaderCircleIcon className="animate-spin" />
                  ) : (
                    <FolderIcon />
                  )}
                  <Trans message="Abrir gerenciador externo" />
                </Button>
              ) : null}
            </div>
          ) : files.data.data.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 pb-6 text-center">
              <FolderIcon className="size-9 text-muted-foreground" />
              <h2 className="mt-3 font-medium">
                <Trans message="Esta pasta está vazia" />
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                <Trans message="Crie uma pasta ou um arquivo de texto para começar." />
              </p>
            </div>
          ) : (
            <div className="divide-y border-t">
              {files.data.data.map(entry => (
                <FileRow
                  accountId={account.id}
                  entry={entry}
                  settings={files.data!.settings}
                  key={entry.path}
                  onOpen={() =>
                    entry.type === 'directory'
                      ? setPath(entry.path)
                      : setEditingPath(entry.path)
                  }
                />
              ))}
            </div>
          )}
        </Card.Content>
      </Card.Root>

      <CreateEntryDialog
        accountId={account.id}
        directory={path}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <EditFileDialog
        accountId={account.id}
        path={editingPath}
        settings={files.data?.settings}
        onOpenChange={open => !open && setEditingPath(null)}
      />
    </div>
  );
}

function FileRow({
  accountId,
  entry,
  settings,
  onOpen,
}: {
  accountId: number;
  entry: HostingFileEntry;
  settings: HostingFileManagerSettings;
  onOpen: () => void;
}) {
  const Icon = entry.type === 'directory' ? FolderIcon : FileIcon;
  const [operation, setOperation] = useState<
    'rename' | 'copy' | 'move' | 'archive' | null
  >(null);
  const parentDirectory = entry.path.includes('/')
    ? entry.path.slice(0, entry.path.lastIndexOf('/'))
    : '';
  const isZip =
    entry.type === 'file' && entry.name.toLowerCase().endsWith('.zip');
  const extract = useMutation({
    ...updateHostingFileOptions(accountId),
    onSuccess: () =>
      toast.success(<Trans message="Arquivo ZIP extraído com sucesso." />),
    onError: error => showHttpErrorToast(error),
  });
  const download = useMutation({
    mutationFn: () => downloadHostingFile(accountId, entry.path),
    onSuccess: blob => {
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = entry.name;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    },
    onError: error => showHttpErrorToast(error),
  });

  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-3 sm:px-6">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-button text-start focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Icon className="size-5 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate font-medium">
          {entry.name}
        </span>
        <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
          {entry.type === 'file' && entry.size != null ? (
            <FormattedBytes bytes={entry.size} />
          ) : (
            <Trans message="Pasta" />
          )}
        </span>
      </button>
      {entry.type === 'file' && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpen}
          aria-label="Editar arquivo"
        >
          <PencilIcon />
        </Button>
      )}
      <Dropdown.Root>
        <Dropdown.Trigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Mais ações do item"
            />
          }
        >
          {download.isPending || extract.isPending ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <EllipsisIcon />
          )}
        </Dropdown.Trigger>
        <Dropdown.Content>
          {entry.type === 'file' && (
            <Dropdown.Item onClick={() => download.mutate()}>
              <DownloadIcon />
              <Trans message="Baixar" />
            </Dropdown.Item>
          )}
          <Dropdown.Item onClick={() => setOperation('rename')}>
            <PencilIcon />
            <Trans message="Renomear" />
          </Dropdown.Item>
          <Dropdown.Item onClick={() => setOperation('copy')}>
            <CopyIcon />
            <Trans message="Copiar para" />
          </Dropdown.Item>
          <Dropdown.Item onClick={() => setOperation('move')}>
            <FolderInputIcon />
            <Trans message="Mover para" />
          </Dropdown.Item>
          {settings.allow_zip_operations ? (
            <Dropdown.Item onClick={() => setOperation('archive')}>
              <ArchiveIcon />
              <Trans message="Compactar em ZIP" />
            </Dropdown.Item>
          ) : null}
          {settings.allow_zip_operations && isZip ? (
            <Dropdown.Item
              onClick={() =>
                extract.mutate({
                  path: entry.path,
                  operation: 'extract',
                  destination: parentDirectory,
                })
              }
            >
              <PackageOpenIcon />
              <Trans message="Extrair aqui" />
            </Dropdown.Item>
          ) : null}
        </Dropdown.Content>
      </Dropdown.Root>
      <DeleteEntryButton accountId={accountId} entry={entry} />
      <FileOperationDialog
        accountId={accountId}
        entry={entry}
        operation={operation}
        onOpenChange={open => !open && setOperation(null)}
      />
    </div>
  );
}

function FileOperationDialog({
  accountId,
  entry,
  operation,
  onOpenChange,
}: {
  accountId: number;
  entry: HostingFileEntry;
  operation: 'rename' | 'copy' | 'move' | 'archive' | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [value, setValue] = useState('');
  const update = useMutation({
    ...updateHostingFileOptions(accountId),
    onSuccess: () => {
      onOpenChange(false);
      toast.success(<Trans message="Operação concluída com sucesso." />);
    },
    onError: error => showHttpErrorToast(error),
  });

  useEffect(() => {
    if (!operation) return;
    if (operation === 'rename') {
      setValue(entry.name);
      return;
    }

    if (operation === 'archive') {
      setValue(`${entry.path}.zip`);
      return;
    }

    const separator = entry.path.lastIndexOf('/');
    const directory = separator >= 0 ? entry.path.slice(0, separator + 1) : '';
    setValue(
      operation === 'copy' ? `${directory}copia-${entry.name}` : entry.path,
    );
  }, [entry.name, entry.path, operation]);

  return (
    <Dialog.Root open={operation != null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>
              {operation === 'rename' ? (
                <>
                  <PencilIcon />
                  <Trans message="Renomear item" />
                </>
              ) : operation === 'copy' ? (
                <>
                  <CopyIcon />
                  <Trans message="Copiar item" />
                </>
              ) : operation === 'archive' ? (
                <>
                  <ArchiveIcon />
                  <Trans message="Compactar item" />
                </>
              ) : (
                <>
                  <FolderInputIcon />
                  <Trans message="Mover item" />
                </>
              )}
            </Dialog.Title>
            <Dialog.Description>
              <Trans message="Informe um nome novo ou um caminho relativo dentro desta hospedagem." />
            </Dialog.Description>
          </Dialog.Header>
          <form
            className="space-y-4"
            onSubmit={event => {
              event.preventDefault();
              if (!operation || !value.trim()) return;
              update.mutate(
                operation === 'rename'
                  ? {path: entry.path, operation, name: value.trim()}
                  : {
                      path: entry.path,
                      operation,
                      destination: value.trim(),
                    },
              );
            }}
          >
            <div>
              <label
                htmlFor={`file-operation-${entry.path}`}
                className="text-sm font-medium"
              >
                {operation === 'rename' ? (
                  <Trans message="Novo nome" />
                ) : (
                  <Trans message="Caminho de destino" />
                )}
              </label>
              <Input
                id={`file-operation-${entry.path}`}
                className="mt-2"
                value={value}
                onChange={event => setValue(event.target.value)}
                autoComplete="off"
                maxLength={1024}
                required
              />
            </div>
            <Dialog.Footer>
              <Dialog.CloseButton disabled={update.isPending}>
                <Trans message="Cancelar" />
              </Dialog.CloseButton>
              <Button
                type="submit"
                disabled={update.isPending || !value.trim()}
              >
                {update.isPending && (
                  <LoaderCircleIcon className="animate-spin" />
                )}
                <Trans message="Confirmar" />
              </Button>
            </Dialog.Footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CreateEntryDialog({
  accountId,
  directory,
  open,
  onOpenChange,
}: {
  accountId: number;
  directory: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [type, setType] = useState<'file' | 'directory'>('directory');
  const [name, setName] = useState('');
  const create = useMutation({
    ...createHostingFileOptions(accountId),
    onSuccess: () => {
      setName('');
      onOpenChange(false);
      toast.success(<Trans message="Item criado com sucesso." />);
    },
    onError: error => showHttpErrorToast(error),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate({type, directory, name: name.trim()});
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>
              <FolderPlusIcon />
              <Trans message="Criar item" />
            </Dialog.Title>
            <Dialog.Description>
              <Trans message="Crie uma pasta ou um arquivo editável no diretório atual." />
            </Dialog.Description>
          </Dialog.Header>
          <form onSubmit={submit} className="space-y-4">
            <div className="flex gap-2" role="group" aria-label="Tipo do item">
              <Button
                type="button"
                variant={type === 'directory' ? 'default' : 'outline'}
                onClick={() => setType('directory')}
              >
                <FolderIcon />
                <Trans message="Pasta" />
              </Button>
              <Button
                type="button"
                variant={type === 'file' ? 'default' : 'outline'}
                onClick={() => setType('file')}
              >
                <FileCode2Icon />
                <Trans message="Arquivo" />
              </Button>
            </div>
            <div>
              <label htmlFor="new-file-name" className="text-sm font-medium">
                <Trans message="Nome" />
              </label>
              <Input
                id="new-file-name"
                className="mt-2"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder={type === 'directory' ? 'assets' : 'index.php'}
                autoComplete="off"
                maxLength={255}
                required
              />
            </div>
            <Dialog.Footer>
              <Dialog.CloseButton disabled={create.isPending}>
                <Trans message="Cancelar" />
              </Dialog.CloseButton>
              <Button type="submit" disabled={create.isPending || !name.trim()}>
                {create.isPending && (
                  <LoaderCircleIcon className="animate-spin" />
                )}
                <Trans message="Criar" />
              </Button>
            </Dialog.Footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function EditFileDialog({
  accountId,
  path,
  settings,
  onOpenChange,
}: {
  accountId: number;
  path: string | null;
  settings?: HostingFileManagerSettings;
  onOpenChange: (open: boolean) => void;
}) {
  const file = useQuery(hostingFileContentOptions(accountId, path));
  const [draft, setDraft] = useState<string | null>(null);
  const update = useMutation({
    ...updateHostingFileOptions(accountId),
    onSuccess: () => {
      onOpenChange(false);
      setDraft(null);
      toast.success(<Trans message="Arquivo salvo com sucesso." />);
    },
    onError: error => showHttpErrorToast(error),
  });
  const content = draft ?? file.data?.content ?? '';

  return (
    <Dialog.Root open={path != null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content className="h-[min(90vh,900px)] w-full gap-0 sm:max-w-6xl">
          <Dialog.Header>
            <Dialog.Title>
              <FileCode2Icon />
              <span className="min-w-0 truncate">{path}</span>
            </Dialog.Title>
            <Dialog.Description>
              <Trans message="Edite arquivos de texto de até 1 MB. Alterações são enviadas diretamente à hospedagem." />
            </Dialog.Description>
          </Dialog.Header>
          {file.isLoading ? (
            <Skeleton className="mt-5 min-h-96 flex-auto" />
          ) : file.isError ? (
            <p className="bg-danger/10 text-danger mt-5 rounded-input p-4 text-sm">
              <Trans message="Este arquivo não pôde ser aberto para edição." />
            </p>
          ) : (
            <div className="relative -mx-6 mt-5 min-h-96 flex-auto overflow-hidden border-y">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center">
                    <LoaderCircleIcon
                      className="size-5 animate-spin"
                      aria-label="Carregando editor"
                    />
                  </div>
                }
              >
                <AceEditor
                  mode={editorMode(path)}
                  value={content}
                  onChange={setDraft}
                  beautify={settings?.code_beautify ?? true}
                  theme={settings?.editor_theme ?? 'auto'}
                  enableBasicAutocompletion={settings?.code_suggestion ?? true}
                  enableLiveAutocompletion={settings?.auto_complete ?? true}
                />
              </Suspense>
            </div>
          )}
          <Dialog.Footer className="mt-5">
            <Dialog.CloseButton disabled={update.isPending}>
              <Trans message="Cancelar" />
            </Dialog.CloseButton>
            <Button
              disabled={update.isPending || file.isError || !path}
              onClick={() =>
                path && update.mutate({path, operation: 'write', content})
              }
            >
              {update.isPending && (
                <LoaderCircleIcon className="animate-spin" />
              )}
              <Trans message="Salvar arquivo" />
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function editorMode(
  path: string | null,
): 'css' | 'html' | 'javascript' | 'php_laravel_blade' | 'json' | 'text' {
  const extension = path?.split('.').pop()?.toLowerCase();

  if (extension === 'css') return 'css';
  if (extension === 'html' || extension === 'htm') return 'html';
  if (extension === 'js') return 'javascript';
  if (extension === 'json') return 'json';
  if (extension === 'php') return 'php_laravel_blade';

  return 'text';
}

function DeleteEntryButton({
  accountId,
  entry,
}: {
  accountId: number;
  entry: HostingFileEntry;
}) {
  const [open, setOpen] = useState(false);
  const remove = useMutation({
    ...deleteHostingFileOptions(accountId),
    onSuccess: () => {
      setOpen(false);
      toast.success(<Trans message="Item removido com sucesso." />);
    },
    onError: error => showHttpErrorToast(error),
  });

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger
        render={
          <Button
            variant="ghost"
            color="danger"
            size="icon-sm"
            aria-label="Remover item"
          />
        }
      >
        <Trash2Icon />
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop />
        <AlertDialog.Content size="sm">
          <AlertDialog.Header>
            <AlertDialog.Media>
              <Trash2Icon />
            </AlertDialog.Media>
            <AlertDialog.Title>
              <Trans message="Remover item" />
            </AlertDialog.Title>
            <AlertDialog.Description>
              <Trans
                message="Remover :name permanentemente? Pastas também terão seu conteúdo removido."
                values={{name: entry.name}}
              />
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel disabled={remove.isPending}>
              <Trans message="Cancelar" />
            </AlertDialog.Cancel>
            <AlertDialog.Action
              color="danger"
              disabled={remove.isPending}
              onClick={() => remove.mutate(entry.path)}
            >
              {remove.isPending && (
                <LoaderCircleIcon className="animate-spin" />
              )}
              <Trans message="Remover" />
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
