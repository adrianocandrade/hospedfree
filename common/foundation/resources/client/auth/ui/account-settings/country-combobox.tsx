import {Combobox} from '@shadcn/forms/combobox/combobox';
import {VirtualizedCombobox} from '@shadcn/forms/combobox/virtualized-combobox';
import {message} from '@ui/i18n/message';
import {useSelectedLocale} from '@ui/i18n/selected-locale';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {getCountryList} from '@ui/utils/intl/countries';
import {useMemo, useRef, useState} from 'react';

export function CountryCombobox() {
  const {trans} = useTrans();
  const {localeCode} = useSelectedLocale();
  const virtualizerRef = useRef<VirtualizedCombobox.Virtualizer | null>(null);

  const items = useMemo(
    () =>
      getCountryList(localeCode).map(country => ({
        label: country.name,
        value: country.code,
      })),
    [localeCode],
  );

  const [open, setOpen] = useState(false);

  return (
    <VirtualizedCombobox.Root
      items={items}
      open={open}
      onOpenChange={setOpen}
      virtualizerRef={virtualizerRef}
    >
      <Combobox.ButtonTrigger
        placeholder={<Trans message="Select country" />}
      />
      <Combobox.Content>
        <Combobox.InsetInput placeholder={trans(message('Search countries'))} />
        <Combobox.Empty>
          <Trans message="No countries found." />
        </Combobox.Empty>
        <VirtualizedCombobox.List
          enabled={open}
          virtualizerRef={virtualizerRef}
        >
          {(item: Combobox.GenericItem) => (
            <Combobox.Item key={item.value} value={item.value}>
              {item.label}
            </Combobox.Item>
          )}
        </VirtualizedCombobox.List>
      </Combobox.Content>
    </VirtualizedCombobox.Root>
  );
}
