import {Component as CommonLandingPageSettings} from '@common/admin/settings/landing-page-settings/landing-page-settings';
import {
  LandingPageSettingsContext,
  LandingPageSettingsContextValue,
} from '@common/admin/settings/landing-page-settings/landing-page-settings-context';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Switch} from '@shadcn/forms/switch/switch';
import {Trans} from '@ui/i18n/trans';

const contextValue: LandingPageSettingsContextValue = {
  customSections: {
    'meulinkbio-hero': {
      label: <Trans message="MeuLinkBio hero" />,
      component: StaticMarketingSectionSettings,
    },
    'meulinkbio-trust': {
      label: <Trans message="MeuLinkBio trust strip" />,
      component: StaticMarketingSectionSettings,
    },
    'meulinkbio-features': {
      label: <Trans message="MeuLinkBio features" />,
      component: StaticMarketingSectionSettings,
    },
    'meulinkbio-analytics': {
      label: <Trans message="MeuLinkBio analytics demo" />,
      component: StaticMarketingSectionSettings,
    },
    'meulinkbio-templates': {
      label: <Trans message="MeuLinkBio templates" />,
      component: StaticMarketingSectionSettings,
    },
    'meulinkbio-use-cases': {
      label: <Trans message="MeuLinkBio use cases" />,
      component: StaticMarketingSectionSettings,
    },
    'meulinkbio-tools': {
      label: <Trans message="MeuLinkBio tools bento" />,
      component: StaticMarketingSectionSettings,
    },
    'meulinkbio-faq': {
      label: <Trans message="MeuLinkBio FAQ" />,
      component: StaticMarketingSectionSettings,
    },
    'meulinkbio-final-cta': {
      label: <Trans message="MeuLinkBio final CTA" />,
      component: StaticMarketingSectionSettings,
    },
    'meulinkbio-footer': {
      label: <Trans message="MeuLinkBio footer" />,
      component: StaticMarketingSectionSettings,
    },
    stats: {
      label: <Trans message="Statistics" />,
      component: StatsSettings,
    },
  },
  heroSettings: HeroSettings,
};

export function Component() {
  return (
    <LandingPageSettingsContext.Provider value={contextValue}>
      <CommonLandingPageSettings />
    </LandingPageSettingsContext.Provider>
  );
}

function StatsSettings() {
  return (
    <div>
      <Trans message="Show global statistics on landing page." />
    </div>
  );
}

function StaticMarketingSectionSettings() {
  return (
    <div className="text-sm text-muted-foreground">
      <Trans message="This MeuLinkBio marketing section is defined in code. You can reorder or remove it here." />
    </div>
  );
}

function HeroSettings({formPrefix}: {formPrefix: string}) {
  return (
    <HookForm.Field name={`${formPrefix}.showSearchBarSlot`}>
      <Field.Label>
        <Switch />
        <Trans message="Show shorten link bar" />
      </Field.Label>
      <Field.Error />
    </HookForm.Field>
  );
}
