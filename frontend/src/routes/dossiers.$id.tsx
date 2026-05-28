import { createRoute } from '@tanstack/react-router';
import { CockpitPage } from '@/features/cockpit/CockpitPage';
import { cockpitQuery } from '@/features/cockpit/api';
import { rootRoute } from './__root';

export const dossierRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dossiers/$id',
  component: CockpitPage,
  loader: ({ context: { queryClient }, params }) => queryClient.ensureQueryData(cockpitQuery(params.id)),
});
