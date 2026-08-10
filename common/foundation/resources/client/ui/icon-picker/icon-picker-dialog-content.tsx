import {Dialog} from '@shadcn/dialog/dialog';
import {Trans} from '@ui/i18n/trans';
import {IconTree} from '@ui/icons/create-svg-icon';
import IconPicker, {type IconPickerLibrary} from './icon-picker';

interface IconPickerDialogProps {
  onIconSelected?: (icon: IconTree[] | null) => void;
  onIconNameSelected?: (name: string | null) => void;
  libraries?: IconPickerLibrary[];
}

export function IconPickerDialogContent({
  onIconSelected,
  onIconNameSelected,
  libraries,
}: IconPickerDialogProps) {
  return (
    <Dialog.Content className="w-full sm:max-w-[850px]">
      <Dialog.Header>
        <Dialog.Title>
          <Trans message="Select icon" />
        </Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <IconPicker
          onIconSelected={onIconSelected}
          onIconNameSelected={onIconNameSelected}
          libraries={libraries}
        />
      </Dialog.Body>
    </Dialog.Content>
  );
}
