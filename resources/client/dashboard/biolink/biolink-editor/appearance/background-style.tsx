import {appearanceHeaderClassnames} from '@app/dashboard/biolink/biolink-editor/appearance/header-classnames';
import {useBiolinkEditorStore} from '@app/dashboard/biolink/biolink-editor/biolink-editor-store';
import {BackgroundSelector} from '@common/background-selector/background-selector';
import {Button} from '@shadcn/button/button';
import {ColorField} from '@ui/color-picker/color-field';
import {Trans} from '@ui/i18n/trans';

export function BackgroundStyle() {
  const updateAppearance = useBiolinkEditorStore(s => s.updateAppearance);
  const value = useBiolinkEditorStore(s => s.appearance?.bgConfig);
  const setTextColor = (color: string) => {
    updateAppearance(
      {
        bgConfig: {
          ...value,
          color,
        },
      },
      {markThemeModified: true},
    );
  };

  return (
    <div>
      <h2 className={appearanceHeaderClassnames.h2}>
        <Trans message="Wallpaper" />
      </h2>
      <div className="mb-6 rounded-card-sm border bg-card p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <ColorField
            className="sm:max-w-60"
            label={<Trans message="Page text color" />}
            value={value?.color || '#111111'}
            onChange={setTextColor}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTextColor('#111111')}
            >
              <Trans message="Dark text" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTextColor('#ffffff')}
            >
              <Trans message="Light text" />
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          <Trans message="Use light text on dark backgrounds and dark text on light backgrounds." />
        </div>
      </div>
      <BackgroundSelector
        cropDimensions={{width: 1920, height: 1080}}
        uploadType="linkImages"
        value={value}
        onChange={newValue =>
          updateAppearance(
            {bgConfig: newValue ?? undefined},
            {markThemeModified: true},
          )
        }
      />
    </div>
  );
}
