import {useCrupdateBiolinkWidget} from '@app/dashboard/biolink/biolink-editor/content/widgets/use-crupdate-biolink-widget';
import {BiolinkAiSuggestionButton} from '@app/dashboard/biolink/biolink-editor/ai/biolink-ai-suggestion-button';
import {WidgetFormActionButtons} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-form-action-buttons';
import {BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import {onFormQueryError} from '@common/http/errors/on-form-query-error';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useControlledState} from '@react-stately/utils';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {Select} from '@shadcn/forms/select/select';
import {FontStyleButtons} from '@common/text-editor/menubar/font-style-buttons';
import {TiptapEditorContent} from '@common/text-editor/tiptap-editor-content';
import {TipTapEditorProvider} from '@common/text-editor/tiptap-editor-provider';
import {Placeholder} from '@tiptap/extensions';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import {Trans} from '@ui/i18n/trans';
import {Switch} from '@shadcn/forms/switch/switch';
import {TypeIcon} from 'lucide-react';
import {ReactElement, useState} from 'react';
import {useForm} from 'react-hook-form';

export interface TextWidget extends BiolinkWidget {
  type: 'text';
  config: {
    title: string;
    description?: string;
    body?: string;
    showBackground?: boolean;
    variant?: 'text' | 'heading' | 'notice' | 'divider';
    noticeTone?: 'neutral' | 'info' | 'success' | 'warning';
  };
}

type Props = {
  widget?: TextWidget;
  children?: ReactElement<typeof Dialog.Trigger>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialConfig?: Partial<TextWidget['config']>;
};

export function TextWidgetDialog({
  children,
  open: propsOpen,
  onOpenChange: propsOnOpenChange,
  widget,
  initialConfig,
}: Props) {
  const [open, setOpen] = useControlledState(
    propsOpen,
    false,
    propsOnOpenChange,
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {children}
      <Dialog.Portal>
        <Dialog.Backdrop />
        <TextWidgetDialogContent
          widget={widget}
          initialConfig={initialConfig}
          onClose={() => setOpen(false)}
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TextWidgetDialogContent({
  widget,
  initialConfig,
  onClose,
}: {
  widget?: TextWidget;
  initialConfig?: Partial<TextWidget['config']>;
  onClose: () => void;
}) {
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const form = useForm<TextWidget['config']>({
    defaultValues: {
      title: widget?.config?.title ?? initialConfig?.title ?? '',
      description:
        widget?.config?.description ?? initialConfig?.description ?? '',
      body:
        widget?.config?.body ??
        widget?.config?.description ??
        initialConfig?.body ??
        '',
      showBackground:
        widget?.config?.showBackground ??
        initialConfig?.showBackground ??
        false,
      variant: widget?.config?.variant ?? initialConfig?.variant ?? 'text',
      noticeTone:
        widget?.config?.noticeTone ?? initialConfig?.noticeTone ?? 'neutral',
    },
  });

  const crupdateWidget = useCrupdateBiolinkWidget(biolinkId, form, widget?.id);
  const variant = form.watch('variant') ?? 'text';
  const [editorRevision, setEditorRevision] = useState(0);
  const handleSubmit = (values: TextWidget['config']) => {
    crupdateWidget.mutate(
      {
        config: values,
        type: 'text',
      },
      {
        onSuccess: () => onClose(),
        onError: err => onFormQueryError(err, form),
      },
    );
  };

  return (
    <HookForm.Root form={form} onSubmit={handleSubmit}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>
            <TypeIcon />
            <Trans message="Text" />
          </Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Field.Group>
            <HookForm.Field name="variant">
              <Field.Label>
                <Trans message="Presentation" />
              </Field.Label>
              <Select.Root
                items={[
                  {value: 'text', label: <Trans message="Text" />},
                  {value: 'heading', label: <Trans message="Heading" />},
                  {value: 'notice', label: <Trans message="Notice" />},
                  {value: 'divider', label: <Trans message="Divider" />},
                ]}
              >
                <Select.Trigger className="w-full">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="text">
                    <Trans message="Text" />
                  </Select.Item>
                  <Select.Item value="heading">
                    <Trans message="Heading" />
                  </Select.Item>
                  <Select.Item value="notice">
                    <Trans message="Notice" />
                  </Select.Item>
                  <Select.Item value="divider">
                    <Trans message="Divider" />
                  </Select.Item>
                </Select.Content>
              </Select.Root>
              <Field.Error />
            </HookForm.Field>
            <HookForm.Field name="title">
              <div className="flex min-h-8 items-center justify-between gap-3">
                <Field.Label>
                  <Trans message="Title" />
                </Field.Label>
                <BiolinkAiSuggestionButton
                  biolinkId={biolinkId}
                  purpose="title"
                  value={form.watch('title')}
                  onApply={suggestion =>
                    form.setValue('title', suggestion, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              </div>
              <Input required={variant !== 'divider'} autoFocus />
              <Field.Error />
            </HookForm.Field>
            {variant !== 'divider' ? (
              <HookForm.Field name="showBackground">
                <Switch>
                  <Trans message="Show card background" />
                </Switch>
                <Field.Description>
                  <Trans message="Turn off to blend text with the main background." />
                </Field.Description>
              </HookForm.Field>
            ) : null}
            {variant === 'notice' ? (
              <HookForm.Field name="noticeTone">
                <Field.Label>
                  <Trans message="Notice tone" />
                </Field.Label>
                <Select.Root
                  items={[
                    {value: 'neutral', label: <Trans message="Neutral" />},
                    {value: 'info', label: <Trans message="Information" />},
                    {value: 'success', label: <Trans message="Success" />},
                    {value: 'warning', label: <Trans message="Warning" />},
                  ]}
                >
                  <Select.Trigger className="w-full">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="neutral">
                      <Trans message="Neutral" />
                    </Select.Item>
                    <Select.Item value="info">
                      <Trans message="Information" />
                    </Select.Item>
                    <Select.Item value="success">
                      <Trans message="Success" />
                    </Select.Item>
                    <Select.Item value="warning">
                      <Trans message="Warning" />
                    </Select.Item>
                  </Select.Content>
                </Select.Root>
                <Field.Error />
              </HookForm.Field>
            ) : null}
            {variant !== 'divider' ? (
              <HookForm.Field name="body">
                <Field.Label>
                  <Trans message="Text" />
                </Field.Label>
                <CompactTextEditor
                  key={editorRevision}
                  value={form.getValues('body') ?? ''}
                  onChange={value => {
                    form.setValue('body', value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                />
                <div className="mt-2 flex justify-end">
                  <BiolinkAiSuggestionButton
                    biolinkId={biolinkId}
                    purpose={form.getValues('body') ? 'rewrite' : 'bio'}
                    value={textPreview(form.watch('body'))}
                    onApply={suggestion => {
                      form.setValue(
                        'body',
                        `<p>${escapeHtml(suggestion)}</p>`,
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        },
                      );
                      setEditorRevision(value => value + 1);
                    }}
                  />
                </div>
                <Field.Error />
              </HookForm.Field>
            ) : null}
          </Field.Group>
        </Dialog.Body>
        <Dialog.Footer variant="muted" className="py-4 sm:justify-between">
          <WidgetFormActionButtons form={form} widget={widget} />
          <Dialog.CloseButton>
            <Trans message="Cancel" />
          </Dialog.CloseButton>
          <Button
            type="submit"
            disabled={crupdateWidget.isPending || !form.formState.isDirty}
          >
            {widget ? <Trans message="Update" /> : <Trans message="Add" />}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </HookForm.Root>
  );
}

function textPreview(value?: string): string {
  return (
    value
      ?.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() ?? ''
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const textWidgetEditorExtensions = [
  StarterKit.configure({
    blockquote: false,
    bulletList: false,
    code: false,
    codeBlock: false,
    heading: false,
    horizontalRule: false,
    orderedList: false,
    strike: false,
  }),
  Underline,
  Placeholder.configure({
    placeholder: 'Write a short text...',
  }),
];

function CompactTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-input border bg-background">
      <TipTapEditorProvider
        extensions={textWidgetEditorExtensions}
        initialContent={value}
        contentClassName="min-h-32 px-3 py-2 text-sm leading-6 outline-none"
        onChange={onChange}
      >
        <div className="flex items-center gap-1 border-b bg-accent/40 px-2 py-1">
          <FontStyleButtons />
        </div>
        <TiptapEditorContent />
      </TipTapEditorProvider>
    </div>
  );
}
