import {UploadType} from '@app/site-config';
import {BackgroundSelectorConfig} from '@common/background-selector/background-selector-config';
import type {CropDimensions} from '@common/uploads/components/image-selector-dialog';

export interface BgSelectorTabProps<T extends BackgroundSelectorConfig> {
  value?: T;
  onChange: (value: T | null) => void;
  className?: string;
  uploadType?: keyof typeof UploadType;
  cropDimensions?: CropDimensions;
}
