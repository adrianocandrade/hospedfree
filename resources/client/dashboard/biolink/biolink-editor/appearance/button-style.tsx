import {appearanceHeaderClassnames} from '@app/dashboard/biolink/biolink-editor/appearance/header-classnames';
import {BiolinkAssetPickerDialog} from '@app/dashboard/biolink/biolink-editor/assets/biolink-asset-picker-dialog';
import {VisualOptionGrid} from '@app/dashboard/biolink/biolink-editor/visual-option-card';
import {BiolinkButtonConfig} from '@app/dashboard/biolink/biolink-editor/appearance/biolink-button-style-utils';
import {useBiolinkEditorStore} from '@app/dashboard/biolink/biolink-editor/biolink-editor-store';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {ColorField} from '@ui/color-picker/color-field';
import {Trans} from '@ui/i18n/trans';
import {cn} from '@ui/utils/cn';
import {ImageIcon, XIcon} from 'lucide-react';
import {ReactNode, useCallback} from 'react';
import {Slider} from '@shadcn/forms/slider/slider';
import {useAuth} from '@common/auth/use-auth';

export interface StyleSelectorProps {
  value?: BiolinkButtonConfig;
  onChange: (newValue: Partial<BiolinkButtonConfig>) => void;
}

export function ButtonStyle() {
  const updateAppearance = useBiolinkEditorStore(s => s.updateAppearance);
  const value = useBiolinkEditorStore(s => s.appearance?.btnConfig);

  const setValue = useCallback(
    (newValue: Partial<BiolinkButtonConfig>) => {
      updateAppearance(
        {
          btnConfig: {
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
        <Trans message="Buttons" />
      </h2>
      <div className="mt-6 flex flex-col gap-8">
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

        {/* Custom Colors */}
        <ColorSelector value={value} onChange={setValue} />

        <BlockStyleSelector value={value} onChange={setValue} />
      </div>
    </div>
  );
}

export function SliderSelector({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm font-medium">
        {label}
        <span className="text-muted-foreground">{value}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={value}
        onValueChange={v => onChange(Number(v))}
      >
        <Slider.Control>
          <Slider.Track>
            <Slider.Indicator />
          </Slider.Track>
          <Slider.Thumb />
        </Slider.Control>
      </Slider>
    </div>
  );
}

export function StyleSelector({value, onChange}: StyleSelectorProps) {
  const selectedVariant = value?.variant ?? 'solid';
  const {isSubscribed} = useAuth();
  const options = [
    {
      value: 'solid',
      label: <Trans message="Fill" />,
      preview: <ButtonVariantPreview variant="solid" />,
    },
    {
      value: 'outline',
      label: <Trans message="Outline" />,
      preview: <ButtonVariantPreview variant="outline" />,
    },
    {
      value: 'glass',
      label: <Trans message="Glass" />,
      preview: <ButtonVariantPreview variant="glass" />,
    },
    {
      value: 'dashed',
      label: <Trans message="Dashed" />,
      preview: <ButtonVariantPreview variant="dashed" />,
    },
    {
      value: 'underline',
      label: <Trans message="Underline" />,
      preview: <ButtonVariantPreview variant="underline" />,
    },
    {
      value: 'top-bottom-line',
      label: <Trans message="Top & Bottom" />,
      preview: <ButtonVariantPreview variant="top-bottom-line" />,
    },
    {
      value: 'cut-corner',
      label: <Trans message="Cut Corner" />,
      preview: <ButtonVariantPreview variant="cut-corner" />,
      locked: !isSubscribed,
    },
  ] as const;

  return (
    <div>
      <h3 className={appearanceHeaderClassnames.h3}>
        <Trans message="Shape" />
      </h3>

      <VisualOptionGrid
        ariaLabel="Button shape"
        value={selectedVariant}
        onChange={variant => onChange({...value, variant})}
        items={options.map(option => ({...option, kind: 'thumbnail' as const}))}
      />
    </div>
  );
}

export function ShadowSelector({value, onChange}: StyleSelectorProps) {
  const selectedValue = value?.shadow ?? 'none';
  return (
    <div>
      <h3 className={appearanceHeaderClassnames.h3}>
        <Trans message="Shadow" />
      </h3>
      <VisualOptionGrid
        ariaLabel="Button shadow"
        value={selectedValue}
        onChange={shadow => onChange({...value, shadow})}
        items={[
          {
            value: 'none',
            label: <Trans message="None" />,
            preview: (
              <ShadowPreview
                shadow="none"
                color={value?.color || 'var(--primary)'}
              />
            ),
          },
          {
            value: 'soft',
            label: <Trans message="Soft" />,
            preview: (
              <ShadowPreview
                shadow="soft"
                color={value?.shadowColor || value?.color || '#111827'}
              />
            ),
          },
          {
            value: 'strong',
            label: <Trans message="Strong" />,
            preview: (
              <ShadowPreview
                shadow="strong"
                color={value?.shadowColor || value?.color || '#111827'}
              />
            ),
          },
          {
            value: 'hard',
            label: <Trans message="Hard" />,
            preview: (
              <ShadowPreview
                shadow="hard"
                color={value?.shadowColor || value?.color || '#111827'}
              />
            ),
          },
          {
            value: 'neon',
            label: <Trans message="Neon" />,
            preview: (
              <ShadowPreview
                shadow="neon"
                color={value?.shadowColor || value?.color || '#111827'}
              />
            ),
          },
          {
            value: 'inset',
            label: <Trans message="Inset" />,
            preview: (
              <ShadowPreview
                shadow="inset"
                color={value?.shadowColor || value?.color || '#111827'}
              />
            ),
          },
          {
            value: 'spread',
            label: <Trans message="Spread" />,
            preview: (
              <ShadowPreview
                shadow="spread"
                color={value?.shadowColor || value?.color || '#111827'}
              />
            ),
          },
          {
            value: 'double',
            label: <Trans message="Double" />,
            preview: (
              <ShadowPreview
                shadow="double"
                color={value?.shadowColor || value?.color || '#111827'}
              />
            ),
          },
          {
            value: 'glow',
            label: <Trans message="Glow" />,
            preview: (
              <ShadowPreview
                shadow="glow"
                color={value?.shadowColor || value?.color || '#111827'}
              />
            ),
          },
        ]}
      />
    </div>
  );
}

function ButtonVariantPreview({variant}: {variant: string}) {
  return (
    <span
      className={cn(
        'block h-7 w-full max-w-32 bg-foreground',
        variant === 'outline' && 'border-2 border-foreground bg-transparent',
        variant === 'glass' &&
          'border border-white/60 bg-white/20 backdrop-blur-sm',
        variant === 'dashed' &&
          'border-2 border-dashed border-foreground bg-transparent',
        variant === 'underline' &&
          'border-b-2 border-foreground bg-transparent',
        variant === 'top-bottom-line' &&
          'border-y-2 border-foreground bg-transparent',
      )}
      style={
        variant === 'cut-corner'
          ? {
              clipPath:
                'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            }
          : undefined
      }
    />
  );
}

function ShadowPreview({shadow, color}: {shadow: string; color: string}) {
  return (
    <span
      className="block size-8 rounded-md bg-primary"
      style={{
        boxShadow:
          shadow === 'soft'
            ? `0 5px 12px color-mix(in srgb, ${color} 35%, transparent)`
            : shadow === 'strong'
              ? `0 8px 18px color-mix(in srgb, ${color} 55%, transparent)`
              : shadow === 'hard'
                ? `5px 5px 0 color-mix(in srgb, ${color} 70%, transparent)`
                : shadow === 'neon'
                  ? `0 0 4px ${color}, 0 0 10px ${color}`
                  : shadow === 'inset'
                    ? `inset 2px 2px 4px rgba(0,0,0,0.4)`
                    : shadow === 'spread'
                      ? `0 8px 20px rgba(0,0,0,0.2)`
                      : shadow === 'double'
                        ? `3px 3px 0 ${color}, 6px 6px 0 color-mix(in srgb, ${color} 50%, transparent)`
                        : shadow === 'glow'
                          ? `0 4px 15px ${color}`
                          : 'none',
      }}
    />
  );
}

export function ColorSelector({value, onChange}: StyleSelectorProps) {
  const setColor = (key: keyof BiolinkButtonConfig, newValue: string) => {
    onChange({...value, [key]: newValue});
  };

  return (
    <div className="flex flex-col gap-6">
      <h3 className={appearanceHeaderClassnames.h3}>
        <Trans message="Colors" />
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <ColorField
          label={<Trans message="Color" />}
          value={value?.color || '#000'}
          onChange={newValue => setColor('color', newValue)}
        />
        <ColorField
          label={<Trans message="Text color" />}
          value={value?.textColor || '#000'}
          onChange={newValue => setColor('textColor', newValue)}
        />
        <ColorField
          label={<Trans message="Border color" />}
          value={value?.borderColor || value?.color || '#000'}
          onChange={newValue => setColor('borderColor', newValue)}
        />
        <ColorField
          label={<Trans message="Icon color" />}
          value={value?.iconColor || value?.textColor || '#000'}
          onChange={newValue => setColor('iconColor', newValue)}
        />
        <ColorField
          label={<Trans message="Shadow color" />}
          value={value?.shadowColor || '#000'}
          onChange={newValue => setColor('shadowColor', newValue)}
        />
      </div>
    </div>
  );
}

export function BlockStyleSelector({value, onChange}: StyleSelectorProps) {
  const current = value?.blockStyle;

  return (
    <div>
      <h3 className={appearanceHeaderClassnames.h3}>
        <Trans message="Block style" />
      </h3>
      <div className="flex items-center gap-3">
        <BiolinkAssetPickerDialog
          value={current}
          categories={['blockStyles']}
          title={<Trans message="Choose block style" />}
          onSelect={path => onChange({...value, blockStyle: path ?? undefined})}
        >
          <Dialog.Trigger render={<Button variant="outline" />}>
            <ImageIcon />
            {current ? (
              <Trans message="Change style" />
            ) : (
              <Trans message="Choose style" />
            )}
          </Dialog.Trigger>
        </BiolinkAssetPickerDialog>
        {current ? (
          <>
            <div className="flex h-10 w-24 items-center justify-center rounded-card-sm border bg-accent p-1">
              <img
                src={current}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onChange({...value, blockStyle: undefined})}
            >
              <XIcon />
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function ButtonStyleItem({
  label,
  active,
  onClick,
  children,
  className,
}: {
  label?: ReactNode;
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'rounded-panel bg-alt flex h-16 w-full items-center justify-center border px-6 transition-colors',
          active
            ? 'border-primary ring-1 ring-primary'
            : 'hover:border-foreground/50',
        )}
      >
        {children}
      </button>
      {label && (
        <span className="text-center text-xs font-medium">{label}</span>
      )}
    </div>
  );
}
