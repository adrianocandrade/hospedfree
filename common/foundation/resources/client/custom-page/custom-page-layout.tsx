import {PublicContentShell} from '@app/landing/public-content-shell';
import {retrieveCustomPageOptions} from '@common/admin/custom-pages/custom-pages-queries';
import {CustomPageBody} from '@common/custom-page/custom-page-body';
import {PageMetaTags} from '@common/http/page-meta-tags';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useSuspenseQuery} from '@tanstack/react-query';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';

export function Component() {
  const {pageSlug} = useRequiredParams(['pageSlug']);
  const query = useSuspenseQuery({
    ...retrieveCustomPageOptions(pageSlug),
    initialData: () => {
      const data = getBootstrapData().loaders?.customPage;
      if (data?.data && data.data.slug === pageSlug) {
        return data;
      }
    },
  });

  return (
    <PublicContentShell>
      <PageMetaTags query={query} />
      <CustomPageBody page={query.data.data} />
    </PublicContentShell>
  );
}
