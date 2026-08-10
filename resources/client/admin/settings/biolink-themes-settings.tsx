import {
  boolValue,
  defaultButtonConfig,
  defaultHeaderConfig,
  themeCategory,
} from '@app/dashboard/biolink/biolink-editor/appearance/biolink-theme-utils';
import {ThemeCardFromTheme} from '@app/dashboard/biolink/biolink-editor/appearance/theme-preview-card';
import type {CrupdateBiolinkThemeRequestCategory} from '@app/gen/schemas/crupdate-biolink-theme-request-category';
import {
  createBiolinkTheme,
  deleteBiolinkTheme,
  updateBiolinkTheme,
} from '@app/gen/biolink-themes';
import type {BiolinkTheme} from '@app/gen/schemas/biolink-theme';
import type {CrupdateBiolinkThemeRequest} from '@app/gen/schemas/crupdate-biolink-theme-request';
import type {ListBiolinkThemes200} from '@app/gen/schemas/list-biolink-themes200';
import {AlertDialog} from '@shadcn/alert-dialog/alert-dialog';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Input} from '@shadcn/forms/input/input';
import {Switch} from '@shadcn/forms/switch/switch';
import {Textarea} from '@shadcn/forms/textarea/textarea';
import {toast} from '@shadcn/toast/toast';
import {DashboardLayout} from '@common/ui/dashboard/dashboard-layout';
import {orvalApiFetch, queryClient} from '@common/http/query-client';
import {SettingsMobileNav} from '@common/admin/settings/layout/settings-layout';
import {BrowserSafeFonts} from '@ui/fonts/font-picker/browser-safe-fonts';
import {Trans} from '@ui/i18n/trans';
import {cn} from '@ui/utils/cn';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';
import {useMutation, useQuery} from '@tanstack/react-query';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import {FormEvent, ReactNode, useEffect, useMemo, useState} from 'react';

const adminBiolinkThemesKey = ['biolink-themes', 'admin'];

interface ThemeFormState {
  name: string;
  slug: string;
  category: string;
  sort_order: string;
  is_published: boolean;
  configText: string;
  metadataText: string;
}

export function Component() {
  const isMobile = useIsMobileMediaQuery();
  const [editingTheme, setEditingTheme] = useState<BiolinkTheme | 'new' | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<BiolinkTheme | null>(null);
  const themesQuery = useQuery({
    queryKey: adminBiolinkThemesKey,
    queryFn: () =>
      orvalApiFetch<ListBiolinkThemes200>({
        url: '/biolink-themes',
        method: 'GET',
        params: {include_unpublished: true},
      }),
  });
  const themes = themesQuery.data?.data ?? [];

  return (
    <DashboardLayout.MainSection className="relative">
      <DashboardLayout.SectionHeader>
        {isMobile && <DashboardLayout.SidebarToggle />}
        <DashboardLayout.SectionTitle>
          <Trans message="Biolink themes" />
        </DashboardLayout.SectionTitle>
        {isMobile && <SettingsMobileNav />}
        <Button type="button" onClick={() => setEditingTheme('new')}>
          <PlusIcon data-icon="inline-start" />
          <Trans message="New theme" />
        </Button>
      </DashboardLayout.SectionHeader>

      <div className="compact-scrollbar flex-auto overflow-y-auto p-3 md:p-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <div className="text-sm text-muted-foreground">
            <Trans message="Manage the global biolink themes available in the editor. System themes can be unpublished or reordered, but not deleted." />
          </div>
          {themesQuery.isLoading ? (
            <div className="rounded-card border p-6 text-sm text-muted-foreground">
              <Trans message="Loading themes..." />
            </div>
          ) : (
            themes.map(theme => (
              <ThemeRow
                key={theme.slug}
                theme={theme}
                onDelete={() => setDeleteTarget(theme)}
                onEdit={() => setEditingTheme(theme)}
              />
            ))
          )}
        </div>
      </div>

      <ThemeDialog
        theme={editingTheme}
        onOpenChange={open => {
          if (!open) setEditingTheme(null);
        }}
      />
      <DeleteThemeDialog
        theme={deleteTarget}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </DashboardLayout.MainSection>
  );
}

function ThemeRow({
  onDelete,
  onEdit,
  theme,
}: {
  onDelete: () => void;
  onEdit: () => void;
  theme: BiolinkTheme;
}) {
  const published = boolValue(theme.is_published);
  const system = boolValue(theme.is_system);
  const updateTheme = useThemeUpdateMutation();
  const duplicateTheme = useThemeCreateMutation();
  const basePayload = payloadFromTheme(theme);

  const updateSortOrder = (direction: 'up' | 'down') => {
    updateTheme.mutate({
      id: Number(theme.id),
      payload: {
        ...basePayload,
        sort_order:
          Number(theme.sort_order || 0) + (direction === 'up' ? -10 : 10),
      },
      message: <Trans message="Theme reordered" />,
    });
  };

  return (
    <div className="grid gap-4 rounded-card border bg-card p-4 md:grid-cols-[110px_1fr_auto] md:items-center">
      <ThemeCardFromTheme theme={theme} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="truncate text-base font-semibold">{theme.name}</div>
          <Badge>
            {themeCategory(theme) === 'curated' ? (
              <Trans message="Curated" />
            ) : (
              <Trans message="Customizable" />
            )}
          </Badge>
          <Badge variant={published ? 'positive' : 'muted'}>
            {published ? <Trans message="Published" /> : <Trans message="Draft" />}
          </Badge>
          {system ? (
            <Badge>
              <Trans message="System" />
            </Badge>
          ) : null}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          {theme.slug} · <Trans message="Order" /> {theme.sort_order}
        </div>
      </div>
      <div className="flex flex-wrap justify-start gap-2 md:justify-end">
        <Button
          type="button"
          size="sm"
          variant="outline"
          color="default"
          onClick={() => updateSortOrder('up')}
        >
          <ArrowUpIcon data-icon="inline-start" />
          <Trans message="Up" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          color="default"
          onClick={() => updateSortOrder('down')}
        >
          <ArrowDownIcon data-icon="inline-start" />
          <Trans message="Down" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          color="default"
          onClick={onEdit}
        >
          <PencilIcon data-icon="inline-start" />
          <Trans message="Edit" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          color="default"
          onClick={() => {
            duplicateTheme.mutate({
              payload: {
                ...basePayload,
                name: `${theme.name} copy`,
                slug: undefined,
                is_published: false,
                sort_order: Number(theme.sort_order || 0) + 1,
              },
              message: <Trans message="Theme duplicated" />,
            });
          }}
        >
          <CopyIcon data-icon="inline-start" />
          <Trans message="Duplicate" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          color="default"
          onClick={() => {
            updateTheme.mutate({
              id: Number(theme.id),
              payload: {...basePayload, is_published: !published},
              message: published ? (
                <Trans message="Theme unpublished" />
              ) : (
                <Trans message="Theme published" />
              ),
            });
          }}
        >
          {published ? (
            <EyeOffIcon data-icon="inline-start" />
          ) : (
            <EyeIcon data-icon="inline-start" />
          )}
          {published ? <Trans message="Unpublish" /> : <Trans message="Publish" />}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          color="danger"
          disabled={system}
          onClick={onDelete}
        >
          <Trash2Icon data-icon="inline-start" />
          <Trans message="Delete" />
        </Button>
      </div>
    </div>
  );
}

function ThemeDialog({
  onOpenChange,
  theme,
}: {
  onOpenChange: (open: boolean) => void;
  theme: BiolinkTheme | 'new' | null;
}) {
  const open = !!theme;
  const isCreate = theme === 'new';
  const createTheme = useThemeCreateMutation(() => onOpenChange(false));
  const updateTheme = useThemeUpdateMutation(() => onOpenChange(false));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const initialState = useMemo(() => formStateFromTheme(theme), [theme]);
  const [formState, setFormState] = useState<ThemeFormState>(initialState);

  useEffect(() => {
    if (open) {
      setFormState(initialState);
      setJsonError(null);
    }
  }, [initialState, open]);

  const setField = <Key extends keyof ThemeFormState>(
    key: Key,
    value: ThemeFormState[Key],
  ) => setFormState(current => ({...current, [key]: value}));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setJsonError(null);

    let config: Record<string, unknown>;
    let metadata: Record<string, unknown> | undefined;
    try {
      const parsed = JSON.parse(formState.configText);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        throw new Error('Config must be an object.');
      }
      config = parsed;

      const parsedMetadata = formState.metadataText.trim()
        ? JSON.parse(formState.metadataText)
        : null;
      if (
        parsedMetadata &&
        (Array.isArray(parsedMetadata) || typeof parsedMetadata !== 'object')
      ) {
        throw new Error('Metadata must be an object.');
      }
      metadata = parsedMetadata ?? undefined;
    } catch {
      setJsonError('Invalid JSON.');
      return;
    }

    const payload: ThemePayload = {
      name: formState.name,
      slug: formState.slug || undefined,
      category: formState.category as CrupdateBiolinkThemeRequestCategory,
      config,
      metadata,
      sort_order: Number(formState.sort_order || 0),
      is_published: formState.is_published,
    };

    if (isCreate) {
      createTheme.mutate({
        payload,
        message: <Trans message="Theme created" />,
      });
    } else if (theme) {
      updateTheme.mutate({
        id: Number(theme.id),
        payload,
        message: <Trans message="Theme updated" />,
      });
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={nextOpen => {
        if (nextOpen && theme) {
          setFormState(formStateFromTheme(theme));
          setJsonError(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content className="sm:max-w-2xl">
          <Dialog.Header>
            <Dialog.Title>
              {isCreate ? (
                <Trans message="New biolink theme" />
              ) : (
                <Trans message="Edit biolink theme" />
              )}
            </Dialog.Title>
            <Dialog.Description>
              <Trans message="Edit the global theme metadata and JSON config used by the biolink editor." />
            </Dialog.Description>
          </Dialog.Header>
          <form onSubmit={handleSubmit}>
            <Dialog.Body className="flex max-h-[70vh] flex-col gap-4">
              <FieldLine label={<Trans message="Name" />}>
                <Input
                  bindToHookForm={false}
                  value={formState.name}
                  required
                  minLength={3}
                  maxLength={80}
                  onChange={e => setField('name', e.target.value)}
                />
              </FieldLine>
              <FieldLine label={<Trans message="Slug" />}>
                <Input
                  bindToHookForm={false}
                  value={formState.slug}
                  maxLength={80}
                  onChange={e => setField('slug', e.target.value)}
                />
              </FieldLine>
              <FieldLine label={<Trans message="Category" />}>
                <div className="grid grid-cols-2 gap-2">
                  <ChoiceButton
                    active={formState.category === 'customizable'}
                    onClick={() => setField('category', 'customizable')}
                  >
                    <Trans message="Customizable" />
                  </ChoiceButton>
                  <ChoiceButton
                    active={formState.category === 'curated'}
                    onClick={() => setField('category', 'curated')}
                  >
                    <Trans message="Curated" />
                  </ChoiceButton>
                </div>
              </FieldLine>
              <FieldLine label={<Trans message="Order" />}>
                <Input
                  bindToHookForm={false}
                  type="number"
                  min={0}
                  value={formState.sort_order}
                  onChange={e => setField('sort_order', e.target.value)}
                />
              </FieldLine>
              <FieldLine label={<Trans message="Published" />}>
                <Switch
                  checked={formState.is_published}
                  onCheckedChange={checked =>
                    setField('is_published', checked)
                  }
                />
              </FieldLine>
              <FieldLine label={<Trans message="Config JSON" />}>
                <Textarea
                  bindToHookForm={false}
                  rows={16}
                  className="font-mono text-xs"
                  value={formState.configText}
                  onChange={e => setField('configText', e.target.value)}
                />
                {jsonError ? (
                  <div className="mt-2 text-sm text-destructive">
                    <Trans message="Invalid JSON config." />
                  </div>
                ) : null}
              </FieldLine>
              <FieldLine label={<Trans message="Metadata JSON" />}>
                <Textarea
                  bindToHookForm={false}
                  rows={8}
                  className="font-mono text-xs"
                  value={formState.metadataText}
                  onChange={e => setField('metadataText', e.target.value)}
                />
              </FieldLine>
            </Dialog.Body>
            <Dialog.Footer variant="muted">
              <Dialog.CloseButton type="button" variant="outline">
                <Trans message="Cancel" />
              </Dialog.CloseButton>
              <Button type="submit" disabled={createTheme.isPending || updateTheme.isPending}>
                <Trans message="Save theme" />
              </Button>
            </Dialog.Footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DeleteThemeDialog({
  onOpenChange,
  theme,
}: {
  onOpenChange: (open: boolean) => void;
  theme: BiolinkTheme | null;
}) {
  const deleteTheme = useThemeDeleteMutation(() => onOpenChange(false));

  return (
    <AlertDialog.Root open={!!theme} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop />
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Media>
              <Trash2Icon />
            </AlertDialog.Media>
            <AlertDialog.Title>
              <Trans message="Delete theme?" />
            </AlertDialog.Title>
            <AlertDialog.Description>
              <Trans message="This removes the theme from the global library. Existing biolinks keep their saved appearance config." />
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel>
              <Trans message="Cancel" />
            </AlertDialog.Cancel>
            <AlertDialog.Action
              color="danger"
              disabled={deleteTheme.isPending || !theme}
              onClick={() => {
                if (theme) {
                  deleteTheme.mutate(Number(theme.id));
                }
              }}
            >
              <Trans message="Delete" />
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

function FieldLine({children, label}: {children: ReactNode; label: ReactNode}) {
  return (
    <div className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </div>
  );
}

function ChoiceButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      color={active ? 'primary' : 'default'}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function Badge({
  children,
  variant = 'muted',
}: {
  children: ReactNode;
  variant?: 'muted' | 'positive';
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        variant === 'positive'
          ? 'bg-positive/15 text-positive'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {children}
    </span>
  );
}

type ThemePayload = CrupdateBiolinkThemeRequest & {
  metadata?: Record<string, unknown>;
};

function payloadFromTheme(theme: BiolinkTheme): ThemePayload {
  return {
    name: theme.name,
    slug: theme.slug,
    category: themeCategory(theme),
    config: theme.config as Record<string, unknown>,
    metadata: theme.metadata as ThemePayload['metadata'],
    sort_order: Number(theme.sort_order || 0),
    is_published: boolValue(theme.is_published),
  };
}

function formStateFromTheme(theme: BiolinkTheme | 'new' | null): ThemeFormState {
  if (theme && theme !== 'new') {
    return {
      name: theme.name,
      slug: theme.slug,
      category: themeCategory(theme),
      sort_order: String(theme.sort_order ?? 0),
      is_published: boolValue(theme.is_published),
      configText: JSON.stringify(theme.config, null, 2),
      metadataText: JSON.stringify(
        (theme as BiolinkTheme & {metadata?: Record<string, unknown>})
          .metadata ?? {},
        null,
        2,
      ),
    };
  }

  return {
    name: '',
    slug: '',
    category: 'customizable',
    sort_order: '0',
    is_published: true,
    configText: JSON.stringify(defaultThemeConfig(), null, 2),
    metadataText: JSON.stringify({isModel: false, device: 'both'}, null, 2),
  };
}

function defaultThemeConfig(): Record<string, unknown> {
  return {
    theme: {
      slug: 'custom-theme',
      category: 'customizable',
      locked: false,
      modified: false,
    },
    bgConfig: {
      activeType: 'color',
      backgroundColor: '#f7f7f7',
      color: '#111111',
    },
    btnConfig: defaultButtonConfig,
    fontConfig: BrowserSafeFonts[0],
    headerConfig: defaultHeaderConfig,
  };
}

function useThemeCreateMutation(onSuccess?: () => void) {
  return useMutation({
    mutationFn: ({
      payload,
    }: {
      payload: ThemePayload;
      message: ReactNode;
    }) => createBiolinkTheme(payload),
    onSuccess: (_, variables) => {
      toast.success(variables.message);
      queryClient.invalidateQueries({queryKey: adminBiolinkThemesKey});
      queryClient.invalidateQueries({queryKey: ['biolink-themes']});
      onSuccess?.();
    },
    onError: () => toast.error(<Trans message="Could not save theme" />),
  });
}

function useThemeUpdateMutation(onSuccess?: () => void) {
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ThemePayload;
      message: ReactNode;
    }) => {
      payload.category = payload.category as CrupdateBiolinkThemeRequestCategory;
      return updateBiolinkTheme(id, payload);
    },
    onSuccess: (_, variables) => {
      toast.success(variables.message);
      queryClient.invalidateQueries({queryKey: adminBiolinkThemesKey});
      queryClient.invalidateQueries({queryKey: ['biolink-themes']});
      onSuccess?.();
    },
    onError: () => toast.error(<Trans message="Could not save theme" />),
  });
}

function useThemeDeleteMutation(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (id: number) => deleteBiolinkTheme(id),
    onSuccess: () => {
      toast.success(<Trans message="Theme deleted" />);
      queryClient.invalidateQueries({queryKey: adminBiolinkThemesKey});
      queryClient.invalidateQueries({queryKey: ['biolink-themes']});
      onSuccess?.();
    },
    onError: () => toast.error(<Trans message="Could not delete theme" />),
  });
}
