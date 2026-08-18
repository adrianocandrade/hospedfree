import {ProductEclipseShell} from '@app/landing/product-eclipse-shell';
import {cn} from '@ui/utils/cn';
import type {ComponentProps} from 'react';
import './public-editorial.css';

type PublicContentShellProps = ComponentProps<typeof ProductEclipseShell>;

export function PublicContentShell({
  children,
  className,
  mainClassName,
  ...props
}: PublicContentShellProps) {
  return (
    <ProductEclipseShell
      className={cn('lp hf-editorial', className)}
      mainClassName={cn('hf-editorial-main', mainClassName)}
      {...props}
    >
      {children}
    </ProductEclipseShell>
  );
}
