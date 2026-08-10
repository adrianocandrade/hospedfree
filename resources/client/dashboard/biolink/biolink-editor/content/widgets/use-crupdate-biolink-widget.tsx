import {useBiolinkEditorStore} from '@app/dashboard/biolink/biolink-editor/biolink-editor-store';
import {createBiolinkWidget, updateBiolinkWidget} from '@app/gen/biolinks';
import type {CreateBiolinkWidgetBody} from '@app/gen/schemas/create-biolink-widget-body';
import type {UpdateBiolinkWidgetBody} from '@app/gen/schemas/update-biolink-widget-body';
import type {BiolinkWidgetType} from '@app/gen/schemas/biolink-widget-type';
import {
  widgetAdvancedPayload,
  withoutWidgetAdvancedFields,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-form-action-buttons';
import {onFormQueryError} from '@common/http/errors/on-form-query-error';
import {toast} from '@shadcn/toast/toast';
import {useMutation} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {UseFormReturn} from 'react-hook-form';

type WidgetItemInput = {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  price?: number | string | null;
  currency?: string;
  active?: boolean;
  type?: string;
  payload?: Record<string, unknown>;
};

type CrupdateWidgetBody = Omit<
  CreateBiolinkWidgetBody,
  | 'config'
  | 'items'
  | 'type'
  | 'password'
  | 'activates_at'
  | 'expires_at'
  | 'utm'
  | 'utm_custom'
  | 'pixels'
  | 'rules'
> & {
  type: BiolinkWidgetType;
  config?: Record<string, unknown>;
  items?: WidgetItemInput[];
  password?: string | null;
  activates_at?: string | null;
  expires_at?: string | null;
  utm?: Record<string, string | null | undefined>;
  utm_custom?: {key: string; value: string}[];
  pixels?: ({id: number; name?: string} | number)[];
  rules?: {type: string; key?: string | null; value?: string | null}[];
};

export function useCrupdateBiolinkWidget(
  biolinkId: number | string,
  form: UseFormReturn<any>,
  widgetId?: number,
) {
  const overrideContent = useBiolinkEditorStore(s => s.overrideContent);
  const numericBiolinkId = Number(biolinkId);

  return useMutation({
    mutationFn: (body: CrupdateWidgetBody) => {
      const payload = {
        ...body,
        ...widgetAdvancedPayload(form.getValues()),
        ...(body.config
          ? {config: withoutWidgetAdvancedFields(body.config)}
          : {}),
      };

      return widgetId
        ? updateBiolinkWidget(
            numericBiolinkId,
            widgetId,
            payload as UpdateBiolinkWidgetBody,
          )
        : createBiolinkWidget(
            numericBiolinkId,
            payload as CreateBiolinkWidgetBody,
          );
    },
    onSuccess: response => {
      toast.success(
        widgetId ? (
          <Trans message="Widget updated" />
        ) : (
          <Trans message="Widget added" />
        ),
      );
      overrideContent(response.data.content);
    },
    onError: err => onFormQueryError(err, form),
  });
}
