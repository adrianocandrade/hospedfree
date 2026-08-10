import {getCountryList} from '@ui/utils/intl/countries';
import memoize from 'nano-memoize';

export const getLanguageList = memoize((lang: string = 'en') => {
  const formatter = new Intl.DisplayNames([lang], {type: 'language'});
  const countries = getCountryList(lang);
  const languages = [];
  const portugueseRegionalLocales = [
    {code: 'pt-BR', fallbackName: 'Portuguese (Brazil)'},
    {code: 'pt-PT', fallbackName: 'Portuguese (Portugal)'},
  ];

  const usedLangCodes: string[] = [];
  for (let i = 0; i < countries.length; i++) {
    const countryCode = countries[i].code.toLowerCase();
    const langCode = new Intl.Locale('und', {region: countryCode}).maximize()
      .language;
    try {
      const langName = formatter.of(langCode);
      if (
        langName &&
        !usedLangCodes.includes(langCode) &&
        langCode !== langName
      ) {
        usedLangCodes.push(langCode);
        languages.push({code: langCode, name: langName});
      }
    } catch {
      // Some region-derived language codes are not supported by Intl.
    }
  }

  const regionalLocales = portugueseRegionalLocales.map(locale => ({
    code: locale.code,
    name: formatter.of(locale.code) || locale.fallbackName,
  }));

  return [
    ...languages.filter(language => language.code !== 'pt'),
    ...regionalLocales,
  ].sort((a, b) => a.name.localeCompare(b.name, lang));
});
