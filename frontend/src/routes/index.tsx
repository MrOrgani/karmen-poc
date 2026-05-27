import { createRoute } from '@tanstack/react-router';
import { DossiersListPage, dossiersQuery } from '@/features/dossiers-list/DossiersListPage';
import { rootRoute } from './__root';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DossiersListPage,
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(dossiersQuery),
});
