import { createContext, useContext, type ReactNode } from 'react';

type CockpitContextValue = {
  dossierId: string;
};

const CockpitContext = createContext<CockpitContextValue | null>(null);

export function CockpitProvider({ dossierId, children }: { dossierId: string; children: ReactNode }) {
  return <CockpitContext.Provider value={{ dossierId }}>{children}</CockpitContext.Provider>;
}

export function useDossierId(): string {
  const ctx = useContext(CockpitContext);
  if (!ctx) throw new Error('useDossierId must be used inside <CockpitProvider>');
  return ctx.dossierId;
}

export function useOptionalDossierId(): string | undefined {
  return useContext(CockpitContext)?.dossierId;
}
