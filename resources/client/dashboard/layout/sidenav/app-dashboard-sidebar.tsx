import {dashboardSidebarIcons} from '@app/dashboard/layout/sidenav/dashboard-sidebar-icons';
import {DashboardLayoutContext} from '@common/ui/dashboard/dashboard-layout-context';
import {Sidebar} from '@common/ui/dashboard/sidebar';
import {Logo} from '@common/ui/navigation/navbar/logo';
import {use} from 'react';
import {HostingSidebarSummary} from './hosting-sidebar-summary';

export function AppDashboardSidebar() {
  const {isMobileMode, leftSidebar} = use(DashboardLayoutContext);

  return (
    <Sidebar.Root
      collapsible="icon"
      side="left"
      className="pt-1.5 data-[variant=floating]:bg-background/50 dark:data-[variant=floating]:bg-card"
    >
      {isMobileMode && (
        <Sidebar.Header>
          <Sidebar.Item>
            <Logo color="auto" className="max-w-40" />
          </Sidebar.Item>
        </Sidebar.Header>
      )}
      <Sidebar.Content>
        <Sidebar.Group>
          <Sidebar.GroupContent>
            <Sidebar.MenuFromConfig
              position="dashboard-primary"
              defaultIcons={dashboardSidebarIcons}
              end={item => item.action === '/dashboard'}
            />
          </Sidebar.GroupContent>
        </Sidebar.Group>

        {leftSidebar.status === 'expanded' && <HostingSidebarSummary />}
      </Sidebar.Content>
      <Sidebar.Footer />
    </Sidebar.Root>
  );
}
