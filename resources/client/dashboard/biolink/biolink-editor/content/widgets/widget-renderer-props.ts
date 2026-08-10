import {BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import {BiolinkAppearanceConfig} from '@app/gen/schemas/biolink-appearance-config';
import {Biolink} from '@app/gen/schemas/biolink';

export interface WidgetRendererProps<T = BiolinkWidget> {
  widget: T;
  variant: 'editor' | 'biolinkPage' | 'desktopHeader';
  appearance?: BiolinkAppearanceConfig | null;
  biolink?: Biolink;
  isPreview?: boolean;
}
