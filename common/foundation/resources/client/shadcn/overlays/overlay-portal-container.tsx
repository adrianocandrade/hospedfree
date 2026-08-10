'use client';

import {createContext, ReactNode, useContext} from 'react';

type OverlayPortalContainerContextValue = {
  container: HTMLElement | null;
  contained: boolean;
};

const OverlayPortalContainerContext =
  createContext<OverlayPortalContainerContextValue | null>(null);

export function OverlayPortalContainerProvider({
  children,
  container,
}: {
  children: ReactNode;
  container: HTMLElement | null;
}) {
  return (
    <OverlayPortalContainerContext.Provider
      value={{container, contained: !!container}}
    >
      {children}
    </OverlayPortalContainerContext.Provider>
  );
}

export function useOverlayPortalContainer() {
  return useContext(OverlayPortalContainerContext);
}
