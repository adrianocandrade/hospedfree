import {hostingAccountsOptions} from '@app/hosting/hosting-queries';
import {HostingAccount} from '@app/hosting/hosting-types';
import {DashboardLayout} from '@common/ui/dashboard/dashboard-layout';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {Button} from '@shadcn/button/button';
import {Dropdown} from '@shadcn/dropdown/dropdown';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {cn} from '@ui/utils/cn';
import {ChevronDownIcon, ExternalLinkIcon} from 'lucide-react';
import {ReactNode} from 'react';
import {Link, Outlet, useLocation, useNavigate} from 'react-router';

export function Component() {
  const {accountId} = useRequiredParams(['accountId']);
  const query = useSuspenseQuery(hostingAccountsOptions());
  const accounts = query.data ?? [];
  const selectedAccount = accounts.find(a => `${a.id}` === accountId);

  const {pathname} = useLocation();
  const {trans} = useTrans();

  const baseUrl = `/dashboard/hosting/${accountId}`;

  const selectedTab = pathname.endsWith('domains')
    ? 'domains'
    : pathname.endsWith('files')
      ? 'files'
      : pathname.endsWith('databases')
        ? 'databases'
        : pathname.endsWith('ssl')
          ? 'ssl'
          : pathname.endsWith('tools') ||
              pathname.endsWith('credentials') ||
              pathname.endsWith('site-builder')
            ? 'tools'
            : 'overview';

  if (!selectedAccount) {
    return null; // ou um estado vazio adequado
  }

  return (
    <DashboardLayout.MainSection>
      <DashboardLayout.SectionHeader className="border-none">
        <DashboardLayout.SidebarToggle />
        <HostingSelector accounts={accounts} currentId={accountId} />

        {selectedAccount.status === 'active' && (
          <Button
            variant="outline"
            className="ml-auto shrink-0"
            nativeButton={false}
            render={
              <a
                href={`https://${selectedAccount.fqdn}`}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            <ExternalLinkIcon />
            <span className="sr-only sm:not-sr-only">
              <Trans message="Abrir site" />
            </span>
          </Button>
        )}
      </DashboardLayout.SectionHeader>

      <nav
        aria-label={trans({message: 'Navegação da hospedagem'})}
        className="compact-scrollbar overflow-x-auto border-b px-3 sm:px-6"
      >
        <div className="flex min-w-max items-center gap-1">
          <HostingNavLink to={baseUrl} selected={selectedTab === 'overview'}>
            <Trans message="Hospedagem" />
          </HostingNavLink>
          <HostingNavLink
            to={`${baseUrl}/domains`}
            selected={selectedTab === 'domains'}
          >
            <Trans message="Domínios" />
          </HostingNavLink>
          <HostingNavLink
            to={`${baseUrl}/files`}
            selected={selectedTab === 'files'}
          >
            <Trans message="Arquivos" />
          </HostingNavLink>
          <HostingNavLink
            to={`${baseUrl}/databases`}
            selected={selectedTab === 'databases'}
          >
            <Trans message="Bancos de dados" />
          </HostingNavLink>
          <HostingNavLink
            to={`${baseUrl}/ssl`}
            selected={selectedTab === 'ssl'}
          >
            <Trans message="SSL" />
          </HostingNavLink>
          <HostingNavLink
            to={`${baseUrl}/tools`}
            selected={selectedTab === 'tools'}
          >
            <Trans message="Ferramentas" />
          </HostingNavLink>
          <HostingNavLink to="/dashboard/hosting/plans" selected={false}>
            <Trans message="Planos" />
          </HostingNavLink>
          <HostingNavLink to="/dashboard/support" selected={false}>
            <Trans message="Suporte" />
          </HostingNavLink>
        </div>
      </nav>

      <section className="flex flex-auto overflow-hidden">
        <div className="compact-scrollbar min-w-0 flex-auto overflow-y-auto p-(--section-spacing)">
          <Outlet context={{account: selectedAccount}} />
        </div>
      </section>
    </DashboardLayout.MainSection>
  );
}

function HostingNavLink({
  to,
  selected,
  children,
}: {
  to: string;
  selected: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      replace={to.startsWith('/dashboard/hosting/') && !to.endsWith('/plans')}
      aria-current={selected ? 'page' : undefined}
      className={cn(
        'relative inline-flex h-10 items-center justify-center px-3 text-sm font-medium whitespace-nowrap text-foreground/60 transition-colors hover:text-foreground focus-visible:rounded-button focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary',
        selected &&
          'text-primary after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary',
      )}
    >
      {children}
    </Link>
  );
}

function HostingSelector({
  accounts,
  currentId,
}: {
  accounts: HostingAccount[];
  currentId: string;
}) {
  const navigate = useNavigate();
  const selectedAccount = accounts.find(a => `${a.id}` === currentId);

  if (!selectedAccount) return null;

  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        render={
          <Button
            variant="outline"
            className="mr-auto max-w-[calc(100vw-7rem)] min-w-0 justify-between sm:min-w-[200px]"
          />
        }
      >
        <span className="truncate">{selectedAccount.fqdn}</span>
        <ChevronDownIcon />
      </Dropdown.Trigger>
      <Dropdown.Content>
        <Dropdown.RadioGroup
          value={currentId}
          onValueChange={value => {
            navigate(`/dashboard/hosting/${value}`);
          }}
        >
          {accounts.map(account => (
            <Dropdown.RadioItem value={`${account.id}`} key={account.id}>
              {account.fqdn}
            </Dropdown.RadioItem>
          ))}
        </Dropdown.RadioGroup>
      </Dropdown.Content>
    </Dropdown.Root>
  );
}
