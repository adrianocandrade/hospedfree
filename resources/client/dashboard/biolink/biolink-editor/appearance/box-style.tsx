import {appearanceHeaderClassnames} from '@app/dashboard/biolink/biolink-editor/appearance/header-classnames';
import {BiolinkButtonConfig} from '@app/dashboard/biolink/biolink-editor/appearance/biolink-button-style-utils';
import {useBiolinkEditorStore} from '@app/dashboard/biolink/biolink-editor/biolink-editor-store';
import type {BiolinkAppearanceConfigCardConfig} from '@app/gen/schemas/biolink-appearance-config-card-config';
import {BrowserSafeFonts} from '@ui/fonts/font-picker/browser-safe-fonts';
import {ColorField} from '@ui/color-picker/color-field';
import {Trans} from '@ui/i18n/trans';
import {useCallback} from 'react';
import {
  StyleSelector,
  SliderSelector,
  ShadowSelector,
  ColorSelector,
  BlockStyleSelector,
} from './button-style';

export function BoxStyle() {
  const updateAppearance = useBiolinkEditorStore(s => s.updateAppearance);
  const value = useBiolinkEditorStore(s => s.appearance?.boxConfig);

  const setValue = useCallback(
    (newValue: Partial<BiolinkButtonConfig>) => {
      updateAppearance(
        {
          boxConfig: {
            ...value,
            ...newValue,
          },
        },
        {markThemeModified: true},
      );
    },
    [value, updateAppearance],
  );

  return (
    <div>
      <h2 className={appearanceHeaderClassnames.h2}>
        <Trans message="Blocks / Boxes" />
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        <Trans message="Configure the wrapper around your widgets (e.g. Socials, Image, Youtube, etc)." />
      </p>

      <div className="flex flex-col gap-8">
        <StyleSelector value={value} onChange={setValue} />

        {/* Sliders para controles finos */}
        <div className="flex flex-col gap-6">
          <SliderSelector
            label={<Trans message="Corner radius" />}
            value={value?.cornerWidth ?? 8}
            min={0}
            max={50}
            onChange={v => setValue({cornerWidth: v})}
          />
          <SliderSelector
            label={<Trans message="Border width" />}
            value={value?.borderWidth ?? 2}
            min={0}
            max={10}
            onChange={v => setValue({borderWidth: v})}
          />
          <SliderSelector
            label={<Trans message="Background transparency" />}
            value={value?.bgTransparency ?? 0}
            min={0}
            max={100}
            onChange={v => setValue({bgTransparency: v})}
          />
        </div>

        <ShadowSelector value={value} onChange={setValue} />
        <ColorSelector value={value} onChange={setValue} />
        <BlockStyleSelector value={value} onChange={setValue} />
      </div>

      <CardStyle />
    </div>
  );
}

function CardStyle() {
  const updateAppearance = useBiolinkEditorStore(s => s.updateAppearance);
  const value = useBiolinkEditorStore(s => s.appearance?.cardConfig);

  const setValue = useCallback(
    (partial: Partial<BiolinkAppearanceConfigCardConfig>) => {
      updateAppearance(
        {
          cardConfig: {
            ...value,
            ...partial,
          },
        },
        {markThemeModified: true},
      );
    },
    [updateAppearance, value],
  );

  return (
    <section className="mt-10 flex flex-col gap-5 border-t pt-8">
      <div>
        <h3 className={appearanceHeaderClassnames.h3}>
          <Trans message="Global card appearance" />
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          <Trans message="Products, services, events and other collections use these item colors and shadows." />
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ColorField
          label={<Trans message="Card background" />}
          value={value?.backgroundColor || '#000000'}
          onChange={backgroundColor => setValue({backgroundColor})}
        />
        <ColorField
          label={<Trans message="Card text" />}
          value={value?.textColor || '#ffffff'}
          onChange={textColor => setValue({textColor})}
        />
        <ColorField
          label={<Trans message="Card border" />}
          value={value?.borderColor || '#ffffff'}
          onChange={borderColor => setValue({borderColor})}
        />
        <ColorField
          label={<Trans message="Card shadow" />}
          value={value?.shadowColor || value?.borderColor || '#000000'}
          onChange={shadowColor => setValue({shadowColor})}
        />
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">
            <Trans message="Card font" />
          </span>
          <select
            className="h-10 rounded-input border bg-transparent px-3"
            value={value?.fontConfig?.family ?? ''}
            onChange={event =>
              setValue({
                fontConfig: event.target.value
                  ? {family: event.target.value}
                  : undefined,
              })
            }
          >
            <option value="">
              <Trans message="Use page font" />
            </option>
            {BrowserSafeFonts.map(font => (
              <option key={font.family} value={font.family}>
                {font.family}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">
            <Trans message="Card variant" />
          </span>
          <select
            className="h-10 rounded-input border bg-transparent px-3"
            value={value?.cardVariant ?? 'standard'}
            onChange={event =>
              setValue({
                cardVariant: event.target
                  .value as BiolinkAppearanceConfigCardConfig['cardVariant'],
              })
            }
          >
            <option value="standard">
              <Trans message="Standard" />
            </option>
            <option value="media">
              <Trans message="Media" />
            </option>
            <option value="compact">
              <Trans message="Compact" />
            </option>
            <option value="poster">
              <Trans message="Poster" />
            </option>
            <option value="minimal">
              <Trans message="Minimal" />
            </option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">
            <Trans message="Image position" />
          </span>
          <select
            className="h-10 rounded-input border bg-transparent px-3"
            value={value?.imagePosition ?? 'left'}
            onChange={event =>
              setValue({
                imagePosition: event.target.value as 'left' | 'top',
              })
            }
          >
            <option value="left">
              <Trans message="Side" />
            </option>
            <option value="top">
              <Trans message="Top" />
            </option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">
            <Trans message="Image size" />
          </span>
          <select
            className="h-10 rounded-input border bg-transparent px-3"
            value={value?.imageSize ?? 'medium'}
            onChange={event =>
              setValue({
                imageSize: event.target.value as 'small' | 'medium' | 'large',
              })
            }
          >
            <option value="small">
              <Trans message="Small" />
            </option>
            <option value="medium">
              <Trans message="Medium" />
            </option>
            <option value="large">
              <Trans message="Large" />
            </option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">
            <Trans message="Price position" />
          </span>
          <select
            className="h-10 rounded-input border bg-transparent px-3"
            value={value?.pricePosition ?? 'inline'}
            onChange={event =>
              setValue({
                pricePosition: event.target
                  .value as BiolinkAppearanceConfigCardConfig['pricePosition'],
              })
            }
          >
            <option value="inline">
              <Trans message="Inline" />
            </option>
            <option value="right">
              <Trans message="Right" />
            </option>
            <option value="below">
              <Trans message="Below" />
            </option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">
            <Trans message="Action style" />
          </span>
          <select
            className="h-10 rounded-input border bg-transparent px-3"
            value={value?.actionStyle ?? 'text'}
            onChange={event =>
              setValue({
                actionStyle: event.target
                  .value as BiolinkAppearanceConfigCardConfig['actionStyle'],
              })
            }
          >
            <option value="text">
              <Trans message="Text" />
            </option>
            <option value="button">
              <Trans message="Button" />
            </option>
            <option value="icon">
              <Trans message="Icon" />
            </option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">
            <Trans message="Card shadow" />
          </span>
          <select
            className="h-10 rounded-input border bg-transparent px-3"
            value={value?.shadow ?? 'none'}
            onChange={event =>
              setValue({
                shadow: event.target
                  .value as BiolinkAppearanceConfigCardConfig['shadow'],
              })
            }
          >
            <option value="none">
              <Trans message="None" />
            </option>
            <option value="soft">
              <Trans message="Soft" />
            </option>
            <option value="strong">
              <Trans message="Strong" />
            </option>
            <option value="hard">
              <Trans message="Hard" />
            </option>
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm">
          <span className="flex items-center justify-between font-medium">
            <Trans message="Card radius" />
            <span className="text-muted-foreground">
              {value?.radius ?? 8}px
            </span>
          </span>
          <input
            type="range"
            min="0"
            max="32"
            value={value?.radius ?? 8}
            onChange={event => setValue({radius: Number(event.target.value)})}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="flex items-center justify-between font-medium">
            <Trans message="Image radius" />
            <span className="text-muted-foreground">
              {value?.imageRadius ?? 8}px
            </span>
          </span>
          <input
            type="range"
            min="0"
            max="32"
            value={value?.imageRadius ?? 8}
            onChange={event =>
              setValue({imageRadius: Number(event.target.value)})
            }
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="flex items-center justify-between font-medium">
            <Trans message="Border width" />
            <span className="text-muted-foreground">
              {value?.borderWidth ?? 1}px
            </span>
          </span>
          <input
            type="range"
            min="0"
            max="8"
            value={value?.borderWidth ?? 1}
            onChange={event =>
              setValue({borderWidth: Number(event.target.value)})
            }
          />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm">
        <span className="flex items-center justify-between font-medium">
          <Trans message="Card transparency" />
          <span className="text-muted-foreground">
            {value?.transparency ?? 0}%
          </span>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={value?.transparency ?? 0}
          onChange={event =>
            setValue({transparency: Number(event.target.value)})
          }
        />
      </label>
    </section>
  );
}
