import {useBiolinkEditorStore} from '@app/dashboard/biolink/biolink-editor/biolink-editor-store';
import {BiolinkItemLayout} from '@app/dashboard/biolink/biolink-editor/content/biolink-item-layout';
import {useSortBiolinkContent} from '@app/dashboard/biolink/biolink-editor/content/use-sort-biolink-content';
import {WidgetList} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-list';
import {
  getWidgetEditorModeIcon,
  getWidgetEditorModes,
  type WidgetEditorMode,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-editor-mode';
import {WidgetRegistry} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-registry';
import {
  deleteBiolinkWidgetOptions,
  updateBiolinkWidgetOptions,
} from '@app/dashboard/biolink/biolinks-queries';
import {useDatatableRouteType} from '@app/dashboard/use-datatable-route-type';
import {BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {AlertDialog} from '@shadcn/alert-dialog/alert-dialog';
import {Button, LinkButton} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Switch} from '@shadcn/forms/switch/switch';
import {Tooltip} from '@shadcn/tooltip/tooltip';
import {useMutation} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChartColumnBigIcon,
  PencilIcon,
  XIcon,
} from 'lucide-react';
import {ReactNode, useState} from 'react';

interface WidgetContentItemProps {
  item: BiolinkWidget;
}
export function WidgetContentItem({item: widget}: WidgetContentItemProps) {
  const config = WidgetList[widget.type];
  const {renderer: WidgetRenderer, dialog: WidgetDialog} =
    WidgetRegistry[widget.type];

  return (
    <BiolinkItemLayout.Root item={widget}>
      <div className="flex items-center">
        <BiolinkItemLayout.Title>{config.name}</BiolinkItemLayout.Title>
        <WidgetDialog widget={widget} mode="content">
          <Dialog.Trigger render={<Button variant="ghost" />}>
            <PencilIcon />
            <Trans message="Edit" />
          </Dialog.Trigger>
        </WidgetDialog>
        <DeleteDialog widget={widget} />
      </div>
      <div className="mb-5 flex items-center gap-1.5">
        <WidgetRenderer widget={widget} variant="editor" />
      </div>
      <ActionRow widget={widget} />
    </BiolinkItemLayout.Root>
  );
}

interface ActionRowProps {
  widget: BiolinkWidget;
}
function ActionRow({widget}: ActionRowProps) {
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const sortContent = useSortBiolinkContent();
  const content = useBiolinkEditorStore(s => s.content);
  const overrideContent = useBiolinkEditorStore(s => s.overrideContent);

  const updateWidget = useMutation({
    ...updateBiolinkWidgetOptions(Number(biolinkId), widget.id),
    onSuccess: response => {
      overrideContent(response.data.content);
    },
    onError: err => showHttpErrorToast(err),
  });

  const handlePinToTop = () => {
    if (widget.pinned) {
      updateWidget.mutate({pinned: null});
    } else {
      const pinnedCount = content.filter(
        x => 'pinned' in x && x.pinned === 'top',
      ).length;
      const oldIndex = content.findIndex(
        x => x.model_type === widget.model_type && x.id === widget.id,
      );
      sortContent.mutate({
        oldIndex,
        // put widget after any other widgets that are already pinned to top
        newIndex: pinnedCount,
        widgetToPin: widget.id,
      });
    }
  };

  return (
    <div className="flex h-10.5 items-center justify-between gap-6 text-muted-foreground">
      <div className="flex min-w-0 items-center gap-1.5">
        <Switch
          checked={widget.active}
          disabled={updateWidget.isPending}
          onCheckedChange={() => {
            updateWidget.mutate({
              active: !widget.active,
            });
          }}
        />
        <WidgetSettingsActions widget={widget} />
        <WidgetAnalyticsButton widget={widget} />
      </div>
      <Button
        variant="outline"
        size="xs"
        color={widget.pinned === 'top' ? 'primary' : undefined}
        disabled={sortContent.isPending}
        onClick={handlePinToTop || updateWidget.isPending}
      >
        {widget.pinned === 'top' ? <ArrowUpIcon /> : <ArrowDownIcon />}
        {widget.pinned === 'top' ? (
          <Trans message="Unpin from top" />
        ) : (
          <Trans message="Pin to top" />
        )}
      </Button>
    </div>
  );
}

function WidgetSettingsActions({widget}: {widget: BiolinkWidget}) {
  const WidgetDialog = WidgetRegistry[widget.type].dialog;

  return getWidgetEditorModes(widget.type).map(mode => {
    const action = widgetEditorAction(mode);

    return (
      <WidgetDialog key={mode} widget={widget} mode={mode}>
        <Tooltip.Root>
          <Tooltip.Trigger
            render={
              <Dialog.Trigger
                render={<Button variant="ghost" size="icon-sm" />}
              />
            }
          >
            <action.icon />
            <span className="sr-only">{action.label}</span>
          </Tooltip.Trigger>
          <Tooltip.Content>{action.label}</Tooltip.Content>
        </Tooltip.Root>
      </WidgetDialog>
    );
  });
}

function widgetEditorAction(mode: Exclude<WidgetEditorMode, 'content'>): {
  icon: ReturnType<typeof getWidgetEditorModeIcon>;
  label: ReactNode;
} {
  if (mode === 'design') {
    return {
      icon: getWidgetEditorModeIcon(mode),
      label: <Trans message="Design and layout" />,
    };
  }

  if (mode === 'presentation') {
    return {
      icon: getWidgetEditorModeIcon(mode),
      label: <Trans message="Presentation" />,
    };
  }

  return {
    icon: getWidgetEditorModeIcon(mode),
    label: <Trans message="Details and advanced settings" />,
  };
}

function WidgetAnalyticsButton({widget}: {widget: BiolinkWidget}) {
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const {routeType} = useDatatableRouteType();
  const clicks = Number(widget.clicks_count ?? 0);
  const button = (
    <LinkButton
      variant="ghost"
      size="xs"
      to={`/${routeType}/biolinks/${biolinkId}/widgets/${widget.id}/insights`}
      target="_blank"
    >
      <ChartColumnBigIcon />
      <Trans message=":count clicks" values={{count: clicks}} />
    </LinkButton>
  );

  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={button} />
      <Tooltip.Content>
        <Trans message=":count lifetime clicks" values={{count: clicks}} />
      </Tooltip.Content>
    </Tooltip.Root>
  );
}

function DeleteDialog({widget}: {widget: BiolinkWidget}) {
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const overrideContent = useBiolinkEditorStore(s => s.overrideContent);

  const [open, setOpen] = useState(false);
  const deleteWidget = useMutation({
    ...deleteBiolinkWidgetOptions(Number(biolinkId), widget.id),
    onSuccess: response => {
      overrideContent(response.data.content);
    },
    onError: err => showHttpErrorToast(err),
  });
  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger
        render={
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={deleteWidget.isPending}
          />
        }
      >
        <XIcon />
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop />
        <AlertDialog.Content size="sm">
          <AlertDialog.Header>
            <AlertDialog.Title>
              <Trans message="Delete widget" />
            </AlertDialog.Title>
            <AlertDialog.Description>
              <Trans message="Are you sure you want to delete this widget?" />
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel>
              <Trans message="Cancel" />
            </AlertDialog.Cancel>
            <AlertDialog.Action
              color="danger"
              disabled={deleteWidget.isPending}
              onClick={() => deleteWidget.mutate()}
            >
              <Trans message="Delete" />
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
