import { createRouter } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { rootRoute } from './routes/__root';
import { indexRoute } from './routes/index';
import { dossierRoute } from './routes/dossiers.$id';
import { RouteErrorBoundary, RouteNotFound } from '@/shared/components/RouteErrorBoundary';

export type RouterContext = { queryClient: QueryClient };

const routeTree = rootRoute.addChildren([indexRoute, dossierRoute]);

export function createAppRouter(context: RouterContext) {
  return createRouter({
    routeTree,
    context,
    defaultErrorComponent: RouteErrorBoundary,
    defaultNotFoundComponent: RouteNotFound,
    defaultPreload: 'intent',
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter;
  }
}
