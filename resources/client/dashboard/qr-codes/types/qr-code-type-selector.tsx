import {
  QrCodeType,
  qrCodeTypeOptions,
} from '@app/dashboard/qr-codes/types/qr-code-types';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@shadcn/collapsible/collapsible';
import {Trans} from '@ui/i18n/trans';
import {cn} from '@ui/utils/cn';
import {ChevronDownIcon} from 'lucide-react';
import {useState} from 'react';

interface Props {
  value: QrCodeType;
  onChange: (type: QrCodeType) => void;
  disabled?: boolean;
}

export function QrCodeTypeSelector({value, onChange, disabled}: Props) {
  const [showMore, setShowMore] = useState(
    qrCodeTypeOptions.some(option => option.value === value && !option.primary),
  );
  const primaryOptions = qrCodeTypeOptions.filter(option => option.primary);
  const secondaryOptions = qrCodeTypeOptions.filter(option => !option.primary);

  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-medium">
        <Trans message="QR code type" />
      </legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {primaryOptions.map(option => (
          <TypeButton
            key={option.value}
            option={option}
            selected={value === option.value}
            disabled={disabled}
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>
      <Collapsible open={showMore} onOpenChange={setShowMore}>
        <CollapsibleTrigger
          className="mt-2 flex items-center gap-1 rounded-md text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring"
          disabled={disabled}
        >
          <Trans message="More types" />
          <ChevronDownIcon
            className={cn(
              'size-3.5 transition-transform',
              showMore && 'rotate-180',
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {secondaryOptions.map(option => (
              <TypeButton
                key={option.value}
                option={option}
                selected={value === option.value}
                disabled={disabled}
                onClick={() => onChange(option.value)}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </fieldset>
  );
}

type TypeButtonProps = {
  option: (typeof qrCodeTypeOptions)[number];
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function TypeButton({option, selected, disabled, onClick}: TypeButtonProps) {
  const Icon = option.icon;
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'group flex min-h-16 min-w-0 flex-col items-start justify-between gap-2 rounded-card-sm border px-3 py-2.5 text-left transition-colors outline-none',
        'hover:border-primary/40 hover:bg-primary/5 focus-visible:ring disabled:cursor-not-allowed disabled:opacity-50',
        selected &&
          'border-primary bg-primary/8 text-primary ring-1 ring-primary/20',
      )}
    >
      <Icon className="size-4.5 shrink-0" aria-hidden="true" />
      <span className="truncate text-xs font-medium text-foreground">
        {option.label}
      </span>
    </button>
  );
}
