import {
  BiolinkEditorStoreProvider,
  useBiolinkEditorStore,
} from '@app/dashboard/biolink/biolink-editor/biolink-editor-store';
import {BiolinkSettingsDialog} from '@app/dashboard/biolink/biolink-editor/biolink-settings-dialog';
import {LinkContentItem} from '@app/dashboard/biolink/biolink-editor/content/link-content-item/link-content-item';
import {CreateBiolinkLinkDialog} from '@app/dashboard/biolink/biolink-editor/content/links/create-biolink-link-dialog';
import {
  FixedSocialsDialog,
  type FixedSocialsDialogMode,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/socials-widget/fixed-socials-dialog';
import {SocialConfig} from '@app/dashboard/biolink/biolink-editor/content/widgets/socials-widget/socials-config';
import {SocialsList} from '@app/dashboard/biolink/biolink-editor/content/widgets/socials-widget/socials-list';
import {WidgetContentItem} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-content-item';
import {WidgetList} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-list';
import {WidgetRegistry} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-registry';
import {
  SelectWidgetDialog,
  type AddContentSelection,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-selector/select-widget-dialog';
import {CreateBiolinkDialog} from '@app/dashboard/biolink/biolink-editor/create-biolink-dialog';
import {DeleteBiolinkDialog} from '@app/dashboard/biolink/biolink-editor/delete-biolink-dialog';
import {LivePreview} from '@app/dashboard/biolink/biolink-editor/live-preview';
import {
  listBiolinkWidgetSubmissions,
  updateBiolinkWidget,
} from '@app/gen/biolinks';
import {
  listCurrentUserBiolinksOptions,
  retrieveBiolinkOptions,
  updateBiolinkAppearanceOptions,
} from '@app/dashboard/biolink/biolinks-queries';
import {useSelectedBiolinkId} from '@app/dashboard/biolink/use-selected-biolink-id';
import {ShareLinkButton} from '@app/dashboard/links/sharing/share-link-button';
import {useDatatableRouteType} from '@app/dashboard/use-datatable-route-type';
import {BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import {AdHost} from '@common/admin/ads/ad-host';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {DashboardLayout} from '@common/ui/dashboard/dashboard-layout';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useActiveUpload} from '@common/uploads/uploader/use-active-upload';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {Breadcrumb} from '@shadcn/breadcrumb/breadcrumb';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Dropdown} from '@shadcn/dropdown/dropdown';
import {Empty} from '@shadcn/empty/empty';
import {Tabs} from '@shadcn/tabs/tabs';
import {toast} from '@shadcn/toast/toast';
import {useMutation, useQuery, useSuspenseQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {
  ChevronDownIcon,
  EllipsisVerticalIcon,
  ExternalLinkIcon,
  LayoutPanelTop,
  ListChecksIcon,
  MonitorSmartphoneIcon,
  PaletteIcon,
  PlusIcon,
  Share2Icon,
  SettingsIcon,
  TrashIcon,
} from 'lucide-react';
import {type ReactElement, useState} from 'react';
import {Outlet, useLocation, useNavigate} from 'react-router';

export function Component() {
  const {routeType} = useDatatableRouteType();
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const baseUrl = `/${routeType}/biolinks/${biolinkId}`;
  const query = useSuspenseQuery(retrieveBiolinkOptions(Number(biolinkId)));
  const biolink = query.data.data;

  const {pathname} = useLocation();
  const selectedTab = pathname.endsWith('insights')
    ? 'insights'
    : pathname.endsWith('bookings')
      ? 'bookings'
      : pathname.endsWith('products')
        ? 'products'
        : pathname.endsWith('appearance')
          ? 'appearance'
          : pathname.endsWith('data')
            ? 'data'
            : 'content';
  const submissionsSummaryQuery = useQuery({
    queryKey: ['biolink-widget-submissions', biolink.id, 'summary'],
    queryFn: () =>
      listBiolinkWidgetSubmissions(biolink.id, {
        params: {status: 'new', per_page: 1},
      }),
  });
  const newDataCount = Number(
    submissionsSummaryQuery.data?.summary?.new_count ?? 0,
  );

  // re-create store provider when biolink changes
  return (
    <FileUploadProvider>
      <BiolinkEditorStoreProvider data={biolink} key={biolink.id}>
        <DashboardLayout.MainSection>
          <BiolinkEditorHeader />
          <Tabs.Root value={selectedTab}>
            <div className="border-b px-6">
              <Tabs.List variant="line">
                <Tabs.LinkTab
                  className="min-w-35"
                  value="content"
                  to={baseUrl}
                  replace
                >
                  <Trans message="Content" />
                </Tabs.LinkTab>
                <Tabs.LinkTab
                  className="min-w-35"
                  value="products"
                  to={`${baseUrl}/products`}
                  replace
                >
                  <Trans message="Products" />
                </Tabs.LinkTab>
                <Tabs.LinkTab
                  className="min-w-35"
                  value="appearance"
                  to={`${baseUrl}/appearance`}
                  replace
                >
                  <Trans message="Appearance" />
                </Tabs.LinkTab>
                <Tabs.LinkTab
                  className="min-w-35"
                  value="data"
                  to={`${baseUrl}/data`}
                  replace
                >
                  <span className="flex items-center gap-2">
                    <Trans message="Data" />
                    {newDataCount ? (
                      <span className="rounded-full bg-positive/10 px-1.5 py-0.5 text-xs leading-none text-positive">
                        {newDataCount}
                      </span>
                    ) : null}
                  </span>
                </Tabs.LinkTab>
                <Tabs.LinkTab
                  className="min-w-35"
                  value="bookings"
                  to={`${baseUrl}/bookings`}
                  replace
                >
                  <Trans message="Bookings" />
                </Tabs.LinkTab>
                <Tabs.LinkTab
                  className="min-w-35"
                  value="insights"
                  to={`${baseUrl}/insights`}
                  replace
                >
                  <Trans message="Insights" />
                </Tabs.LinkTab>
              </Tabs.List>
            </div>
          </Tabs.Root>
          <section className="flex flex-auto overflow-hidden">
            <div className="compact-scrollbar min-w-0 flex-auto overflow-y-auto p-(--section-spacing)">
              <AdHost slot="dashboard" className="mb-6" />
              <Outlet />
            </div>
            <LivePreview />
          </section>
        </DashboardLayout.MainSection>
      </BiolinkEditorStoreProvider>
    </FileUploadProvider>
  );
}

function BiolinkEditorHeader() {
  const {routeType} = useDatatableRouteType();
  const biolink = useBiolinkEditorStore(s => s.biolink);
  const getState = useBiolinkEditorStore(s => s.getState);
  const saveAppearance = useMutation(
    updateBiolinkAppearanceOptions(biolink.id),
  );
  const appearanceIsDirty = useBiolinkEditorStore(s => s.appearanceIsDirty);
  const setAppearanceIsDirty = useBiolinkEditorStore(
    s => s.setAppearanceIsDirty,
  );
  const consumeFileCleanup = useBiolinkEditorStore(s => s.consumeFileCleanup);
  const consumeFileRollback = useBiolinkEditorStore(s => s.consumeFileRollback);
  const {deleteEntry} = useActiveUpload();
  const location = useLocation();
  const canSaveAppearance = location.pathname.endsWith('appearance');

  const handleSaveAppearance = () => {
    saveAppearance.mutate(
      {config: getState().appearance},
      {
        onSuccess: () => {
          setAppearanceIsDirty(false);
          getState().pendingFileRollback.forEach(path =>
            consumeFileRollback(path),
          );
          getState().pendingFileCleanup.forEach(path => {
            deleteEntry({
              entryPath: path,
              onSuccess: () => consumeFileCleanup(path),
            });
          });
          toast.success(<Trans message="Changes saved" />);
        },
        onError: err => {
          getState().pendingFileRollback.forEach(path => {
            deleteEntry({
              entryPath: path,
              onSuccess: () => consumeFileRollback(path),
            });
          });
          showHttpErrorToast(
            err,
            <Trans message="Could not save appearance" />,
          );
        },
      },
    );
  };

  return (
    <DashboardLayout.SectionHeader className="border-none">
      <DashboardLayout.SidebarToggle />
      {routeType === 'admin' ? <AdminBreadcrumb /> : <BiolinkSelector />}
      <MoreActionsButton />
      <ShareLinkButton
        type="text"
        url={biolink.short_url}
        variant="outline"
        className="max-md:hidden"
      />
      {canSaveAppearance && (
        <Button
          onClick={() => handleSaveAppearance()}
          disabled={!appearanceIsDirty || saveAppearance.isPending}
        >
          <Trans message="Save changes" />
        </Button>
      )}
    </DashboardLayout.SectionHeader>
  );
}

function BiolinkSelector() {
  const {routeType} = useDatatableRouteType();
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const navigate = useNavigate();
  const query = useSuspenseQuery(listCurrentUserBiolinksOptions());
  const biolinks = query.data.data ?? [];
  const [, setSelectedBiolinkId] = useSelectedBiolinkId();
  const selectedBiolink = biolinks.find(b => `${b.id}` === biolinkId)!;
  const [createIsOpen, setCreateIsOpen] = useState(false);

  if (!selectedBiolink) {
    return null;
  }

  return (
    <>
      <CreateBiolinkDialog open={createIsOpen} onOpenChange={setCreateIsOpen} />
      <Dropdown.Root>
        <Dropdown.Trigger
          render={
            <Button variant="outline" className="mr-auto justify-between" />
          }
        >
          {selectedBiolink.name}
          <ChevronDownIcon />
        </Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.RadioGroup
            value={biolinkId}
            onValueChange={value => {
              setSelectedBiolinkId(Number(value));
              navigate(`/${routeType}/biolinks/${value}`);
            }}
          >
            {biolinks.map(b => (
              <Dropdown.RadioItem value={`${b.id}`} key={b.id}>
                {b.name}
              </Dropdown.RadioItem>
            ))}
          </Dropdown.RadioGroup>
          <Dropdown.Item onClick={() => setCreateIsOpen(true)}>
            <PlusIcon />
            <Trans message="New link in bio" />
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Root>
    </>
  );
}

function AdminBreadcrumb() {
  const biolink = useBiolinkEditorStore(s => s.biolink);
  return (
    <Breadcrumb.Root className="text-xl">
      <Breadcrumb.Item>
        <Breadcrumb.Link to="/admin/biolinks">
          <Trans message="Biolinks" />
        </Breadcrumb.Link>
      </Breadcrumb.Item>
      <Breadcrumb.Separator />
      <Breadcrumb.Item>
        <Breadcrumb.Page>{biolink.name}</Breadcrumb.Page>
      </Breadcrumb.Item>
    </Breadcrumb.Root>
  );
}

function MoreActionsButton() {
  const {routeType} = useDatatableRouteType();
  const biolink = useBiolinkEditorStore(s => s.biolink);
  const listQuery = useSuspenseQuery(listCurrentUserBiolinksOptions());

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <BiolinkSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
      <DeleteBiolinkDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        biolinkId={biolink.id}
      />

      <Dropdown.Root>
        <Dropdown.Trigger
          render={
            <Button size="icon-sm" variant="outline" className="ml-auto" />
          }
        >
          <EllipsisVerticalIcon />
        </Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Item onClick={() => setSettingsOpen(true)}>
            <SettingsIcon />
            <Trans message="Settings" />
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => window.open(biolink.short_url, '_blank')}
          >
            <ExternalLinkIcon />
            <Trans message="Open in new tab" />
          </Dropdown.Item>
          <Dropdown.Separator />
          <Dropdown.Item
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
            disabled={
              routeType === 'dashboard' && listQuery.data.data.length === 1
            }
          >
            <TrashIcon />
            <Trans message="Delete" />
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Root>
    </>
  );
}

export function BiolinkContentTab() {
  const content = useBiolinkEditorStore(s => s.content);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <ModelChecklist />
      <ProfileSummaryCard />
      <FixedSocialsCard />
      <AddBlockButton />
      {content.length ? (
        <>
          <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <Trans message="Blocks (:count)" values={{count: content.length}} />
          </div>
          <BiolinkItemList />
        </>
      ) : (
        <Empty.Root>
          <Empty.Header>
            <Empty.Media variant="icon">
              <LayoutPanelTop />
            </Empty.Media>
            <Empty.Title>
              <Trans message="No content yet." />
            </Empty.Title>
            <Empty.Description>
              <Trans message="Get started by adding a block." />
            </Empty.Description>
          </Empty.Header>
        </Empty.Root>
      )}
    </div>
  );
}

function ModelChecklist() {
  const biolink = useBiolinkEditorStore(s => s.biolink);
  const content = useBiolinkEditorStore(s => s.content);
  const overrideContent = useBiolinkEditorStore(s => s.overrideContent);
  const modelWidgets = content.filter(
    (item): item is BiolinkWidget =>
      item.model_type === 'biolinkWidget' &&
      typeof (item.config as {blueprintKey?: unknown}).blueprintKey ===
        'string',
  );
  const inactiveWidgets = modelWidgets.filter(widget => !widget.active);
  const activateModel = useMutation({
    mutationFn: async () => {
      let nextContent = content;
      for (const widget of inactiveWidgets) {
        const response = await updateBiolinkWidget(biolink.id, widget.id, {
          active: true,
        });
        nextContent = response.data.content ?? nextContent;
      }

      return nextContent;
    },
    onSuccess: nextContent => {
      overrideContent(nextContent);
      toast.success(<Trans message="Model content activated" />);
    },
    onError: err => showHttpErrorToast(err),
  });

  if (!modelWidgets.length || !inactiveWidgets.length) {
    return null;
  }

  return (
    <section className="rounded-card border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ListChecksIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-auto">
          <h2 className="font-semibold">
            <Trans message="Complete your model" />
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <Trans
              message="Review the :count inactive model blocks, replace the example content and add real links before publishing."
              values={{count: inactiveWidgets.length}}
            />
          </p>
          <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
            {inactiveWidgets.map(widget => (
              <li key={widget.id} className="truncate">
                •{' '}
                {typeof widget.config.title === 'string'
                  ? widget.config.title
                  : WidgetList[widget.type].label}
              </li>
            ))}
          </ul>
          <Button
            type="button"
            className="mt-4"
            disabled={activateModel.isPending}
            onClick={() => activateModel.mutate()}
          >
            <Trans message="Save and activate" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function FixedSocialsCard() {
  const appearance = useBiolinkEditorStore(s => s.appearance);
  const socialConfig = (appearance as {socialConfig?: SocialConfig})
    .socialConfig;
  const [dialogMode, setDialogMode] = useState<FixedSocialsDialogMode | null>(
    null,
  );
  const links = Object.entries(socialConfig?.links ?? {}).filter(
    ([type, value]) =>
      !!value && !!SocialsList[type as keyof typeof SocialsList],
  );
  const enabled = socialConfig?.enabled === true;
  const hasLinks = links.length > 0;

  return (
    <div className="rounded-card border bg-card p-4 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-auto items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Share2Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-auto">
            <div className="font-semibold">
              <Trans message="Fixed social links" />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {hasLinks ? (
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {!enabled ? <Trans message="Disabled" /> : null}
                  {!enabled ? <span aria-hidden="true">&middot;</span> : null}
                  <span>
                    <Trans
                      message=":count configured networks"
                      values={{count: links.length}}
                    />
                  </span>
                  <span aria-hidden="true">&middot;</span>
                  <span>
                    <Trans message="Style" />:{' '}
                    <FixedSocialStyleLabel style={socialConfig?.style} />
                  </span>
                  <span aria-hidden="true">&middot;</span>
                  <span>
                    <Trans message="Mobile" />:{' '}
                    <FixedSocialPlacementLabel
                      device="mobile"
                      placement={socialConfig?.mobilePlacement}
                    />
                  </span>
                  <span aria-hidden="true">&middot;</span>
                  <span>
                    <Trans message="Desktop" />:{' '}
                    <FixedSocialPlacementLabel
                      device="desktop"
                      placement={socialConfig?.desktopPlacement}
                    />
                  </span>
                </div>
              ) : (
                <Trans message="Add social links that stay outside your content blocks." />
              )}
            </div>
            {hasLinks ? (
              <div className="mt-3 flex flex-wrap gap-2 text-muted-foreground">
                {links.map(([type]) => (
                  <span
                    key={type}
                    className="flex size-8 items-center justify-center rounded-full border bg-background"
                  >
                    {SocialsList[type as keyof typeof SocialsList]?.icon}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="min-h-11 w-full shrink-0 sm:w-auto"
          onClick={() => setDialogMode('content')}
        >
          <Share2Icon />
          {enabled || hasLinks ? (
            <Trans message="Edit fixed links" />
          ) : (
            <Trans message="Add fixed links" />
          )}
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
        <Button
          variant="ghost"
          size="sm"
          className="min-h-11"
          onClick={() => setDialogMode('design')}
        >
          <PaletteIcon />
          <Trans message="Appearance" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-11"
          onClick={() => setDialogMode('placement')}
        >
          <MonitorSmartphoneIcon />
          <Trans message="Position" />
        </Button>
      </div>
      <FixedSocialsDialog
        open={dialogMode !== null}
        mode={dialogMode ?? 'content'}
        onOpenChange={open => {
          if (!open) setDialogMode(null);
        }}
      />
    </div>
  );
}

function FixedSocialStyleLabel({style}: {style?: SocialConfig['style']}) {
  if (style === 'buttons') return <Trans message="Buttons" />;
  if (style === 'pills') return <Trans message="Pills" />;
  return <Trans message="Icons" />;
}

function FixedSocialPlacementLabel({
  device,
  placement,
}: {
  device: 'mobile' | 'desktop';
  placement?:
    | SocialConfig['mobilePlacement']
    | SocialConfig['desktopPlacement'];
}) {
  if (placement === 'hidden') return <Trans message="Disabled" />;
  if (placement === 'footer') return <Trans message="Footer" />;
  if (device === 'desktop') return <Trans message="Below badges" />;
  return <Trans message="Below header" />;
}

function ProfileSummaryCard() {
  const biolink = useBiolinkEditorStore(s => s.biolink);
  const appearance = useBiolinkEditorStore(s => s.appearance);
  const headerConfig = appearance?.headerConfig;
  const avatarImage = headerConfig?.image;
  const title = headerConfig?.title || biolink.name;
  const bio = headerConfig?.bio;

  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <BiolinkSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
      <div className="flex items-center gap-4 rounded-card border bg-card p-4 shadow-xs">
        {avatarImage ? (
          <img
            src={avatarImage}
            alt=""
            className="size-12 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
            {title.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-auto">
          <div className="truncate font-semibold">{title}</div>
          {bio ? (
            <div className="truncate text-sm text-muted-foreground">{bio}</div>
          ) : null}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSettingsOpen(true)}
        >
          <Trans message="Edit Profile" />
        </Button>
      </div>
    </>
  );
}

function AddBlockButton() {
  return (
    <AddContentButton>
      <Dialog.Trigger
        render={
          <Button
            color="primary"
            className="h-12 w-full text-base font-semibold"
          />
        }
      >
        <PlusIcon />
        <Trans message="Add Block" />
      </Dialog.Trigger>
    </AddContentButton>
  );
}

export function BiolinkItemList() {
  const content = useBiolinkEditorStore(s => s.content);
  return (
    <>
      {content.map(contentItem => {
        const ContentItem =
          contentItem.model_type === 'biolinkWidget'
            ? WidgetContentItem
            : LinkContentItem;
        return (
          <ContentItem
            key={`${contentItem.model_type}-${contentItem.id}`}
            item={contentItem as never}
          />
        );
      })}
    </>
  );
}

function AddContentButton({
  children,
}: {
  children: ReactElement<typeof Dialog.Trigger>;
}) {
  const content = useBiolinkEditorStore(s => s.content);
  const position = content?.filter(x => 'pinned' in x && x.pinned).length;
  const [activeWidgetSelection, setActiveWidgetSelection] = useState<Extract<
    AddContentSelection,
    {kind: 'widget'}
  > | null>(null);
  const [createLinkOpen, setCreateLinkOpen] = useState(false);
  const [initialLongUrl, setInitialLongUrl] = useState<string | undefined>();

  const DialogEl = activeWidgetSelection
    ? WidgetRegistry[activeWidgetSelection.widgetType].dialog
    : null;

  const handleSelect = (selection: AddContentSelection) => {
    if (selection.kind === 'link') {
      setInitialLongUrl(selection.initialUrl);
      setCreateLinkOpen(true);
    } else {
      setActiveWidgetSelection(selection);
    }
  };

  return (
    <>
      <CreateBiolinkLinkDialog
        open={createLinkOpen}
        onOpenChange={(isOpen: boolean) => {
          setCreateLinkOpen(isOpen);
          if (!isOpen) {
            setInitialLongUrl(undefined);
          }
        }}
        position={position}
        initialUrl={initialLongUrl}
      />

      {DialogEl ? (
        <DialogEl
          open={activeWidgetSelection != null}
          onOpenChange={(isOpen: boolean) => {
            if (!isOpen) {
              setActiveWidgetSelection(null);
            }
          }}
          initialConfig={activeWidgetSelection?.initialConfig}
          initialItems={activeWidgetSelection?.initialItems}
          catalogEntryId={activeWidgetSelection?.catalogEntryId}
        />
      ) : null}

      <SelectWidgetDialog onSelect={handleSelect}>
        {children}
      </SelectWidgetDialog>
    </>
  );
}
