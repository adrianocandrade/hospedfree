import {sharedDashboardIcons} from '@app/dashboard/layout/sidenav/dashboard-sidebar-icons';
import {LandingPageStats} from '@app/landing/landing-page-stats';
import {LpHeader} from '@app/landing/sections/lp-header';
import {LpHero} from '@app/landing/sections/lp-hero';
import {LpTrustBar} from '@app/landing/sections/lp-trust-bar';
import {LpBenefits} from '@app/landing/sections/lp-benefits';
import {LpFeaturesGrid} from '@app/landing/sections/lp-features-grid';
import {LpTemplates} from '@app/landing/sections/lp-templates';
import {LpSharing} from '@app/landing/sections/lp-sharing';
import {LpAgencies} from '@app/landing/sections/lp-agencies';
import {LpFaq} from '@app/landing/sections/lp-faq';
import {LpBlog} from '@app/landing/sections/lp-blog';
import {LpFinalCta} from '@app/landing/sections/lp-final-cta';
import {LpFooter} from '@app/landing/sections/lp-footer';
import {useLandingPageData} from '@app/landing/use-landing-page-data';
import {LandingPage as CommonLandingPage} from '@common/ui/landing-page/landing-page';
import {LandingPageContext} from '@common/ui/landing-page/landing-page-context';
import {
  ALargeSmallIcon,
  ArrowLeftRightIcon,
  CalendarIcon,
  ChartColumnBigIcon,
  FastForwardIcon,
  GripVerticalIcon,
  KeyIcon,
  SettingsIcon,
  SwatchBookIcon,
} from 'lucide-react';
import {ComponentType} from 'react';

const defaultIcons = {
  ...sharedDashboardIcons,
  insights: <ChartColumnBigIcon />,
  back_half: <ALargeSmallIcon />,
  settings: <SettingsIcon />,
  retargeting: <ArrowLeftRightIcon />,
  api: <KeyIcon />,
  'drag-handle': <GripVerticalIcon />,
  brand: <SwatchBookIcon />,
  date: <CalendarIcon />,
  fast: <FastForwardIcon />,
};

const sectionRenderers: Record<
  string,
  ComponentType<{config: any; index: number}>
> = {
  stats: LandingPageStats,
  // New redesign sections
  'meulinkbio-hero': MeuLinkBioHeroWrapper,
  'meulinkbio-trust': MeuLinkBioTrustWrapper,
  'meulinkbio-features': MeuLinkBioFeaturesWrapper,
  'meulinkbio-analytics': MeuLinkBioAnalyticsWrapper,
  'meulinkbio-templates': MeuLinkBioTemplatesWrapper,
  'meulinkbio-use-cases': MeuLinkBioUseCasesWrapper,
  'meulinkbio-tools': MeuLinkBioToolsWrapper,
  'meulinkbio-faq': MeuLinkBioFaqWrapper,
  'meulinkbio-final-cta': MeuLinkBioFinalCtaWrapper,
  'meulinkbio-footer': MeuLinkBioFooterWrapper,
};

// Wrappers that ignore config/index props since our new sections manage their own data
function MeuLinkBioHeroWrapper() {
  return (
    <>
      <LpHeader />
      <LpHero />
    </>
  );
}

function MeuLinkBioTrustWrapper() {
  return <LpTrustBar />;
}

function MeuLinkBioFeaturesWrapper() {
  return (
    <>
      <LpBenefits />
      <LpFeaturesGrid />
    </>
  );
}

function MeuLinkBioAnalyticsWrapper() {
  return <LpSharing />;
}

function MeuLinkBioTemplatesWrapper() {
  return <LpTemplates />;
}

function MeuLinkBioUseCasesWrapper() {
  return <LpBlog />;
}

function MeuLinkBioToolsWrapper() {
  return <LpAgencies />;
}

function MeuLinkBioFaqWrapper() {
  return <LpFaq />;
}

function MeuLinkBioFinalCtaWrapper() {
  return <LpFinalCta />;
}

function MeuLinkBioFooterWrapper() {
  return <LpFooter />;
}

export function Component() {
  const query = useLandingPageData();

  return (
    <LandingPageContext.Provider
      value={{
        defaultIcons,
        sections: query.data.sections ?? [],
        sectionRenderers,
        adSlotAfterHero: 'landing',
      }}
    >
      <CommonLandingPage />
    </LandingPageContext.Provider>
  );
}
