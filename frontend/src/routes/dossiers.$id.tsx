import { createRoute } from '@tanstack/react-router';
import { CockpitPage, cockpitQuery } from '@/features/cockpit/CockpitPage';
import { rootRoute } from './__root';

export const dossierRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dossiers/$id',
  component: CockpitPage,
  loader: ({ context: { queryClient }, params }) => queryClient.ensureQueryData(cockpitQuery(params.id)),
});
