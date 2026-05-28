import { createRoute } from '@tanstack/react-router';
import { DossiersListPage } from '@/features/dossiers-list/DossiersListPage';
import { dossiersQuery } from '@/features/dossiers-list/api';
import { rootRoute } from './__root';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DossiersListPage,
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(dossiersQuery),
});
