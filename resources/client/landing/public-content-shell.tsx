import {LpFooter} from '@app/landing/sections/lp-footer';
import {LpHeader} from '@app/landing/sections/lp-header';
import {cn} from '@ui/utils/cn';
import {ComponentProps, ReactNode} from 'react';

interface PublicContentShellProps extends ComponentProps<'div'> {
  children: ReactNode;
  mainClassName?: string;
}

export function PublicContentShell({
  children,
  className,
  mainClassName,
  ...props
}: PublicContentShellProps) {
  return (
    <div
      className={cn(
        'lp flex min-h-screen flex-col overflow-x-clip bg-[var(--lp-surface)] text-[var(--lp-text)]',
        className,
      )}
      {...props}
    >
      <LpHeader />
      <main className={cn('flex-auto', mainClassName)}>{children}</main>
      <LpFooter />
    </div>
  );
}
