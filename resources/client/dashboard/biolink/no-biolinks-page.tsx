import {CreateBiolinkDialog} from '@app/dashboard/biolink/biolink-editor/create-biolink-dialog';
import {MeuLinkBioAssetIcon} from '@app/ui/brand-assets/meulinkbio-asset-icon';
import {DashboardLayout} from '@common/ui/dashboard/dashboard-layout';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Empty} from '@shadcn/empty/empty';
import {Trans} from '@ui/i18n/trans';
import {PlusIcon} from 'lucide-react';

export function Component() {
  return (
    <DashboardLayout.MainSection>
      <DashboardLayout.SectionHeader>
        <DashboardLayout.SidebarToggle />
        <h1 className="text-xl font-semibold">
          <Trans message="Link in bio" />
        </h1>
      </DashboardLayout.SectionHeader>

      <Empty.Root>
        <Empty.Header className="max-w-md">
          <Empty.Media>
            <MeuLinkBioAssetIcon
              name="profile-phone"
              className="size-24 drop-shadow-sm"
            />
          </Empty.Media>
          <Empty.Title>
            <Trans message="No link in bio yet" />
          </Empty.Title>
          <Empty.Description>
            <Trans message="This workspace has no link in bio yet. Create one to get started." />
          </Empty.Description>
        </Empty.Header>
        <Empty.Content>
          <CreateBiolinkDialog>
            <Dialog.Trigger
              render={<Button variant="default" color="primary" />}
            >
              <PlusIcon />
              <Trans message="Create link in bio" />
            </Dialog.Trigger>
          </CreateBiolinkDialog>
        </Empty.Content>
      </Empty.Root>
    </DashboardLayout.MainSection>
  );
}
